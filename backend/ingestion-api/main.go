package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

const overridesDir = "/data/overrides/"
const maxPayloadSize = 5 * 1024 * 1024 // 5 MB

type Tag struct {
	K string `xml:"k,attr"`
	V string `xml:"v,attr"`
}

type Node struct {
	ID   int64 `xml:"id,attr"`
	Tags []Tag `xml:"tag"`
}

type Way struct {
	ID   int64 `xml:"id,attr"`
	Tags []Tag `xml:"tag"`
}

type OSM struct {
	XMLName xml.Name `xml:"osm"`
	Nodes   []Node   `xml:"node"`
	Ways    []Way    `xml:"way"`
}

// Job represents a background recompilation job status
type Job struct {
	ID        string    `json:"job_id"`
	Status    string    `json:"status"` // pending, compiling, completed, failed
	Logs      string    `json:"logs"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SafeJobRegistry struct {
	mu   sync.RWMutex
	jobs map[string]*Job
}

var jobRegistry = SafeJobRegistry{
	jobs: make(map[string]*Job),
}

func (r *SafeJobRegistry) Get(id string) (*Job, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	j, exists := r.jobs[id]
	if !exists {
		return nil, false
	}
	copyJob := *j
	return &copyJob, true
}

func (r *SafeJobRegistry) Set(id string, status string, logs string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	j, exists := r.jobs[id]
	if !exists {
		r.jobs[id] = &Job{
			ID:        id,
			Status:    status,
			Logs:      logs,
			UpdatedAt: time.Now(),
		}
	} else {
		j.Status = status
		j.Logs = logs
		j.UpdatedAt = time.Now()
	}
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/v1/ingest-override", handleIngestOverride)
	mux.HandleFunc("GET /api/v1/ingest-status/{job_id}", handleIngestStatus)
	
	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	fmt.Println("Ingestion API listening on :8081")
	if err := http.ListenAndServe(":8081", mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func validateAndSanitizeOSM(osmData *OSM) error {
	// Validate Nodes
	for _, n := range osmData.Nodes {
		if n.ID >= 0 {
			return fmt.Errorf("invalid Schema: All Nodes must have negative IDs to prevent graph collision (found %d)", n.ID)
		}
		for _, t := range n.Tags {
			if strings.Contains(strings.ToLower(t.V), "<script>") || strings.Contains(strings.ToLower(t.K), "<script>") {
				return fmt.Errorf("XSS payload detected in tag")
			}
		}
	}

	// Validate Ways
	for _, w := range osmData.Ways {
		if w.ID >= 0 {
			return fmt.Errorf("invalid Schema: All Ways must have negative IDs to prevent graph collision (found %d)", w.ID)
		}
		for _, t := range w.Tags {
			if strings.Contains(strings.ToLower(t.V), "<script>") || strings.Contains(strings.ToLower(t.K), "<script>") {
				return fmt.Errorf("XSS payload detected in tag")
			}
		}
	}

	return nil
}

func handleIngestOverride(w http.ResponseWriter, r *http.Request) {
	// 1. Limit Reader to prevent Memory Exhaustion (XML Bomb / Billion Laughs mitigation)
	r.Body = http.MaxBytesReader(w, r.Body, maxPayloadSize)

	// Read payload
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body or payload too large", http.StatusRequestEntityTooLarge)
		return
	}
	defer r.Body.Close()

	// 2. Safe XML Unmarshaling
	var osmData OSM
	err = xml.Unmarshal(body, &osmData)
	if err != nil {
		http.Error(w, "Invalid XML format", http.StatusBadRequest)
		return
	}

	// 3. Structural Validation & Sanitization
	if err := validateAndSanitizeOSM(&osmData); err != nil {
		log.Printf("WARNING: Payload rejected. %v\n", err)
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	// 4. Save to /data/overrides/
	xmlContent := string(body)
	err = os.MkdirAll(overridesDir, 0755)
	if err != nil {
		http.Error(w, "Failed to create overrides directory", http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("fixes_%d.osm", time.Now().UnixNano())
	filePath := overridesDir + filename

	err = os.WriteFile(filePath, []byte(xmlContent), 0644)
	if err != nil {
		http.Error(w, "Failed to write override file", http.StatusInternalServerError)
		return
	}
	
	log.Printf("Successfully saved override to %s\n", filePath)

	// 5. Generate Job ID and stage job
	jobID := fmt.Sprintf("job_%d", time.Now().UnixNano())
	jobRegistry.Set(jobID, "pending", "Job staged. Starting background OSRM compilation...")

	// 6. Goroutine Orchestration: Trigger bash script in the background
	go executeMergeAndRestart(jobID)

	// 7. Respond to frontend immediately with 202 Accepted and Job ID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "accepted",
		"job_id":  jobID,
		"message": "Graph compilation started.",
	})
}

func handleIngestStatus(w http.ResponseWriter, r *http.Request) {
	jobID := r.PathValue("job_id")
	if jobID == "" {
		http.Error(w, "Missing job_id path parameter", http.StatusBadRequest)
		return
	}

	job, exists := jobRegistry.Get(jobID)
	if !exists {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job)
}

func executeMergeAndRestart(jobID string) {
	log.Printf("[%s] Starting background OSRM recompilation...\n", jobID)
	jobRegistry.Set(jobID, "compiling", "Compiling road networks and customizing routing weights...")
	
	cmd := exec.Command("/scripts/merge-and-restart.sh")
	
	// Capture output for logging
	out, err := cmd.CombinedOutput()
	if err != nil {
		errMsg := fmt.Sprintf("ERROR during recompilation: %v\nOutput:\n%s", err, string(out))
		log.Printf("[%s] %s\n", jobID, errMsg)
		jobRegistry.Set(jobID, "failed", errMsg)
		return
	}
	
	successMsg := fmt.Sprintf("Recompilation Successful:\n%s", string(out))
	log.Printf("[%s] %s\n", jobID, successMsg)
	jobRegistry.Set(jobID, "completed", successMsg)
}
