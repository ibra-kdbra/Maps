import { useEffect, useRef, useCallback, useState } from "react";
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";

// Fix Middle Eastern Arabic layout fragmentation completely natively
maplibregl.setRTLTextPlugin(
  'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
  null as any
);

// Register PMTiles protocol globally
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

import { useMapStore } from "../store/mapStore";
import { useRouting } from "../hooks/useRouting";
import DrawControl from "./DrawControl";
import { generateOsmXmlFromGeojson, downloadOsmResource, uploadOverrides, getIngestStatus } from "../utils/osmExporter";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import { toast } from "react-toastify";
import { reverseGeocode, autocompleteLocation, AutocompleteSuggestion } from "../utils/geocode";

interface MapProps {
  zoomTo: [number, number] | null;
}

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} meters`;
  return `${(meters / 1000).toFixed(2)} km`;
};

const formatDuration = (seconds: number) => {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs} hr ${remainingMins} min`;
};

const MapComponent = ({ zoomTo }: MapProps) => {
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  
  const { currentLayer, availableLayers, setCurrentLayer } = useMapStore();
  const waypoints = useMapStore(state => state.route.waypoints);
  const addWaypoint = useMapStore(state => state.addWaypoint);
  const clearWaypoints = useMapStore(state => state.clearWaypoints);
  
  // Custom offline routing hook
  const { routeGeoJSON, distance, duration } = useRouting(waypoints);

  // Drawing state
  const [features, setFeatures] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'navigation' | 'admin'>('navigation');
  const [drawMode, setDrawMode] = useState<'draw' | 'select'>('draw');

  // OSRM compilation job tracking states
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<string>("");
  const [showStatusPanel, setShowStatusPanel] = useState<boolean>(false);

  // Offline Geocoding Autocomplete States
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 1) {
      const results = await autocompleteLocation(val);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (sugg: AutocompleteSuggestion) => {
    setSearchQuery(sugg.label);
    setShowSuggestions(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [sugg.coordinates[1], sugg.coordinates[0]],
        zoom: 14,
        essential: true
      });
    }

    addWaypoint([sugg.coordinates[0], sugg.coordinates[1]]);
    toast.success(`Zoomed to: ${sugg.label}`);
  };

  useEffect(() => {
    if (!activeJobId) return;

    let intervalId = setInterval(async () => {
      try {
        const status = await getIngestStatus(activeJobId);
        setJobStatus(status.status);
        setJobLogs(status.logs);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(intervalId);
          // Wait 5 seconds and auto-dismiss on success
          if (status.status === 'completed') {
            setTimeout(() => {
              setShowStatusPanel(false);
              setActiveJobId(null);
              setJobStatus(null);
              setJobLogs("");
            }, 5000);
          }
        }
      } catch (err: any) {
        console.error("Error polling job status:", err);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [activeJobId]);

  const handleMapClick = async (event: any) => {
    if (activeTab === 'admin') return; 
    const { lng, lat } = event.lngLat;
    if (lng && lat) {
      addWaypoint([lat, lng]);
      
      try {
        const address = await reverseGeocode(lat, lng);
        toast.info(`Waypoint added near: ${address}`, {
          position: "bottom-center",
          autoClose: 3500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored"
        });
      } catch (err) {
        console.error("Failed to reverse geocode waypoint:", err);
      }
    }
  };

  useEffect(() => {
    if (zoomTo && mapRef.current) {
      mapRef.current.flyTo({ center: [zoomTo[1], zoomTo[0]], zoom: 12 });
    }
  }, [zoomTo]);

  useEffect(() => {
    if (activeTab === 'navigation') {
      try { drawRef.current?.changeMode('static'); } catch (e) {}
    } else {
      try { drawRef.current?.changeMode('simple_select'); } catch (e) {}
      setDrawMode('select');
    }
  }, [activeTab]);

  const onUpdateFeatures = useCallback((e: any) => {
    setFeatures((currFeatures: any) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
  }, []);

  const onDeleteFeatures = useCallback((e: any) => {
    setFeatures((currFeatures: any) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);

  const handleSaveOverrides = async () => {
    const geoJSON = {
      type: "FeatureCollection",
      features: Object.values(features)
    };
    if (geoJSON.features.length === 0) {
      alert("No geometry traced. Please draw lines representing roads.");
      return;
    }
    const xml = generateOsmXmlFromGeojson(geoJSON);
    downloadOsmResource(xml);
    
    try {
      setShowStatusPanel(true);
      setJobStatus("pending");
      setJobLogs("Uploading road overrides to server...");
      const jobId = await uploadOverrides(xml);
      setActiveJobId(jobId);
    } catch (err: any) {
      setJobStatus("failed");
      setJobLogs(`Upload failed: ${err.message}`);
    }
  };

  const handleTriggerDraw = () => {
    drawRef.current?.changeMode('draw_line_string');
    setDrawMode('draw');
  };

  const handleTriggerSelect = () => {
    drawRef.current?.changeMode('simple_select');
    setDrawMode('select');
  };

  const handleTriggerTrash = () => {
    drawRef.current?.trash();
  };

  // Find the selected layer
  const mapStyleUrl = availableLayers.find(layer => layer.id === currentLayer)?.url || availableLayers[0].url;

  return (
    <div className="relative h-screen w-full bg-slate-100 font-sans text-slate-900">
      
      {/* 
        Utilitarian Minimalist Side Console (Uber / Apple Maps inspired)
      */}
      <div className="absolute top-4 left-4 z-10 w-96 bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 text-white p-4">
          <h2 className="font-semibold text-lg tracking-tight">National Logistics Map</h2>
          <p className="text-xs text-slate-400 mt-1">Enterprise Routing Engine & Fleet Control</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'navigation' ? 'bg-white text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('navigation')}
          >
            Route Tester
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'admin' ? 'bg-white text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('admin')}
          >
            Map Admin Editor
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {activeTab === 'navigation' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Fleet Route Simulation</h3>
                
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded mb-4 text-xs text-indigo-800 leading-relaxed">
                  <b>Usage:</b> Click anywhere on the map to define Point A. Click again to define Point B. The underlying OSRM algorithm will instantly trace the driving path calculating distance and localized ETA.
                </div>

                {/* Offline Autocomplete Geocoding Search */}
                <div className="relative mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Location Search (Offline)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                      placeholder="Type place name (e.g. Damascus)..."
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-lg py-2.5 pl-3 pr-8 outline-none transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[1010] max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {suggestions.map((sugg, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectSuggestion(sugg)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 transition-colors flex flex-col"
                        >
                          <span className="font-semibold text-slate-900 truncate">{sugg.label}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{sugg.coordinates[0].toFixed(5)}, {sugg.coordinates[1].toFixed(5)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <div className="text-xs font-semibold bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600">
                    Dropped Waypoints: {waypoints.length}
                  </div>
                  {waypoints.length > 0 && (
                    <button 
                      onClick={clearWaypoints}
                      className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 border border-red-100 px-2 py-1 rounded transition-colors"
                    >
                      Reset Route
                    </button>
                  )}
                </div>
              </div>

              {distance !== null && duration !== null && (
                <div className="pt-4 pb-2 border-y border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Mathematical Output</h3>
                  <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-lg shadow-inner">
                    <div>
                      <div className="text-xl font-bold tracking-tighter">{formatDuration(duration)}</div>
                      <div className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">EST. TIME (ETA)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold tracking-tight text-emerald-400">{formatDistance(distance)}</div>
                      <div className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">DRIVING DISTANCE</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">Basemap Graphic Engine</h3>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  {availableLayers.slice(0, 2).map(layer => (
                    <button 
                      key={layer.id}
                      onClick={() => setCurrentLayer(layer.id)}
                      className={`flex-1 text-xs py-1.5 px-2 rounded font-medium transition-all ${currentLayer === layer.id ? 'bg-white shadow-sm text-black border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {layer.id.includes('local') ? 'Local System (Offline)' : 'Public Cloud (Online)'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Graph Logic Override</h3>
                
                <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-3 rounded-r text-xs leading-relaxed mb-4">
                  <b>Purpose:</b> Uncharted alleys or blocked military checkpoints cause delivery dispatch failure. 
                  Use these tools to manually draw missing streets. The backend routing algorithms will assimilate these exported lines, allowing fleets to bridge previously inaccessible areas.
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                  Interactive Geometry Tools
                </div>
                <div className="p-3 space-y-2 bg-white">
                  
                  <button 
                    onClick={handleTriggerDraw}
                    className={`w-full text-left px-3 py-2 text-sm rounded border flex items-center transition-colors ${drawMode === 'draw' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    <span className="mr-2">✏️</span> Trace Missing Road
                  </button>

                  <button 
                    onClick={handleTriggerSelect}
                    className={`w-full text-left px-3 py-2 text-sm rounded border flex items-center transition-colors ${drawMode === 'select' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    <span className="mr-2">👆</span> Select Geometry
                  </button>

                  <button 
                    onClick={handleTriggerTrash}
                    className="w-full text-left px-3 py-2 text-sm rounded border bg-white border-rose-200 hover:bg-rose-50 text-rose-600 flex items-center transition-colors mt-2"
                  >
                    <span className="mr-2">🗑️</span> Delete Selected Graph
                  </button>

                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveOverrides}
                  className="w-full bg-slate-900 text-white font-medium text-sm py-3 rounded hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>Export as <b>fixes.osm</b></span>
                </button>
                <div className="text-center mt-2 text-[10px] text-slate-400 font-medium">
                  Triggers native re-compilation on `/backend/custom-data/`
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Map
        ref={mapRef}
        mapLib={maplibregl as any}
        initialViewState={{
          longitude: 38.238,
          latitude: 34.802,
          zoom: 6
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyleUrl}
        onClick={handleMapClick}
      >
        <NavigationControl position="bottom-right" />

        <DrawControl
          drawRef={drawRef}
          onCreate={onUpdateFeatures}
          onUpdate={onUpdateFeatures}
          onDelete={onDeleteFeatures}
        />

        {/* Render all dropped waypoints elegantly */}
        {activeTab === 'navigation' && waypoints.map((wp, index) => (
          <Marker key={index} longitude={wp[1]} latitude={wp[0]}>
            <div className="flex items-center justify-center w-7 h-7 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg border-[3px] border-white ring-2 ring-black/10">
              {index + 1}
            </div>
          </Marker>
        ))}

        {/* Render Offline OSRM Routing Layer */}
        {activeTab === 'navigation' && routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            {/* White outline for high contrast minimalist aesthetic */}
            <Layer 
              id="route-layer-outline" 
              type="line" 
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#ffffff", "line-width": 8 }}
            />
            {/* Pure Stark Indigo stroke */}
            <Layer 
              id="route-layer-core" 
              type="line" 
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#4338ca", "line-width": 4 }}
            />
          </Source>
        )}

      </Map>

      {showStatusPanel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-5 text-slate-800 transition-all duration-300">
            <div className="flex items-start justify-between space-x-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl text-xl flex items-center justify-center ${
                  jobStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  jobStatus === 'failed' ? 'bg-rose-50 text-rose-600' :
                  'bg-indigo-50 text-indigo-600 animate-pulse'
                }`}>
                  {jobStatus === 'completed' && '✅'}
                  {jobStatus === 'failed' && '❌'}
                  {jobStatus === 'pending' && '⏳'}
                  {jobStatus === 'compiling' && '⚙️'}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    {jobStatus === 'completed' && 'OSRM Recompilation Complete'}
                    {jobStatus === 'failed' && 'OSRM Compilation Failed'}
                    {jobStatus === 'pending' && 'Override Uploaded'}
                    {jobStatus === 'compiling' && 'Recompiling Map Graph'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {jobStatus === 'completed' && 'Map data updated and OSRM container restarted.'}
                    {jobStatus === 'failed' && 'An error occurred during map graph rebuild.'}
                    {jobStatus === 'pending' && 'Preparing pipeline and compiling...'}
                    {jobStatus === 'compiling' && 'Merging lines with baseline map...'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowStatusPanel(false);
                  setActiveJobId(null);
                  setJobStatus(null);
                  setJobLogs("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                disabled={jobStatus === 'compiling' || jobStatus === 'pending'}
              >
                ✕
              </button>
            </div>

            {/* Micro progress bar */}
            {(jobStatus === 'compiling' || jobStatus === 'pending') && (
              <div className="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full animate-pulse"></div>
              </div>
            )}

            {/* Monospace Log Viewer */}
            {jobLogs && (
              <div className="mt-4">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Compilation Logs</div>
                <pre className="bg-slate-950 text-emerald-400 font-mono text-[9px] p-3 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap border border-slate-800 text-left">
                  {jobLogs}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
