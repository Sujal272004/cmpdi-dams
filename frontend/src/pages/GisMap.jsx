import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../services/api';
import {
  MapPin,
  Compass,
  Filter,
  Search,
  Activity,
  Building2,
  RefreshCw,
  Plus,
  Target,
  Crosshair,
  Trash2,
  Navigation,
  CheckCircle2
} from 'lucide-react';

// Custom Marker Helper for Leaflet
const createCustomIcon = (type, status, label) => {
  let bgColor = '#3b82f6'; // blue for camps
  let iconSymbol = '⛺';

  if (type === 'RIG') {
    iconSymbol = '⛏';
    if (status === 'ACTIVE') bgColor = '#10b981'; // emerald green
    else if (status === 'MAINTENANCE') bgColor = '#f59e0b'; // amber
    else bgColor = '#64748b'; // slate standby
  } else if (type === 'CUSTOM') {
    iconSymbol = '📍';
    bgColor = '#e11d48'; // rose red for user plotted points
  }

  const htmlStr = `
    <div style="
      background-color: ${bgColor};
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      position: relative;
    ">
      ${iconSymbol}
      <span style="
        position: absolute;
        bottom: -18px;
        white-space: nowrap;
        background: rgba(15, 23, 42, 0.85);
        color: white;
        font-size: 9px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.2);
      ">
        ${label}
      </span>
    </div>
  `;

  return L.divIcon({
    html: htmlStr,
    className: 'custom-gis-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

// Map Recenter Component
const ChangeMapView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Map Click Listener to capture exact GPS Lat/Lng (only active when mode enabled)
const MapEventsHandler = ({ isPickerActive, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (isPickerActive && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

export const GisMap = () => {
  const [gisData, setGisData] = useState({ camps: [], rigs: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [mapTileType, setMapTileType] = useState('standard'); // 'standard' or 'satellite'
  const [selectedCampFilter, setSelectedCampFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([21.5000, 81.5000]); // Center of India exploration belt
  const [zoomLevel, setZoomLevel] = useState(6);

  // Latitude and Longitude Parameter State on GIS Map
  const [latInput, setLatInput] = useState('20.844400');
  const [lngInput, setLngInput] = useState('78.973600');
  const [markerLabel, setMarkerLabel] = useState('BH-MRP-205');
  const [markerBlock, setMarkerBlock] = useState('Murpar Extension Sector B');
  const [markerStatus, setMarkerStatus] = useState('ACTIVE');
  const [pickerActive, setPickerActive] = useState(false);
  const [userMessage, setUserMessage] = useState(null);

  // State for user custom plotted pins on GIS Map
  const [customPlots, setCustomPlots] = useState(() => {
    try {
      const saved = localStorage.getItem('dams_gis_custom_plots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadGisData();
  }, []);

  useEffect(() => {
    localStorage.setItem('dams_gis_custom_plots', JSON.stringify(customPlots));
  }, [customPlots]);

  const loadGisData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getGisMapData();
      if (data) {
        setGisData(data);
        if (data.camps && data.camps.length > 0) {
          const firstCamp = data.camps[0];
          if (firstCamp.latitude && firstCamp.longitude) {
            setMapCenter([parseFloat(firstCamp.latitude), parseFloat(firstCamp.longitude)]);
            setZoomLevel(7);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load GIS map data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Center map on specified Lat & Lng
  const handleLocateCoordinates = (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setUserMessage("Please enter valid Latitude (-90 to 90) and Longitude (-180 to 180).");
      return;
    }

    setMapCenter([lat, lng]);
    setZoomLevel(12);
    setUserMessage(`Map centered to Lat: ${lat.toFixed(6)}°, Lng: ${lng.toFixed(6)}°`);
    setTimeout(() => setUserMessage(null), 3000);
  };

  // Plot custom marker at exact Lat & Lng
  const handlePlotMarker = (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) {
      setUserMessage("Invalid Latitude or Longitude parameters.");
      return;
    }

    const newPlot = {
      id: 'CUSTOM-' + Date.now(),
      latitude: lat,
      longitude: lng,
      label: markerLabel || 'Plotted Marker',
      blockName: markerBlock || 'Custom Exploration Location',
      status: markerStatus,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCustomPlots(prev => [newPlot, ...prev]);
    setMapCenter([lat, lng]);
    setZoomLevel(13);
    setUserMessage(`Successfully plotted location [${lat.toFixed(4)}°, ${lng.toFixed(4)}°] on GIS map!`);
    setTimeout(() => setUserMessage(null), 3500);
  };

  // Remove a custom plot
  const handleRemovePlot = (id) => {
    setCustomPlots(prev => prev.filter(p => p.id !== id));
  };

  // Click handler on map to grab coordinates
  const handleMapClick = (lat, lng) => {
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    setUserMessage(`Captured coordinates from map: Lat ${lat.toFixed(6)}°, Lng ${lng.toFixed(6)}°`);
    setTimeout(() => setUserMessage(null), 3000);
  };

  // Filter Rigs based on criteria
  const filteredRigs = (gisData.rigs || []).filter(rig => {
    const matchesCamp = selectedCampFilter === 'ALL' || rig.campId?.toString() === selectedCampFilter;
    const matchesStatus = statusFilter === 'ALL' || rig.status === statusFilter;
    const matchesSearch = !searchQuery ||
      rig.machineNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rig.drillHole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rig.blockName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCamp && matchesStatus && matchesSearch;
  });

  const filteredCamps = (gisData.camps || []).filter(camp => {
    return selectedCampFilter === 'ALL' || camp.id?.toString() === selectedCampFilter;
  });

  const tileUrl = mapTileType === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = mapTileType === 'satellite'
    ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-500" /> GIS Geospatial Exploration Map Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time GPS coordinate mapping, active drilling rig tracking, and regional exploration hubs across India
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadGisData}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh GIS Data
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border-l-4 border-l-cmpdi-navy border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Regional Hubs</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {gisData.summary?.totalCamps || filteredCamps.length}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-cmpdi-navy dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mapped Rigs</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {filteredRigs.length}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border-l-4 border-l-rose-500 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custom Plotted GPS Pins</p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {customPlots.length}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border-l-4 border-l-purple-500 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mapped Meterage</p>
              <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {gisData.summary?.totalMappedMeters || 0} <span className="text-sm font-semibold text-slate-500">m</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Compass className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* GPS LATITUDE & LONGITUDE MAP CONTROL TOOLBAR */}
      <div className="bg-gradient-to-r from-slate-900 via-cmpdi-navy to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Crosshair className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-amber-400">GIS LATITUDE &amp; LONGITUDE COORDINATE POSITIONING</h2>
              <p className="text-[11px] text-slate-300">Specify precise latitude and longitude parameters to locate or plot exact positions on the Leaflet map</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPickerActive(!pickerActive)}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 border ${
                pickerActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              {pickerActive ? '● Click Map Mode Active' : 'Enable Click-to-Pick GPS'}
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <form onSubmit={handleLocateCoordinates} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Latitude (°N) *</label>
            <input
              type="number"
              step="0.000001"
              required
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="e.g. 20.844400"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Longitude (°E) *</label>
            <input
              type="number"
              step="0.000001"
              required
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="e.g. 78.973600"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Location Label</label>
            <input
              type="text"
              value={markerLabel}
              onChange={(e) => setMarkerLabel(e.target.value)}
              placeholder="e.g. BH-AND-109"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Block / Sector Name</label>
            <input
              type="text"
              value={markerBlock}
              onChange={(e) => setMarkerBlock(e.target.value)}
              placeholder="e.g. Murpar Sector 3"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-end gap-2 lg:col-span-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" /> Locate &amp; Zoom
            </button>

            <button
              type="button"
              onClick={handlePlotMarker}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Plot Pin on Map
            </button>
          </div>
        </form>

        {/* Quick Coordinate Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span className="text-slate-400 font-semibold">Quick Coordinate Presets:</span>
          <button
            type="button"
            onClick={() => { setLatInput('19.961500'); setLngInput('79.296100'); setMarkerLabel('Anandwan Hub'); setMarkerBlock('Chandrapur Sector'); }}
            className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            📍 Anandwan (19.9615°N, 79.2961°E)
          </button>
          <button
            type="button"
            onClick={() => { setLatInput('20.852400'); setLngInput('78.985600'); setMarkerLabel('Murpar Hub'); setMarkerBlock('Nagpur Sector'); }}
            className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            📍 Murpar (20.8524°N, 78.9856°E)
          </button>
          <button
            type="button"
            onClick={() => { setLatInput('23.520400'); setLngInput('87.311900'); setMarkerLabel('Durgapur Hub'); setMarkerBlock('Raniganj Coalfield'); }}
            className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            📍 Durgapur (23.5204°N, 87.3119°E)
          </button>
        </div>

        {userMessage && (
          <div className="p-2.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{userMessage}</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Camp Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Camp:</span>
            <select
              value={selectedCampFilter}
              onChange={(e) => setSelectedCampFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
            >
              <option value="ALL">All Exploration Camps</option>
              {gisData.camps.map(c => (
                <option key={c.id} value={c.id.toString()}>{c.campName}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rig Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
            >
              <option value="ALL">All Operational Statuses</option>
              <option value="ACTIVE">🟢 Active Drilling</option>
              <option value="MAINTENANCE">🟠 Rig Maintenance</option>
              <option value="STANDBY">⚪ Standby / Idle</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search rig, hole ID or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* Map Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMapTileType('standard')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              mapTileType === 'standard'
                ? 'bg-cmpdi-navy text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🗺️ Topographic
          </button>
          <button
            onClick={() => setMapTileType('satellite')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              mapTileType === 'satellite'
                ? 'bg-cmpdi-navy text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📡 Satellite
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
        <div className="h-[600px] w-full z-10">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 font-semibold text-xs">
              Loading geospatial map layers...
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', cursor: pickerActive ? 'crosshair' : 'grab' }}
            >
              <ChangeMapView center={mapCenter} zoom={zoomLevel} />
              <MapEventsHandler isPickerActive={pickerActive} onMapClick={handleMapClick} />
              <TileLayer url={tileUrl} attribution={tileAttribution} />

              {/* Render Camp Markers (Blue Icons) */}
              {filteredCamps.map((camp) => {
                if (!camp.latitude || !camp.longitude) return null;
                const position = [parseFloat(camp.latitude), parseFloat(camp.longitude)];
                return (
                  <Marker
                    key={`camp-${camp.id}`}
                    position={position}
                    icon={createCustomIcon('CAMP', camp.status, camp.campCode)}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-2 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-cmpdi-navy font-bold text-sm border-b pb-1">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>{camp.campName}</span>
                        </div>
                        <p className="text-slate-600"><strong>Code:</strong> {camp.campCode}</p>
                        <p className="text-slate-600"><strong>Location:</strong> {camp.location}</p>
                        <p className="text-slate-600 font-mono text-[10px]">
                          GPS: {camp.latitude}°N, {camp.longitude}°E
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          ● CAMP HUB ACTIVE
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Render Rig Markers (Green/Amber Icons) */}
              {filteredRigs.map((rig) => {
                if (!rig.latitude || !rig.longitude) return null;
                const position = [parseFloat(rig.latitude), parseFloat(rig.longitude)];
                const progressPct = rig.plannedDepth && rig.plannedDepth > 0
                  ? Math.min(100, Math.round((rig.currentDepth / rig.plannedDepth) * 100))
                  : 0;

                return (
                  <React.Fragment key={`rig-group-${rig.id}`}>
                    <CircleMarker
                      center={position}
                      radius={22}
                      pathOptions={{
                        color: rig.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                        fillColor: rig.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                        fillOpacity: 0.15,
                        weight: 1.5,
                        dashArray: '4,4'
                      }}
                    />

                    <Marker
                      position={position}
                      icon={createCustomIcon('RIG', rig.status, rig.drillHole)}
                    >
                      <Popup className="custom-leaflet-popup">
                        <div className="p-2.5 space-y-2 text-xs w-56">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                              ⛏ {rig.machineNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rig.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rig.status}
                            </span>
                          </div>

                          <div>
                            <p className="text-slate-500 text-[11px]">Exploration Block:</p>
                            <p className="font-bold text-slate-800">{rig.blockName}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border text-[11px]">
                            <div>
                              <span className="text-slate-400 block">Drill Hole:</span>
                              <strong className="text-cmpdi-navy">{rig.drillHole}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Daily Progress:</span>
                              <strong className="text-emerald-700">+{rig.dailyProgress} m</strong>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                              <span>Depth: {rig.currentDepth} m</span>
                              <span>Target: {rig.plannedDepth} m</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-cmpdi-navy transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                            <p className="text-right text-[10px] text-slate-400 font-mono mt-0.5">{progressPct}% Complete</p>
                          </div>

                          <p className="font-mono text-[10px] text-slate-500 bg-slate-100 p-1 rounded">
                            📍 GPS: {parseFloat(rig.latitude).toFixed(6)}°N, {parseFloat(rig.longitude).toFixed(6)}°E
                          </p>

                          <div className="text-[10px] text-slate-400 border-t pt-1 flex justify-between">
                            <span>Hub: {rig.campName}</span>
                            <span>{rig.lastUpdated}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

              {/* Render User Custom Plotted Pins (Rose Red Icons) */}
              {customPlots.map((plot) => {
                const position = [plot.latitude, plot.longitude];
                return (
                  <React.Fragment key={`custom-plot-${plot.id}`}>
                    <CircleMarker
                      center={position}
                      radius={28}
                      pathOptions={{
                        color: '#e11d48',
                        fillColor: '#e11d48',
                        fillOpacity: 0.2,
                        weight: 2
                      }}
                    />

                    <Marker
                      position={position}
                      icon={createCustomIcon('CUSTOM', plot.status, plot.label)}
                    >
                      <Popup className="custom-leaflet-popup">
                        <div className="p-2.5 space-y-2 text-xs w-56">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="font-bold text-rose-700 text-sm flex items-center gap-1">
                              📍 {plot.label}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              CUSTOM PLOT
                            </span>
                          </div>

                          <div>
                            <p className="text-slate-500 text-[11px]">Exploration Block / Sector:</p>
                            <p className="font-bold text-slate-800">{plot.blockName}</p>
                          </div>

                          <div className="bg-rose-50 p-2 rounded border border-rose-200 font-mono text-[11px] text-rose-900">
                            <strong>Exact GPS Position:</strong>
                            <p>Lat: {plot.latitude.toFixed(6)}°N</p>
                            <p>Lng: {plot.longitude.toFixed(6)}°E</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">Plotted: {plot.createdAt}</span>
                            <button
                              onClick={() => handleRemovePlot(plot.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete Pin
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};
