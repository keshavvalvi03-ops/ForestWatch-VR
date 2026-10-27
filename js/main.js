/**
 * ForestWatch VR - Main Application Controller
 * Handles system initialization, theme toggling, UI event dispatching, and state synchronization.
 * Author: Keshav Valvii (PRN: 123B1D052)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('ForestWatch VR initializing...');

  // 1. Initialize Theme (persist preference)
  initTheme();

  // 2. Initialize 3D Forest Scene
  if (window.Forest3D) {
    window.Forest3D.init('forest-viewport');
  }

  // 3. Initialize Interactive Leaflet Map
  if (window.ForestMap) {
    window.ForestMap.init('leaflet-map');
  }

  // 4. Initialize Historical Satellite Comparison
  if (window.ForestHistory) {
    window.ForestHistory.init();
  }

  // 5. Initialize Chart.js Analytics
  if (window.ForestAnalytics) {
    window.ForestAnalytics.init();
  }

  // 6. Connect Simulator State to DOM Elements
  initSimulatorUI();

  // 7. Setup Audio Controls
  initAudioControls();

  // 8. Setup Navigation & Mobile Menu
  initNavigation();

  // 9. Setup Animated Metric Counters
  initAnimatedCounters();

  // 10. Setup Modals
  initModals();

  console.log('ForestWatch VR successfully loaded.');
});

/* ==========================================================================
   Theme Controller
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('forestwatch_theme') || 'dark';

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('forestwatch_theme', newTheme);
      updateThemeIcon(newTheme);

      if (window.ForestAnalytics) {
        window.ForestAnalytics.refreshTheme();
      }
      if (window.ForestAudio) {
        window.ForestAudio.playClickSound();
      }
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`);
  }
}

/* ==========================================================================
   Simulator UI & State Synchronization
   ========================================================================== */
function initSimulatorUI() {
  const sim = window.ForestSimulator;
  if (!sim) return;

  // Tools: Inspect, Fell, Plant
  const toolButtons = document.querySelectorAll('.hud-tool-btn[data-tool]');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool');
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sim.setTool(tool);

      if (window.Forest3D) {
        window.Forest3D.activeTool = tool;
      }
      if (window.ForestAudio) {
        window.ForestAudio.playClickSound();
      }
    });
  });

  // Time of Day Buttons (Day, Sunset, Night)
  const timeButtons = document.querySelectorAll('[data-time-of-day]');
  timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const time = btn.getAttribute('data-time-of-day');
      timeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (window.Forest3D) {
        window.Forest3D.setTimeOfDay(time);
      }
      if (window.ForestAudio) {
        window.ForestAudio.playClickSound();
      }
    });
  });

  // Camera Presets
  const camButtons = document.querySelectorAll('[data-cam-preset]');
  camButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-cam-preset');
      camButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (window.Forest3D) {
        window.Forest3D.setCameraPreset(preset);
      }
      if (window.ForestAudio) {
        window.ForestAudio.playClickSound();
      }
    });
  });

  // Deforestation Slider
  const deforestSlider = document.getElementById('sim-tree-slider');
  const deforestVal = document.getElementById('sim-tree-val');
  if (deforestSlider) {
    deforestSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (deforestVal) deforestVal.textContent = val;
      sim.setTargetTreeCount(val);
      if (window.Forest3D) {
        window.Forest3D.syncToTreeCount(val);
      }
    });
  }

  // Scenarios Buttons
  const scenarioButtons = document.querySelectorAll('[data-scenario]');
  scenarioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-scenario');
      scenarioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sim.applyScenario(scenario);
      if (deforestSlider) {
        deforestSlider.value = sim.currentTreeCount;
        if (deforestVal) deforestVal.textContent = sim.currentTreeCount;
      }
    });
  });

  // Reset Button
  const resetBtn = document.getElementById('sim-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      sim.reset();
      if (deforestSlider) {
        deforestSlider.value = 140;
        if (deforestVal) deforestVal.textContent = 140;
      }
      scenarioButtons.forEach(b => b.classList.remove('active'));
      const defaultScen = document.querySelector('[data-scenario="pristine"]');
      if (defaultScen) defaultScen.classList.add('active');
      if (window.ForestAudio) window.ForestAudio.playScenarioSound();
    });
  }

  // Species Selector Cards (Restoration Lab)
  const speciesCards = document.querySelectorAll('.species-card');
  speciesCards.forEach(card => {
    card.addEventListener('click', () => {
      speciesCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const species = card.getAttribute('data-species');
      sim.setSpecies(species);
      if (window.Forest3D) {
        window.Forest3D.activeSpecies = species;
      }
      if (window.ForestAudio) {
        window.ForestAudio.playClickSound();
      }
    });
  });

  // Autonomous Drone Seed Bombing
  const droneBtn = document.getElementById('drone-seed-bomb-btn');
  if (droneBtn) {
    droneBtn.addEventListener('click', () => {
      if (window.Forest3D) {
        window.Forest3D.seedBombDroneReforestation(15);
      }
      if (window.ForestAudio) {
        window.ForestAudio.playScenarioSound();
      }
    });
  }

  // WebXR Enter VR Button
  const vrButtons = document.querySelectorAll('.enter-vr-btn');
  vrButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.Forest3D) {
        window.Forest3D.enterVR();
      }
    });
  });

  // Wire simulator state changes to DOM metrics
  sim.subscribe(state => {
    updateMetricDOM(state);
  });

  // Initial push to HUD
  updateMetricDOM(sim.getState());
}

function updateMetricDOM(state) {
  // Update live counters
  const elTrees = document.getElementById('metric-live-trees');
  const elCover = document.getElementById('metric-canopy-cover');
  const elCarbon = document.getElementById('metric-carbon-sink');
  const elErosion = document.getElementById('metric-erosion-risk');
  const elBio = document.getElementById('metric-biodiversity-index');
  const elTemp = document.getElementById('metric-microclimate-temp');

  const elTreesRemoved = document.getElementById('metric-trees-removed');
  const elTreesPlanted = document.getElementById('metric-trees-planted');

  const progressBar = document.getElementById('canopy-progress-fill');

  if (elTrees) elTrees.textContent = state.currentTrees;
  if (elCover) elCover.textContent = `${state.canopyCoverPercent}%`;
  if (elCarbon) elCarbon.textContent = `${state.annualCarbonSink} tCO₂/yr`;
  if (elErosion) {
    elErosion.textContent = `${state.soilErosionRisk}/100`;
    elErosion.className = `metric-pill-val ${state.soilErosionRisk > 50 ? 'bad' : 'good'}`;
  }
  if (elBio) {
    elBio.textContent = `${state.biodiversityIndex}/100`;
    elBio.className = `metric-pill-val ${state.biodiversityIndex < 50 ? 'bad' : 'good'}`;
  }
  if (elTemp) {
    elTemp.textContent = `+${state.microclimateAnomaly}°C`;
    elTemp.className = `metric-pill-val ${state.microclimateAnomaly > 1.5 ? 'warn' : 'good'}`;
  }

  if (elTreesRemoved) elTreesRemoved.textContent = state.treesRemoved;
  if (elTreesPlanted) elTreesPlanted.textContent = state.treesPlanted;

  if (progressBar) {
    progressBar.style.width = `${state.canopyCoverPercent}%`;
    progressBar.className = `progress-bar-fill ${state.canopyCoverPercent < 40 ? 'danger' : ''}`;
  }
}

/* ==========================================================================
   Audio Controls
   ========================================================================== */
function initAudioControls() {
  const audio = window.ForestAudio;
  if (!audio) return;

  const headerBtn = document.getElementById('header-audio-toggle');
  const floatingBtn = document.getElementById('audio-toggle-btn');
  const volumeSlider = document.getElementById('audio-volume-slider');

  const handleToggle = () => {
    audio.toggleMute();
  };

  if (headerBtn) headerBtn.addEventListener('click', handleToggle);
  if (floatingBtn) floatingBtn.addEventListener('click', handleToggle);

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      audio.setVolume(parseFloat(e.target.value));
    });
  }
}

/* ==========================================================================
   Navigation & Mobile Menu
   ========================================================================== */
function initNavigation() {
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // Active section indicator on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const link = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        if (link) link.classList.add('active');
      } else {
        if (link) link.classList.remove('active');
      }
    });
  });
}

/* ==========================================================================
   Animated Counters
   ========================================================================== */
function initAnimatedCounters() {
  const counters = document.querySelectorAll('.animate-counter');
  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach(counter => {
          const target = parseFloat(counter.getAttribute('data-target'));
          const duration = 1800; // ms
          const decimals = counter.getAttribute('data-decimals') ? parseInt(counter.getAttribute('data-decimals')) : 0;
          const stepTime = 20;
          const totalSteps = duration / stepTime;
          const increment = target / totalSteps;
          let currentVal = 0;

          const timer = setInterval(() => {
            currentVal += increment;
            if (currentVal >= target) {
              counter.textContent = target.toFixed(decimals);
              clearInterval(timer);
            } else {
              counter.textContent = currentVal.toFixed(decimals);
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const heroSection = document.getElementById('hero');
  if (heroSection) {
    observer.observe(heroSection);
  }
}

/* ==========================================================================
   Modals
   ========================================================================== */
function initModals() {
  const vrModal = document.getElementById('vr-modal');
  const closeBtn = document.getElementById('vr-modal-close');
  const dismissBtn = document.getElementById('vr-modal-dismiss');

  const closeModal = () => {
    if (vrModal) vrModal.classList.remove('open');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
  if (vrModal) {
    vrModal.addEventListener('click', (e) => {
      if (e.target === vrModal) closeModal();
    });
  }
}
