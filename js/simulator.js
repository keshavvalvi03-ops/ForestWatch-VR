/**
 * ForestWatch VR - Deforestation & Ecological Impact Simulator Engine
 * Implements scientific models for carbon balance, soil erosion risk, and biodiversity indices.
 * 
 * Scientific Disclaimer: Virtual scene values represent educational illustrative models 
 * parameterized from IPCC Tier-1 biomass estimates and FAO Forestry metrics.
 * Author: Keshav Valvii (PRN: 123B1D052)
 */

class ForestSimulator {
  constructor() {
    // Baseline scenario constants
    this.INITIAL_TREE_COUNT = 140;
    this.currentTreeCount = 140;
    this.treesRemovedCount = 0;
    this.treesPlantedCount = 0;

    // Selected planting species
    this.currentPlantingSpecies = 'teak'; // 'teak', 'conifer', 'fruit'
    this.selectedTool = 'inspect'; // 'inspect', 'fell', 'plant'

    // Parameter coefficients (FAO / IPCC Tier 1 illustrative models)
    // Average mature tropical/temperate tree sequesters approx 21.8 - 25 kg CO2/year = ~0.022 tCO2/year
    this.CO2_PER_TREE_PER_YEAR = 0.022; // Metric tons CO2 / year / tree
    this.TOTAL_BASELINE_BIOMASS_TCO2 = this.INITIAL_TREE_COUNT * this.CO2_PER_TREE_PER_YEAR;

    // History log for live Chart.js trend tracking
    this.timelineHistory = [
      { step: 0, label: 'Initial Pristine', count: 140, carbon: this.TOTAL_BASELINE_BIOMASS_TCO2 }
    ];

    // Subscribers for state changes
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try { cb(state); } catch (e) { console.error('Simulator listener error:', e); }
    });
  }

  /**
   * Returns current calculated state and ecological indicators
   */
  getState() {
    const canopyCoverPercent = Math.max(0, Math.min(100, Math.round((this.currentTreeCount / this.INITIAL_TREE_COUNT) * 100)));
    const canopyLossPercent = 100 - canopyCoverPercent;

    // 1. Carbon Sequestration Rate (tCO2/yr)
    const annualCarbonSink = Number((this.currentTreeCount * this.CO2_PER_TREE_PER_YEAR).toFixed(2));
    const annualCarbonDeficit = Number(((this.INITIAL_TREE_COUNT - this.currentTreeCount) * this.CO2_PER_TREE_PER_YEAR).toFixed(2));

    // 2. Soil Erosion Risk Index (scale 0 - 100)
    // Without roots and tree canopy interception, splash erosion and runoff increase exponentially
    const soilErosionRisk = Math.min(100, Math.max(5, Math.round(100 - (canopyCoverPercent * 0.92))));

    // 3. Biodiversity Carrying Index (scale 0 - 100)
    // Non-linear ecological degradation: fragmentation accelerates species loss
    const biodiversityIndex = Math.min(100, Math.max(0, Math.round(Math.pow(canopyCoverPercent / 100, 1.25) * 100)));

    // 4. Local Canopy Microclimate Temperature Anomaly (°C)
    // Evapotranspiration cooling loss causes surface warming
    const microclimateAnomaly = Number(((1 - (canopyCoverPercent / 100)) * 3.4).toFixed(1));

    // 5. Water Retention & Watershed Runoff Protection (0 - 100)
    const waterRetentionIndex = Math.min(100, Math.max(10, Math.round(canopyCoverPercent * 0.88 + 10)));

    return {
      initialTrees: this.INITIAL_TREE_COUNT,
      currentTrees: this.currentTreeCount,
      treesRemoved: this.treesRemovedCount,
      treesPlanted: this.treesPlantedCount,
      canopyCoverPercent,
      canopyLossPercent,
      annualCarbonSink,
      annualCarbonDeficit,
      soilErosionRisk,
      biodiversityIndex,
      microclimateAnomaly,
      waterRetentionIndex,
      selectedTool: this.selectedTool,
      currentPlantingSpecies: this.currentPlantingSpecies
    };
  }

  /**
   * Action: Remove a tree
   */
  recordTreeFelled() {
    if (this.currentTreeCount > 0) {
      this.currentTreeCount--;
      this.treesRemovedCount++;
      this._appendHistoryPoint(`Felled (${this.currentTreeCount})`);
      this.notify();
    }
  }

  /**
   * Action: Plant a tree
   */
  recordTreePlanted() {
    this.currentTreeCount++;
    this.treesPlantedCount++;
    this._appendHistoryPoint(`Planted (${this.currentTreeCount})`);
    this.notify();
  }

  /**
   * Sets absolute count of active trees from deforestation slider
   */
  setTargetTreeCount(targetCount) {
    const clamped = Math.max(0, Math.min(220, Math.round(targetCount)));
    if (clamped !== this.currentTreeCount) {
      const diff = clamped - this.currentTreeCount;
      if (diff > 0) {
        this.treesPlantedCount += diff;
      } else {
        this.treesRemovedCount += Math.abs(diff);
      }
      this.currentTreeCount = clamped;
      this._appendHistoryPoint(`Target ${clamped}`);
      this.notify();
    }
  }

  _appendHistoryPoint(label) {
    const carbon = Number((this.currentTreeCount * this.CO2_PER_TREE_PER_YEAR).toFixed(2));
    this.timelineHistory.push({
      step: this.timelineHistory.length,
      label,
      count: this.currentTreeCount,
      carbon
    });
    // Keep reasonable buffer length for chart performance
    if (this.timelineHistory.length > 25) {
      this.timelineHistory.shift();
    }
  }

  /**
   * Set interactive tool: 'inspect', 'fell', 'plant'
   */
  setTool(tool) {
    this.selectedTool = tool;
    this.notify();
  }

  /**
   * Select planting species
   */
  setSpecies(species) {
    this.currentPlantingSpecies = species;
    this.notify();
  }

  /**
   * Presets
   */
  applyScenario(presetName) {
    if (window.ForestAudio) {
      window.ForestAudio.playScenarioSound();
    }

    switch (presetName) {
      case 'pristine':
        this.currentTreeCount = 140;
        this.treesRemovedCount = 0;
        break;
      case 'selective_logging':
        this.currentTreeCount = Math.round(140 * 0.72); // ~100 trees
        this.treesRemovedCount = 40;
        break;
      case 'fishbone_roads':
        this.currentTreeCount = Math.round(140 * 0.40); // ~56 trees
        this.treesRemovedCount = 84;
        break;
      case 'wildfire_clearcut':
        this.currentTreeCount = Math.round(140 * 0.12); // ~16 trees
        this.treesRemovedCount = 124;
        break;
      case 'reforested_corridor':
        this.currentTreeCount = 165; // High density restoration
        this.treesPlantedCount += 35;
        break;
      default:
        this.currentTreeCount = 140;
    }

    this._appendHistoryPoint(presetName.replace('_', ' ').toUpperCase());
    this.notify();

    // Trigger 3D scene sync if available
    if (window.Forest3D) {
      window.Forest3D.syncToTreeCount(this.currentTreeCount, presetName);
    }
  }

  reset() {
    this.currentTreeCount = this.INITIAL_TREE_COUNT;
    this.treesRemovedCount = 0;
    this.treesPlantedCount = 0;
    this.selectedTool = 'inspect';
    this.timelineHistory = [
      { step: 0, label: 'Initial Pristine', count: 140, carbon: this.TOTAL_BASELINE_BIOMASS_TCO2 }
    ];
    this.notify();
    if (window.Forest3D) {
      window.Forest3D.resetForest();
    }
  }
}

window.ForestSimulator = new ForestSimulator();
