// This utility converts GeoJSON from the Drawing tool into raw OSM XML
// allowing the backend to ingest the new streets or policies physically.

export const generateOsmXmlFromGeojson = (featureCollection: any): string => {
  let xml = `<?xml version='1.0' encoding='UTF-8'?>\n`;
  xml += `<osm version="0.6" generator="Interactive_Maps_Admin_Studio">\n`;

  let nodeId = -1;
  let wayId = -10;

  for (const feature of featureCollection.features) {
    if (feature.geometry.type === 'LineString') {
      const nodeRefs: number[] = [];

      // Generate nodes
      for (const coord of feature.geometry.coordinates) {
        const lon = coord[0];
        const lat = coord[1];
        const currentId = nodeId--;
        nodeRefs.push(currentId);
        xml += `  <node id="${currentId}" lat="${lat}" lon="${lon}" visible="true" />\n`;
      }

      // Generate way
      xml += `  <way id="${wayId--}" visible="true">\n`;
      for (const ref of nodeRefs) {
        xml += `    <nd ref="${ref}" />\n`;
      }
      // Tag it as a local overlay highway for OSRM to ingest
      xml += `    <tag k="highway" v="residential" />\n`; 
      xml += `    <tag k="name" v="Admin Overridden Setup" />\n`;
      xml += `  </way>\n`;
    }
  }

  xml += `</osm>`;
  return xml;
};

export const downloadOsmResource = (xmlContent: string) => {
  const blob = new Blob([xmlContent], { type: "text/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fixes.osm";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export interface JobStatus {
  job_id: string;
  status: string; // pending, compiling, completed, failed
  logs: string;
  updated_at: string;
}

export const uploadOverrides = async (xmlContent: string): Promise<string> => {
  const response = await fetch('/api/v1/ingest-override', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: xmlContent,
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }
  
  const data = await response.json();
  return data.job_id;
};

export const getIngestStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await fetch(`/api/v1/ingest-status/${jobId}`);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to fetch status for ${jobId}`);
  }
  return response.json();
};
