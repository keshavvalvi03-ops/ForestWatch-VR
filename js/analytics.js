/**
 * ForestWatch VR - Impact Analytics Engine
 * Powered by Chart.js with live-updating synchronization to 3D scene events and simulator state.
 * Author: Keshav Valvii (PRN: 123B1D052)
 */

class ForestAnalyticsEngine {
  constructor() {
    this.radarChart = null;
    this.trendChart = null;
    this.driversChart = null;
    this.regionalChart = null;
    this.isDarkTheme = true;
  }

  init() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not loaded.');
      return;
    }

    // Set Chart.js defaults
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.color = '#a7f3d0';

    this._createRadarChart();
    this._createTrendChart();
    this._createDriversChart();
    this._createRegionalChart();

    // Subscribe to simulator updates
    if (window.ForestSimulator) {
      window.ForestSimulator.subscribe((state) => {
        this.updateLiveCharts(state);
      });
    }

    console.log('ForestWatch VR Analytics Initialized.');
  }

  _getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      textColor: isDark ? '#a7f3d0' : '#0f4b36',
      gridColor: isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(5, 150, 105, 0.12)',
      radarBase: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.25)',
      radarCurrent: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.35)'
    };
  }

  /**
   * 1. Ecosystem Services Radar Chart
   */
  _createRadarChart() {
    const ctx = document.getElementById('chart-ecosystem-radar');
    if (!ctx) return;
    const colors = this._getThemeColors();

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'Carbon Sequestration',
          'Soil Stability',
          'Biodiversity Index',
          'Watershed Retention',
          'Thermal Cooling'
        ],
        datasets: [
          {
            label: 'Baseline Pristine',
            data: [100, 100, 100, 100, 100],
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            borderColor: '#34d399',
            borderWidth: 2,
            pointBackgroundColor: '#34d399',
            pointRadius: 3
          },
          {
            label: 'Current Scene State',
            data: [100, 95, 100, 98, 100],
            backgroundColor: 'rgba(245, 158, 11, 0.25)',
            borderColor: '#f59e0b',
            borderWidth: 2.5,
            pointBackgroundColor: '#f59e0b',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: colors.gridColor },
            angleLines: { color: colors.gridColor },
            pointLabels: {
              color: colors.textColor,
              font: { size: 11, weight: '600' }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}% integrity`
            }
          }
        }
      }
    });
  }

  /**
   * 2. Live Simulation Trend Chart
   */
  _createTrendChart() {
    const ctx = document.getElementById('chart-biomass-trend');
    if (!ctx) return;
    const colors = this._getThemeColors();

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Start', 'Initial', 'Current'],
        datasets: [
          {
            label: 'Active Trees Count',
            data: [140, 140, 140],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Annual Carbon Sink (tCO2/yr)',
            data: [3.08, 3.08, 3.08],
            borderColor: '#38bdf8',
            borderDash: [4, 4],
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { size: 10 } }
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 200,
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 5,
            grid: { display: false },
            ticks: { color: '#38bdf8' }
          }
        },
        plugins: {
          legend: { labels: { color: colors.textColor, font: { size: 11 } } }
        }
      }
    });
  }

  /**
   * 3. Global Deforestation Drivers Doughnut
   */
  _createDriversChart() {
    const ctx = document.getElementById('chart-drivers-doughnut');
    if (!ctx) return;
    const colors = this._getThemeColors();

    this.driversChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          'Commercial Cattle Pasture',
          'Industrial Palm & Soy',
          'Selective Timber Logging',
          'Smallholder Subsistence',
          'Wildfire Mega-burns'
        ],
        datasets: [{
          data: [41.2, 18.4, 13.1, 16.8, 10.5],
          backgroundColor: [
            '#ef4444', // red
            '#f59e0b', // amber
            '#10b981', // emerald
            '#6366f1', // indigo
            '#ec4899'  // pink
          ],
          borderWidth: 1,
          borderColor: '#06140f'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: colors.textColor, font: { size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw}% of global forest loss`
            }
          }
        }
      }
    });
  }

  /**
   * 4. Regional Loss Rates Bar Chart
   */
  _createRegionalChart() {
    const ctx = document.getElementById('chart-regional-bars');
    if (!ctx) return;
    const colors = this._getThemeColors();

    this.regionalChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Amazon', 'SE Asia', 'Boreal Taiga', 'Congo Basin', 'Gran Chaco'],
        datasets: [{
          label: 'Annual Primary Loss (Million Hectares/yr)',
          data: [1.82, 1.15, 0.88, 0.65, 0.38],
          backgroundColor: [
            'rgba(239, 68, 68, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(56, 189, 248, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(168, 85, 247, 0.85)'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { size: 11 } }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw} Mha/year (Source: Global Forest Watch)`
            }
          }
        }
      }
    });
  }

  /**
   * Updates Radar & Trend Charts dynamically as user cuts/plants trees
   */
  updateLiveCharts(state) {
    if (this.radarChart) {
      // Scale thermal cooling: 100 - anomaly * 25
      const thermalCooling = Math.max(10, Math.round(100 - (state.microclimateAnomaly / 3.4) * 90));
      const soilStability = 100 - state.soilErosionRisk;

      this.radarChart.data.datasets[1].data = [
        state.canopyCoverPercent,
        soilStability,
        state.biodiversityIndex,
        state.waterRetentionIndex,
        thermalCooling
      ];

      // Change radar border color to red if heavily deforested
      const isDamaged = state.canopyCoverPercent < 60;
      this.radarChart.data.datasets[1].borderColor = isDamaged ? '#ef4444' : '#f59e0b';
      this.radarChart.data.datasets[1].backgroundColor = isDamaged ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';
      this.radarChart.update('none');
    }

    if (this.trendChart && window.ForestSimulator) {
      const history = window.ForestSimulator.timelineHistory;
      this.trendChart.data.labels = history.map(h => h.label);
      this.trendChart.data.datasets[0].data = history.map(h => h.count);
      this.trendChart.data.datasets[1].data = history.map(h => h.carbon);
      this.trendChart.update('none');
    }
  }

  /**
   * Refreshes chart colors on light/dark theme toggle
   */
  refreshTheme() {
    const colors = this._getThemeColors();
    Chart.defaults.color = colors.textColor;

    [this.radarChart, this.trendChart, this.driversChart, this.regionalChart].forEach(chart => {
      if (chart) {
        chart.update();
      }
    });
  }
}

window.ForestAnalytics = new ForestAnalyticsEngine();
