package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIngestOverride(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/ingest-override", handleIngestOverride)

	tests := []struct {
		name           string
		payload        string
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "Valid Payload Negative IDs",
			payload: `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Interactive_Maps">
  <node id="-1" lat="33.513" lon="36.276">
    <tag k="name" v="Damascus Road"/>
  </node>
</osm>`,
			expectedStatus: http.StatusAccepted,
			expectedBody:   "accepted",
		},
		{
			name: "Invalid Positive Node ID",
			payload: `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Interactive_Maps">
  <node id="10" lat="33.513" lon="36.276">
  </node>
</osm>`,
			expectedStatus: http.StatusForbidden,
			expectedBody:   "invalid Schema: All Nodes must have negative IDs",
		},
		{
			name: "Invalid Positive Way ID",
			payload: `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Interactive_Maps">
  <way id="100">
    <nd ref="-1"/>
  </way>
</osm>`,
			expectedStatus: http.StatusForbidden,
			expectedBody:   "invalid Schema: All Ways must have negative IDs",
		},
		{
			name: "XSS Injection in Value",
			payload: `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Interactive_Maps">
  <node id="-2" lat="33.513" lon="36.276">
    <tag k="name" v="&lt;script&gt;alert('xss')&lt;/script&gt;"/>
  </node>
</osm>`,
			expectedStatus: http.StatusForbidden,
			expectedBody:   "XSS payload detected",
		},
		{
			name: "XSS Injection in Key",
			payload: `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Interactive_Maps">
  <node id="-2" lat="33.513" lon="36.276">
    <tag k="&lt;script&gt;alert(1)&lt;/script&gt;" v="value"/>
  </node>
</osm>`,
			expectedStatus: http.StatusForbidden,
			expectedBody:   "XSS payload detected",
		},
		{
			name: "Malformed XML",
			payload: `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Interactive_Maps">
  <node id="-2">
</osm>`,
			expectedStatus: http.StatusBadRequest,
			expectedBody:   "Invalid XML format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest("POST", "/api/v1/ingest-override", bytes.NewBufferString(tt.payload))
			if err != nil {
				t.Fatalf("Could not create request: %v", err)
			}

			rr := httptest.NewRecorder()
			mux.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v",
					status, tt.expectedStatus)
			}

			if !strings.Contains(rr.Body.String(), tt.expectedBody) {
				t.Errorf("handler returned unexpected body: got %v want %v",
					rr.Body.String(), tt.expectedBody)
			}
		})
	}
}

func TestPayloadTooLarge(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/ingest-override", handleIngestOverride)

	// Create a payload larger than 5MB
	largePayload := make([]byte, maxPayloadSize+100)
	
	req, err := http.NewRequest("POST", "/api/v1/ingest-override", bytes.NewBuffer(largePayload))
	if err != nil {
		t.Fatalf("Could not create request: %v", err)
	}

	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusRequestEntityTooLarge {
		t.Errorf("handler returned wrong status code for large payload: got %v want %v",
			status, http.StatusRequestEntityTooLarge)
	}
}

func TestIngestStatus(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/ingest-status/{job_id}", handleIngestStatus)

	// Setup a mock job in registry
	mockJobID := "job_test_123"
	jobRegistry.Set(mockJobID, "compiling", "Stage 1: compiling...")

	req, err := http.NewRequest("GET", "/api/v1/ingest-status/"+mockJobID, nil)
	if err != nil {
		t.Fatalf("Could not create request: %v", err)
	}

	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	expectedContent := `"status":"compiling"`
	if !strings.Contains(rr.Body.String(), expectedContent) {
		t.Errorf("handler returned unexpected body: got %v want it to contain %v",
			rr.Body.String(), expectedContent)
	}
}
