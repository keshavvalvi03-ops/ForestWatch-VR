# ForestWatch VR 🌲🥽

> **An Immersive Virtual Reality-Based Simulator for Visualizing Deforestation Impacts and Promoting Forest Conservation Awareness**

**Academic Coursework:** TY B.Tech Computer Engineering (Regional Language)  
**Subject:** Augmented & Virtual Reality (AR/VR)  
**Assessment:** Formative Assessment 2 (FA-2) — Concept to Working Prototype  

---

## 👨‍🎓 Student & Project Details

| Field | Details |
|---|---|
| **Student Name** | Keshav Valvii |
| **PRN** | `123B1D052` |
| **Department** | Computer Engineering (Regional Language) |
| **Subject** | AR/VR (Augmented & Virtual Reality) |
| **Assessment** | Formative Assessment 2 (FA-2) |
| **Academic Year** | 2026 – 2027 *(Placeholder)* |
| **Institution** | Department of Computer Engineering *(Placeholder)* |
| **Faculty Guide** | [Faculty Name Placeholder] |

---

## 🎯 Executive Summary & Objectives

Tropical and temperate forests represent Earth's primary terrestrial carbon sinks and terrestrial biodiversity reservoirs. Despite international treaties, deforestation continues at alarming rates (~10 million hectares annually). Traditional 2D charts and media often fail to convey the spatial reality, habitat fragmentation, and systemic ecological consequences of tree removal.

**ForestWatch VR** solves this pedagogical gap by providing an interactive, client-side Virtual Reality platform combining **verified satellite observations (NASA / Landsat / Sentinel-2)** with a **procedural 3D Three.js ecosystem**. Users can interactively fell trees, plant native saplings, witness microclimate heating, and observe real-time live ecological metrics (carbon loss, soil erosion vulnerability, biodiversity collapse).

---

## 🛠️ Tech Stack & Architecture

ForestWatch VR is intentionally engineered to run **100% locally and client-side**, with zero external database dependencies, paid APIs, or complex node build steps:

- **3D Graphics & Simulation:** [Three.js](https://threejs.org/) (WebGL / WebXR)
- **Interactive GIS Mapping:** [Leaflet.js](https://leafletjs.com/) with ESRI World Imagery & CartoDB tiles
- **Impact Analytics:** [Chart.js](https://www.chartjs.org/) with real-time reactive canvas sync
- **WebXR Compatibility:** W3C WebXR Device API (`immersive-vr` session support)
- **Procedural Sound Engine:** Web Audio API (100% synthesized wind, birdsong, cicadas, wood chop & planting SFX — zero missing audio file errors)
- **UI & Layout:** Semantic HTML5, CSS Grid/Flexbox, Glassmorphism, Theme Variables (Dark/Light)

---

## 📂 Project Structure

```text
forestwatch-vr/
├── index.html              # Main single-page web app with all 9 working sections
├── README.md               # Comprehensive FA-2 submission & run documentation
├── css/
│   ├── style.css           # Core design system, variables, typography, animations
│   └── components.css      # Specialized component styles (3D HUD, Map, Sliders, Modals)
├── js/
│   ├── main.js             # Main orchestrator, theme persistence, navigation, counters
│   ├── audio.js            # Web Audio API procedural sound synthesizer (wind, birds, SFX)
│   ├── scene3d.js          # Three.js 3D Forest Explorer, terrain, lighting, raycasting, WebXR
│   ├── map.js              # Leaflet GIS map, 7 global hotspots, popups, layer controls
│   ├── history.js          # Historical satellite comparison split-slider (Landsat/Sentinel)
│   ├── analytics.js        # Chart.js charts: radar, trend, doughnut, regional loss
│   └── simulator.js        # Mathematical modeling engine (carbon, erosion, biodiversity)
└── assets/                 # Local assets and imagery fallbacks
```

---

## 🚀 Step-by-Step Run Instructions (Windows)

As a beginner-friendly project, ForestWatch VR requires no compilation or build tools. You can run it locally in under 30 seconds using either Python or Node.js.

### Option 1: Using Python (Recommended)

1. Open **Command Prompt** (`cmd`) or **PowerShell**.
2. Navigate to the project directory:
   ```powershell
   cd "C:\Users\Atul\.gemini\antigravity\scratch\forestwatch-vr"
   ```
3. Start a local HTTP server:
   ```powershell
   python -m http.server 8000
   ```
4. Open your web browser (Chrome, Edge, Firefox) and navigate to:
   ```text
   http://localhost:8000
   ```

### Option 2: Using Node.js

1. Open **PowerShell** in the project folder:
   ```powershell
   cd "C:\Users\Atul\.gemini\antigravity\scratch\forestwatch-vr"
   ```
2. Run via `npx serve`:
   ```powershell
   npx serve .
   ```
3. Open the browser link printed in the terminal (usually `http://localhost:3000`).

---

## 🎮 How to Use & Explore the 9 Working Sections

1. **Home Dashboard:**
   - Review live animated counters for global tree cover loss (420 Mha), annual land-use $CO_2$ emissions (10.4 Gt), and active simulated trees.
   - Use the navigation bar or "Explore 3D Forest" button to jump between modules.

2. **Deforestation GIS Map:**
   - Pan and zoom across 7 monitored global deforestation hotspots (Amazon Basin, Borneo Peatlands, Congo Basin, Western Ghats, Gran Chaco, Madagascar, North American Boreal).
   - Click any hotspot marker to view observed loss rates, drivers, and satellite sensors.
   - Click **"Simulate in 3D Explorer"** inside any popup to jump directly into the corresponding 3D scenario.

3. **Historical Satellite Comparison:**
   - Select a case study (e.g. *Rondônia, Brazilian Amazon*).
   - Drag the center vertical divider left and right to inspect the famous "fishbone" deforestation patterns radiating from highway BR-364 compared to the 1985 baseline.
   - Click timeline buttons (1985, 2000, 2012, 2024) to scrub through decadal observations.

4. **3D Forest Explorer:**
   - **Orbit Camera:** Left-click + drag to orbit 360°, right-click + drag to pan, scroll wheel to zoom.
   - **Ground Walk Mode:** Press **W / A / S / D** or Arrow keys to walk through the trees at eye level!
   - **Sky & Lighting:** Toggle between **☀️ Day**, **🌅 Sunset**, and **🌙 Night** (complete with glowing bioluminescent fireflies and moonlight).
   - **Camera Presets:** Quick buttons for Aerial Canopy, Ground Walk, Clearcut Edge, and River Overlook.

5. **Deforestation Simulator:**
   - Click the **"🪓 Chop Tree"** tool button.
   - Click on any healthy tree in the 3D scene: watch it tilt, crash, and leave a cut stump with an authentic procedural wood-crack sound effect!
   - Use the **Direct Canopy Slider** or click scenario presets (*Pristine, Selective Logging, Fishbone Infrastructure, Wildfire Clearcut*) to trigger immediate mass transitions.
   - Observe live metric updates: Canopy Cover %, Annual Carbon Sink ($tCO_2/yr$), Soil Erosion Risk, and Local Temperature Anomaly.

6. **Restoration Lab:**
   - Select a native species card:
     - **Native Broadleaf (Teak/Oak):** High carbon sequestration, deep root anchorage.
     - **Pioneer Conifer (Pine):** Rapid slope soil stabilization.
     - **Biodiversity Blossom Tree:** Maximum wildlife and pollinator carrying capacity.
   - Select the **"🌱 Plant Sapling"** tool and click anywhere on the bare terrain to plant a tree with growth bounce animations and crystalline harmonic chimes!
   - Click **"Autonomous Drone Seed Bomb"** to automatically air-drop 15 saplings across deforested patches.

7. **Impact Analytics:**
   - 4 live Chart.js visualizations synchronized with the 3D scene:
     - *Ecosystem Services Integrity* (Radar chart of 5 key indicators)
     - *Simulation Biomass & Carbon Trend* (Live time-series tracking your logging/planting actions)
     - *Primary Drivers of Global Forest Loss* (Doughnut chart)
     - *Regional Loss Rates in Mha/yr* (Comparative bar chart)

8. **WebXR Virtual Reality Experience:**
   - Click **"🥽 Launch WebXR VR"**.
   - If a VR headset (Meta Quest 2/3/Pro, HTC Vive, Pico, Apple Vision Pro) is connected or opened directly inside Meta Quest Browser, an immersive 1:1 scale stereoscopic session launches.
   - If running on a standard monitor, a friendly diagnostic modal opens explaining WebXR requirements and inviting the user to continue in desktop 3D mode.

9. **About & Academic References:**
   - Review official FA-2 student metadata, mathematical modeling equations, data limitations, and bibliography.

---

## 🔬 Mathematical Formulations & Scientific Integrity

### 1. Illustrative Ecological Modeling Equations

| Indicator | Mathematical Formulation | Scientific Parameterization |
|---|---|---|
| **Annual Carbon Sink** | $C_{seq} = N_{trees} \times 0.022\text{ tCO}_2/\text{year}$ | Parameterized from IPCC Tier-1 tropical moist tree biomass average (~22 kg $CO_2$/tree/yr). |
| **Soil Erosion Risk** | $E_{risk} = \min(100, \max(5, 100 - (\text{CanopyCover}\% \times 0.92)))$ | Models reduction of kinetic rainfall impact due to multi-layered canopy foliage interception. |
| **Biodiversity Index** | $B_{index} = (\text{CanopyCover}\% / 100)^{1.25} \times 100$ | Non-linear habitat percolation function reflecting accelerated species loss under corridor fragmentation. |
| **Microclimate Anomaly** | $\Delta T = (1.0 - \text{CanopyCover}\% / 100) \times 3.4^\circ\text{C}$ | Surface warming resulting from the loss of latent heat dissipation via tree evapotranspiration. |

### 2. Scientific Disclosure & Data Attribution

- **Observation vs. Simulation:** Real-world observations (historical Landsat imagery, hotspot coordinates, FAO loss statistics) are strictly distinguished from virtual simulation calculations.
- **Virtual Planting vs. Real Restoration:** Virtual tree planting in the 3D simulator serves as an educational illustration of ecological recovery; real forest restoration requires soil biome succession, seedling care, and decade-long ecological stewardship.
- **Cited Data Sources:**
  1. *Hansen, M. C. et al. (Science 2013, updated 2023)* — "High-Resolution Global Maps of 21st-Century Forest Cover Change."
  2. *FAO Global Forest Resources Assessment (FRA 2020)* — United Nations Food and Agriculture Organization.
  3. *NASA Earth Observatory / Landsat Surface Reflectance* — Multi-spectral telemetry of Amazonian Highway BR-364 and Southeast Asian peatland concessions.
  4. *IPCC Guidelines for National Greenhouse Gas Inventories* — Volume 4: Agriculture, Forestry and Other Land Use (AFOLU).

---

## 🌐 Deploying to GitHub Pages (One-Click Hosting)

1. Initialize git and commit your files:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit of ForestWatch VR FA-2 project"
   ```
2. Create a new repository on your GitHub account named `forestwatch-vr`.
3. Add the remote and push:
   ```powershell
   git remote add origin https://github.com/<your-username>/forestwatch-vr.git
   git branch -M main
   git push -u origin main
   ```
4. On GitHub, navigate to **Settings** > **Pages**.
5. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
6. Within 1–2 minutes, your project will be live at:
   `https://<your-username>.github.io/forestwatch-vr/`

---

## 📜 License & Acknowledgments

- **Author:** Keshav Valvii (PRN: 123B1D052)
- **Course:** TY B.Tech Computer Engineering (Regional Language) | AR/VR Formative Assessment 2
- **Academic Citation:** Designed and built for academic research and educational awareness purposes.
