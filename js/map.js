/**
 * ForestWatch VR - Interactive Deforestation GIS Map Engine
 * Powered by Leaflet.js with public satellite telemetry, hotspot monitoring, and layer toggles.
 * Author: Keshav Valvii (PRN: 123B1D052)
 */

class ForestMapEngine {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.zonesGroup = null;
    this.currentTileLayer = null;

    // Verified Global Deforestation Hotspots (Source: Global Forest Watch / Hansen UMD)
    this.hotspots = [
      {
        id: 'amazon_rondonia',
        name: 'Amazon Rainforest (Rondônia, Brazil)',
        coords: [-11.2, -62.8],
        risk: 'Critical',
        biome: 'Tropical Moist Broadleaf',
        lossRate: '18.4% primary canopy lost since 2000',
        drivers: 'Cattle ranching, soy expansion, illegal road branching',
        sensor: 'Landsat 5-9 TM/OLI, Sentinel-2 MSI',
        simScenario: 'fishbone_roads',
        desc: 'Famous "fishbone" deforestation pattern radiating from Highway BR-364 into indigenous reserves.'
      },
      {
        id: 'borneo_peatlands',
        name: 'Borneo Lowlands (Kalimantan, Indonesia)',
        coords: [-1.4, 113.8],
        risk: 'Critical',
        biome: 'Tropical Lowland & Peat Swamp Forest',
        lossRate: '26.1% primary dipterocarp forest lost',
        drivers: 'Industrial oil palm monoculture, canal drainage, peat fires',
        sensor: 'Landsat OLI, MODIS Active Fire, Sentinel-1 SAR',
        simScenario: 'wildfire_clearcut',
        desc: 'Drained peatlands release massive subterranean carbon emissions when dry season fires ignite.'
      },
      {
        id: 'congo_basin',
        name: 'Congo Basin Rainforest (DR Congo)',
        coords: [0.5, 23.5],
        risk: 'Severe',
        biome: 'Equatorial Evergreen Moist Forest',
        lossRate: '11.2% forest edge degradation',
        drivers: 'Smallholder slash-and-burn, artisanal woodfuel, coltan mining',
        sensor: 'Sentinel-2, GEDI LiDAR, Landsat 8/9',
        simScenario: 'selective_logging',
        desc: 'World’s second-largest rainforest, increasingly fragmented along expanding artisanal transport corridors.'
      },
      {
        id: 'western_ghats',
        name: 'Western Ghats (Karnataka & Kerala, India)',
        coords: [14.2, 74.8],
        risk: 'Severe',
        biome: 'Tropical Montane Shola & Wet Evergreen',
        lossRate: 'Severe fragmentation of endemic wildlife corridors',
        drivers: 'Linear infrastructure (rail/power), tea/rubber encroachment, hydel dams',
        sensor: 'ISRO LISS-IV, Sentinel-2, Landsat 8',
        simScenario: 'reforested_corridor',
        desc: 'UNESCO World Heritage biodiversity hotspot with high species endemism threatened by linear barriers.'
      },
      {
        id: 'gran_chaco',
        name: 'Gran Chaco Dry Forest (Argentina & Paraguay)',
        coords: [-24.5, -61.2],
        risk: 'Critical',
        biome: 'Subtropical Semi-Arid Dry Forest',
        lossRate: 'Over 7.2 million hectares cleared since 1990',
        drivers: 'Industrial GM soybean cultivation, export cattle pasture',
        sensor: 'Landsat 7/8/9, Sentinel-2',
        simScenario: 'fishbone_roads',
        desc: 'One of the highest deforestation rates on Earth, rapidly converting biodiverse thorny woodland.'
      },
      {
        id: 'madagascar',
        name: 'Eastern Rainforests (Madagascar)',
        coords: [-18.8, 48.5],
        risk: 'Critical',
        biome: 'Tropical Moist Forest',
        lossRate: 'Over 44% original forest cover lost',
        drivers: 'Subsistence tavy (slash-and-burn), illicit rosewood logging',
        sensor: 'Landsat TM/ETM+, Sentinel-2',
        simScenario: 'selective_logging',
        desc: 'Extreme threat to unique lemur biodiversity isolated by catastrophic habitat loss.'
      },
      {
        id: 'boreal_canada',
        name: 'North American Boreal (Alberta & NWT, Canada)',
        coords: [56.1, -115.2],
        risk: 'Moderate',
        biome: 'Circumboreal Taiga / Peatland',
        lossRate: 'Accelerating megablaze burns & seismic lines',
        drivers: 'Pyrogenic climate-amplified wildfires, oil sand exploration',
        sensor: 'VIIRS Thermal Anomalies, Sentinel-2',
        simScenario: 'wildfire_clearcut',
        desc: 'Vast carbon-dense peatlands vulnerable to hotter dry summers and extreme lightning-triggered wildfires.'
      }
    ];
  }

  init(mapContainerId = 'leaflet-map') {
    if (typeof L === 'undefined') {
      console.warn('Leaflet library not loaded.');
      return;
    }

    const container = document.getElementById(mapContainerId);
    if (!container) return;

    // Create Map instance centered around equator
    this.map = L.map(mapContainerId, {
      center: [4.0, 25.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true
    });

    // Base Tile Providers (Satellite first, with CartoDB and OSM fallbacks)
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and GIS User Community',
      maxZoom: 18
    });

    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19
    });

    const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    // Default to Satellite
    esriSatellite.addTo(this.map);
    this.currentTileLayer = esriSatellite;

    // Layer Groups
    this.markersGroup = L.layerGroup().addTo(this.map);
    this.zonesGroup = L.layerGroup().addTo(this.map);

    // Layer Controls
    const baseMaps = {
      "Satellite (ESRI)": esriSatellite,
      "Dark Eco (CARTO)": cartoDark,
      "Standard (OSM)": osmStandard
    };

    const overlayMaps = {
      "Deforestation Hotspots": this.markersGroup,
      "Loss Threat Polygons": this.zonesGroup
    };

    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(this.map);

    // Populate data
    this._renderHotspotMarkers();
    this._renderThreatPolygons();
    this._setupSearchAndFilters();

    console.log('ForestWatch VR Leaflet Map Initialized.');
  }

  _renderHotspotMarkers() {
    this.markersGroup.clearLayers();

    this.hotspots.forEach(spot => {
      const isCritical = spot.risk === 'Critical';
      const badgeClass = isCritical ? 'badge-danger' : 'badge-amber';
      const pulseColor = isCritical ? '#ef4444' : '#f59e0b';

      // Custom animated pulsing marker icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative; width:28px; height:28px;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${pulseColor}; opacity:0.35; animation: pulse-ring 2s infinite;"></div>
            <div style="position:absolute; top:4px; left:4px; width:20px; height:20px; border-radius:50%; background:${pulseColor}; border:2px solid #ffffff; box-shadow:0 0 8px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:10px; color:#fff; font-weight:bold;">🌲</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const popupHtml = `
        <div style="min-width:240px; font-family:var(--font-main);">
          <div class="map-popup-header">
            <span>${spot.name}</span>
          </div>
          <div style="margin: 0.3rem 0;">
            <span class="badge ${badgeClass}">${spot.risk} Risk</span>
            <span class="badge" style="background:rgba(255,255,255,0.08);">${spot.biome}</span>
          </div>
          <p style="font-size:0.8rem; margin:0.4rem 0; color:var(--text-secondary);">${spot.desc}</p>
          <div class="map-popup-stats">
            <div><strong>Observed Loss:</strong><br>${spot.lossRate}</div>
            <div><strong>Primary Driver:</strong><br>${spot.drivers}</div>
          </div>
          <div style="font-size:0.72rem; color:var(--text-dim); margin-top:0.3rem;">
            🛰️ <em>Sensors: ${spot.sensor}</em>
          </div>
          <button class="btn btn-primary btn-sm" style="width:100%; margin-top:0.6rem;" onclick="window.ForestMap.jumpToSimulation('${spot.simScenario}')">
            ⚡ Simulate in 3D Explorer
          </button>
        </div>
      `;

      const marker = L.marker(spot.coords, { icon: customIcon }).bindPopup(popupHtml);
      this.markersGroup.addLayer(marker);
    });
  }

  _renderThreatPolygons() {
    this.zonesGroup.clearLayers();

    // High risk threat zone approximations
    const threatZones = [
      {
        name: 'Amazon Arc of Deforestation',
        coords: [
          [-8.5, -64.0], [-10.0, -66.5], [-13.0, -60.0], [-11.0, -52.0], [-7.0, -50.0], [-8.5, -64.0]
        ],
        color: '#ef4444'
      },
      {
        name: 'Borneo Concession Corridor',
        coords: [
          [2.5, 111.0], [-3.0, 110.5], [-3.8, 115.5], [1.0, 117.8], [2.5, 111.0]
        ],
        color: '#f59e0b'
      },
      {
        name: 'Western Ghats Ecological Belt',
        coords: [
          [8.3, 77.1], [11.5, 75.8], [15.2, 74.0], [18.5, 73.4], [17.5, 74.2], [14.0, 75.5], [8.3, 77.1]
        ],
        color: '#10b981'
      }
    ];

    threatZones.forEach(zone => {
      const polygon = L.polygon(zone.coords, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 4'
      }).bindTooltip(`<strong>${zone.name}</strong><br>Monitored Threat Belt`, { sticky: true });
      this.zonesGroup.addLayer(polygon);
    });
  }

  _setupSearchAndFilters() {
    const searchInput = document.getElementById('map-hotspot-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) return;

      const found = this.hotspots.find(h => 
        h.name.toLowerCase().includes(query) || 
        h.drivers.toLowerCase().includes(query) ||
        h.biome.toLowerCase().includes(query)
      );

      if (found) {
        this.flyToHotspot(found.id);
      }
    });
  }

  flyToHotspot(hotspotId) {
    const spot = this.hotspots.find(h => h.id === hotspotId);
    if (!spot || !this.map) return;

    this.map.flyTo(spot.coords, 6, {
      duration: 1.8,
      easeLinearity: 0.25
    });

    if (window.ForestAudio) {
      window.ForestAudio.playClickSound();
    }
  }

  jumpToSimulation(scenario) {
    if (window.ForestSimulator) {
      window.ForestSimulator.applyScenario(scenario);
    }
    const simSection = document.getElementById('simulator');
    if (simSection) {
      simSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

window.ForestMap = new ForestMapEngine();
