// JavaScript with view switching

//Geoff King
//dashboard.js
//August 11, 2025
//CIS 339 Final Project - Mothership/child drone dashboard

// Enhanced JavaScript with alert system, data logging, and drone readiness features

// API endpoints
const API_BASE = 'http://localhost:5000/api';

// Ship systems data (fallback)
let shipSystems = {
    bridge: { name: "Bridge", status: "online", temp: 72, crew_count: 6 },
    engine1: { name: "Port Engine", status: "online", temp: 195, power: 85, rpm: 3000 },
    engine2: { name: "Starboard Engine", status: "online", temp: 198, power: 87, rpm: 3100 },
    comms: { name: "Communications", status: "online", signal: 92, channels_active: 18, encryption: "AES-256" },
    weapons: { name: "Forward Weapons", status: "standby", ready: true, missile_count: 92 }
};

// Alert system for critical events
let alertQueue = [];
let systemHistory = [];

// View switching functionality
function switchView(viewType) {
    const topView = document.getElementById('top-view-ship');
    const sideView = document.getElementById('side-view-ship');
    const topButton = document.getElementById('top-view');
    const sideButton = document.getElementById('side-view');
    
    if (viewType === 'top') {
        topView.style.display = 'block';
        sideView.style.display = 'none';
        topButton.classList.add('active');
        sideButton.classList.remove('active');
    } else {
        topView.style.display = 'none';
        sideView.style.display = 'block';
        topButton.classList.remove('active');
        sideButton.classList.add('active');
    }
}

// NEW: Alert Management System
function checkSystemAlerts(newSystems) {
    Object.keys(newSystems).forEach(systemId => {
        const system = newSystems[systemId];
        const oldSystem = shipSystems[systemId];
        
        // Check for status changes
        if (oldSystem && oldSystem.status !== system.status) {
            addAlert(system.name, oldSystem.status, system.status);
        }
        
        // Check for critical temperatures
        if (system.temp && system.temp > 210) {
            addAlert(system.name, 'temperature', `Critical: ${system.temp}°F`);
        }
        
        //Check for low power
        if (system.power && system.power < 50) {
            addAlert(system.name, 'power', `Low: ${system.power}%`);
        }
        
        // Check for signal loss
        if (system.signal && system.signal < 70) {
            addAlert(system.name, 'signal', `Weak: ${system.signal}%`);
        }
    });
}

//  Add alert to queue and display
function addAlert(systemName, alertType, alertValue) {
    const alert = {
        timestamp: new Date().toLocaleTimeString(),
        system: systemName,
        type: alertType,
        value: alertValue,
        id: Date.now()
    };
    
    alertQueue.unshift(alert); 
    if (alertQueue.length > 5) alertQueue.pop(); // Keeps only 5 most recent alerts
    
    displayAlerts();
}

//  Display alerts in UI
function displayAlerts() {
}
   
// Log system data for history/trends
function logSystemData(data) {
    const logEntry = {
        timestamp: new Date(data.timestamp),
        engineTemp: Math.round((data.systems.engine1.temp + data.systems.engine2.temp) / 2),
        avgPower: Math.round((data.systems.engine1.power + data.systems.engine2.power) / 2),
        commsSignal: data.systems.comms.signal,
        systemsOnline: Object.values(data.systems).filter(s => s.status === 'online').length
    };
    
    systemHistory.push(logEntry);
    
    // Keep only last 20 entries for performance
    if (systemHistory.length > 20) {
        systemHistory.shift();
    }
    
    // Update mini sparkline charts
    updateMiniCharts();
}

// Create mini trend charts
function updateMiniCharts() {
    // Temperature trend
    const tempTrend = systemHistory.map(h => h.engineTemp);
    updateSparkline('temp-trend', tempTrend, '#ff6b6b');
    
    // Power trend
    const powerTrend = systemHistory.map(h => h.avgPower);
    updateSparkline('power-trend', powerTrend, '#51cf66');
    
    // Signal trend
    const signalTrend = systemHistory.map(h => h.commsSignal);
    updateSparkline('signal-trend', signalTrend, '#339af0');
}

// Simple sparkline generator
function updateSparkline(elementId, data, color) {
    const element = document.getElementById(elementId);
    if (!element || data.length < 2) return;
    
    const width = 60;
    const height = 20;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    
    element.innerHTML = `
        <svg width="${width}" height="${height}" style="display: inline-block;">
            <polyline points="${points}" 
                     fill="none" 
                     stroke="${color}" 
                     stroke-width="2"/>
        </svg>
    `;
}

// Fetch live data from Python backend
async function fetchLiveData() {
    try {
        console.log('🔄 Fetching live data...');
        const response = await fetch(`${API_BASE}/systems`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Live data received:', data.timestamp);
		
		await fetchRadarData();
        
        // Check for alerts before updating
        checkSystemAlerts(data.systems);
        
        // Update systems with new data
        shipSystems = data.systems;
        
        // Log data for history
        logSystemData(data);
        
        // Update all visual elements
        updateSystemColors();
        updateStatusPanel(data);
        updateSystemReadings(data);
        updateDroneReadiness();
		updateMissionData(data);
		updateEnvironmentalData(data);
        
        // Update connection status
        updateConnectionStatus(true);
        
    } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
        console.log('🔄 Using simulated data...');
        updateConnectionStatus(false);
        simulateData(); // Fallback simulation
    }
}

// NEW: Check drone deployment readiness
function updateDroneReadiness() {
    const readyConditions = {
        commsOnline: shipSystems.comms && shipSystems.comms.status === 'online',
        signalStrong: shipSystems.comms && shipSystems.comms.signal > 80,
        enginesStable: shipSystems.engine1.status === 'online' && shipSystems.engine2.status === 'online',
        weaponsReady: shipSystems.weapons && shipSystems.weapons.ready
    };
    
    const allReady = Object.values(readyConditions).every(v => v === true);
    const readyCount = Object.values(readyConditions).filter(v => v === true).length;
    
    // Update Drone panel
    const dronePanel = document.querySelector('.card .card-body .text-muted');
    if (dronePanel) {
        dronePanel.innerHTML = `
            <h6>Deployment Readiness: ${readyCount}/4</h6>
            <div class="progress mb-2">
                <div class="progress-bar ${allReady ? 'bg-success' : 'bg-warning'}" 
                     style="width: ${(readyCount/4)*100}%"></div>
            </div>
            <small>
                ${readyConditions.commsOnline ? '✅' : '❌'} Comms Online<br>
                ${readyConditions.signalStrong ? '✅' : '❌'} Signal > 80%<br>
                ${readyConditions.enginesStable ? '✅' : '❌'} Engines Stable<br>
                ${readyConditions.weaponsReady ? '✅' : '❌'} Weapons Ready
            </small>
            <button class="btn btn-outline-primary btn-sm mt-2" 
                    ${allReady ? '' : 'disabled'}>
                ${allReady ? 'Deploy Drones' : 'Not Ready'}
            </button>
        `;
    }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    let statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.className = 'connection-status';
        document.body.appendChild(statusElement);
    }
    
    if (connected) {
        statusElement.innerHTML = '🟢 Live Data Connected';
        statusElement.className = 'connection-status connected';
    } else {
        statusElement.innerHTML = '🔴 Simulated Data Only';
        statusElement.className = 'connection-status disconnected';
    }
}

// Update system readings in the UI
function updateSystemReadings(data) {
    // Update vessel name
    const vesselName = document.querySelector('.navbar-brand');
    if (vesselName && data.vessel_info) {
        vesselName.textContent = `${data.vessel_info.name} - Systems Dashboard`;
    }
    
    // Update timestamp
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    let timestampElement = document.getElementById('last-update');
    if (timestampElement) {
        timestampElement.textContent = `Last Update: ${timestamp}`;
    }
	
	// Update footer metrics
	const fuelLevel = document.getElementById('fuel-level');
	if (fuelLevel) fuelLevel.textContent = `${Math.round(85 + Math.random() * 10)}%`;

	const shipSpeed = document.getElementById('ship-speed');
	if (shipSpeed && data.systems.bridge) {
		shipSpeed.textContent = `${data.systems.bridge.speed_knots || 0} kts`;
	}

	const dataPoints = document.getElementById('data-points');
	if (dataPoints) dataPoints.textContent = systemHistory.length;

	// calculate and display uptime
	const uptimeElement = document.getElementById('system-uptime');
	if (uptimeElement) {
		const startTime = window.dashboardStartTime || Date.now();
		const uptime = Date.now() - startTime;
		const hours = Math.floor(uptime / 3600000);
		const minutes = Math.floor((uptime % 3600000) / 60000);
		uptimeElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
	}
}

// Update mission display
function updateMissionData(data) {
    if (data.mission) {
        const mission = data.mission;
        
        // Update mission info
        const missionName = document.getElementById('mission-name');
        if (missionName) missionName.textContent = mission.name || 'No Active Mission';
        
        const missionType = document.getElementById('mission-type');
        if (missionType) {
            missionType.textContent = (mission.type || 'none').toUpperCase();
            missionType.className = `badge bg-${mission.priority === 'high' ? 'danger' : mission.priority === 'low' ? 'success' : 'info'}`;
        }
        
        const missionPriority = document.getElementById('mission-priority');
        if (missionPriority) {
            missionPriority.textContent = (mission.priority || 'standard').toUpperCase();
            missionPriority.className = `badge bg-${mission.priority === 'high' ? 'danger' : mission.priority === 'low' ? 'success' : 'warning'}`;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('mission-progress-bar');
        if (progressBar && mission.progress) {
            progressBar.style.width = `${mission.progress}%`;
            progressBar.textContent = `${mission.progress}%`;
            
            // Change color based on progress
            if (mission.progress < 30) {
                progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-danger';
            } else if (mission.progress < 70) {
                progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-warning';
            } else {
                progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
            }
        }
        
        // Update ETA
        const missionEta = document.getElementById('mission-eta');
        if (missionEta && mission.eta) {
            const eta = new Date(mission.eta);
            missionEta.textContent = eta.toLocaleTimeString();
        }
    }
}

// Update environmental data
function updateEnvironmentalData(data) {
    if (data.environmental) {
        const env = data.environmental;
        
        // Sea state with color coding
        const seaState = document.getElementById('sea-state');
        if (seaState) {
            seaState.textContent = (env.sea_state || '--').toUpperCase();
            seaState.className = env.sea_state === 'rough' ? 'text-danger' : 
                                 env.sea_state === 'moderate' ? 'text-warning' : 'text-success';
        }
        
        // Wind speed
        const windSpeed = document.getElementById('wind-speed');
        if (windSpeed) windSpeed.textContent = `${env.wind_speed_knots || '--'} kts`;
        
        // Visibility
        const visibility = document.getElementById('visibility');
        if (visibility) visibility.textContent = `${env.visibility_nm || '--'} nm`;
        
        // Air temp
        const airTemp = document.getElementById('air-temp');
        if (airTemp) airTemp.textContent = `${env.air_temp_f || '--'}°F`;
        
        // Pressure
        const pressure = document.getElementById('pressure');
        if (pressure) pressure.textContent = `${env.barometric_pressure || '--'} in`;
    }
    
    // Update heading from bridge data
    if (data.systems && data.systems.bridge) {
        const heading = document.getElementById('heading');
        if (heading) heading.textContent = `${data.systems.bridge.heading || '0'}°`;
    }
}

// Update ship diagram colors based on system status
function updateSystemColors() {
    Object.keys(shipSystems).forEach(systemId => {
        // Update both top and side view elements
        const elements = document.querySelectorAll(`[data-system="${systemId}"]`);
        elements.forEach(element => {
            const system = shipSystems[systemId];
            element.classList.remove('system-online', 'system-warning', 'system-critical', 'system-offline', 'system-standby');
            element.classList.add(`system-${system.status}`);
        });
    });
    
    // Update status cards with current data
    updateStatusCards();
}

// Update the status cards with current readings
function updateStatusCards() {
    // Average engine temperature with trend
    const engines = ['engine1', 'engine2'].map(id => shipSystems[id]).filter(Boolean);
    if (engines.length > 0) {
        const avgTemp = Math.round(engines.reduce((sum, eng) => sum + (eng.temp || 0), 0) / engines.length);
        const tempElement = document.getElementById('avg-engine-temp');
        if (tempElement) {
            tempElement.innerHTML = `${avgTemp}°F <span id="temp-trend"></span>`;
        }
    }
    
    // Average power output with trend
    if (engines.length > 0) {
        const avgPower = Math.round(engines.reduce((sum, eng) => sum + (eng.power || 0), 0) / engines.length);
        const powerElement = document.getElementById('avg-power');
        if (powerElement) {
            powerElement.innerHTML = `${avgPower}% <span id="power-trend"></span>`;
        }
    }
    
    // Communications signal with trend
    if (shipSystems.comms) {
        const signalElement = document.getElementById('comms-signal');
        if (signalElement) {
            signalElement.innerHTML = `${shipSystems.comms.signal || 0}% <span id="signal-trend"></span>`;
        }
    }
    
    // Systems online count
    const totalSystems = Object.keys(shipSystems).length;
    const onlineSystems = Object.values(shipSystems).filter(sys => sys.status === 'online').length;
    const countElement = document.getElementById('systems-count');
    if (countElement) countElement.textContent = `${onlineSystems}/${totalSystems}`;
    
    // Update overall status
    const overallStatus = document.getElementById('overall-status');
    if (overallStatus) {
        if (onlineSystems === totalSystems) {
            overallStatus.textContent = 'ALL SYSTEMS OPERATIONAL';
            overallStatus.className = 'badge bg-success me-3';
        } else if (onlineSystems >= totalSystems - 1) {
            overallStatus.textContent = 'SYSTEMS NOMINAL';
            overallStatus.className = 'badge bg-warning me-3';
        } else {
            overallStatus.textContent = 'MULTIPLE SYSTEMS OFFLINE';
            overallStatus.className = 'badge bg-danger me-3';
        }
    }
    
    // Update individual status badges
    Object.keys(shipSystems).forEach(systemId => {
        const statusCards = document.querySelectorAll(`[data-system="${systemId}"] .status-badge`);
        statusCards.forEach(badge => {
            const system = shipSystems[systemId];
            badge.textContent = system.status.toUpperCase();
            badge.className = `badge status-badge bg-${getStatusColor(system.status)}`;
        });
    });
}

// Get Bootstrap color class for status
function getStatusColor(status) {
    switch(status) {
        case 'online': return 'success';
        case 'warning': return 'warning';
        case 'critical': return 'danger';
        case 'offline': return 'secondary';
        case 'standby': return 'info';
        default: return 'secondary';
    }
}

// Add click handlers to ship components
function addClickHandlers() {
    document.querySelectorAll('.clickable').forEach(element => {
        element.addEventListener('click', function() {
            const systemId = this.getAttribute('data-system');
            showSystemDetails(systemId);
        });
    });
}

// Show detailed system information
function showSystemDetails(systemId) {
    const system = shipSystems[systemId];
    if (!system) return;
    
    // Update modal title and basic info
    document.getElementById('systemModalLabel').textContent = `${system.name} - System Details`;
    document.getElementById('modal-system-name').textContent = system.name;
    
    // Update status badge with color
    const statusBadge = document.getElementById('modal-status');
    statusBadge.textContent = system.status.toUpperCase();
    statusBadge.className = `badge bg-${getStatusColor(system.status)}`;
    
    // Update timestamp
    document.getElementById('modal-timestamp').textContent = new Date().toLocaleTimeString();
    
    // Build readings section
    let readingsHTML = '';
    let progressBarsHTML = '';
    let additionalInfoHTML = '';
    
    // Temperature
    if (system.temp !== undefined) {
        readingsHTML += `<p><strong>Temperature:</strong> ${system.temp}°F</p>`;
        const tempPercent = Math.min(100, Math.max(0, (system.temp - 60) / 160 * 100));
        const tempColor = system.temp > 210 ? 'danger' : (system.temp > 200 ? 'warning' : 'info');
        progressBarsHTML += `
            <div class="mb-2">
                <label class="form-label">Temperature: ${system.temp}°F</label>
                <div class="progress">
                    <div class="progress-bar bg-${tempColor}" role="progressbar" style="width: ${tempPercent}%" 
                         aria-valuenow="${system.temp}" aria-valuemin="60" aria-valuemax="220"></div>
                </div>
            </div>`;
    }
    
    // Power
    if (system.power !== undefined) {
        readingsHTML += `<p><strong>Power Output:</strong> ${system.power}%</p>`;
        const powerColor = system.power < 50 ? 'danger' : (system.power < 75 ? 'warning' : 'success');
        progressBarsHTML += `
            <div class="mb-2">
                <label class="form-label">Power Output: ${system.power}%</label>
                <div class="progress">
                    <div class="progress-bar bg-${powerColor}" role="progressbar" style="width: ${system.power}%" 
                         aria-valuenow="${system.power}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>`;
    }
    
    // Signal Strength
    if (system.signal !== undefined) {
        readingsHTML += `<p><strong>Signal Strength:</strong> ${system.signal}%</p>`;
        const signalColor = system.signal < 70 ? 'danger' : (system.signal < 85 ? 'warning' : 'success');
        progressBarsHTML += `
            <div class="mb-2">
                <label class="form-label">Signal Strength: ${system.signal}%</label>
                <div class="progress">
                    <div class="progress-bar bg-${signalColor}" role="progressbar" style="width: ${system.signal}%" 
                         aria-valuenow="${system.signal}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>`;
    }
    
    // Additional system-specific info
    if (system.rpm) {
        additionalInfoHTML += `<p><strong>RPM:</strong> ${system.rpm}</p>`;
    }
    if (system.crew_count) {
        additionalInfoHTML += `<p><strong>Crew Count:</strong> ${system.crew_count}</p>`;
    }
    if (system.channels_active) {
        additionalInfoHTML += `<p><strong>Active Channels:</strong> ${system.channels_active}</p>`;
    }
    if (system.encryption) {
        additionalInfoHTML += `<p><strong>Encryption:</strong> ${system.encryption}</p>`;
    }
    if (system.missile_count !== undefined) {
        additionalInfoHTML += `<p><strong>Missile Count:</strong> ${system.missile_count}</p>`;
    }
    if (system.ready !== undefined) {
        additionalInfoHTML += `<p><strong>Ready Status:</strong> ${system.ready ? '✅ Ready' : '❌ Not Ready'}</p>`;
    }
    
    // Add historical data if available
    if (systemHistory.length > 0) {
        additionalInfoHTML += `<hr><h6>Recent Trends</h6>`;
        additionalInfoHTML += `<p>Data points collected: ${systemHistory.length}</p>`;
    }
    
    // Update modal content
    document.getElementById('modal-readings').innerHTML = readingsHTML;
    document.getElementById('modal-progress-bars').innerHTML = progressBarsHTML;
    document.getElementById('modal-additional-info').innerHTML = additionalInfoHTML;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('systemModal'));
    modal.show();
}

// Fallback simulation for when backend is unavailable
function simulateData() {
    // Create simulated data object
    const simulatedData = {
        timestamp: new Date().toISOString(),
        vessel_info: {
            name: "USS Bootstrap",
            class: "Guided Missile Destroyer",
            hull_number: "DDG-101"
        },
        systems: {}
    };
    
    Object.keys(shipSystems).forEach(systemId => {
        const system = shipSystems[systemId];
        
        // Randomly adjust temperatures
        if (system.temp) {
            system.temp += Math.floor(Math.random() * 6) - 3; // ±3 degrees
            system.temp = Math.max(60, Math.min(220, system.temp)); // Keep in range
        }
        
        // Randomly adjust power
        if (system.power) {
            system.power += Math.floor(Math.random() * 10) - 5; // ±5%
            system.power = Math.max(0, Math.min(100, system.power)); // Keep in range
        }
        
        // Randomly adjust signal
        if (system.signal) {
            system.signal += Math.floor(Math.random() * 6) - 3; // ±3%
            system.signal = Math.max(0, Math.min(100, system.signal)); // Keep in range
        }
        
        // Small chance of status change
        if (Math.random() < 0.05) { 
            const statuses = ['online', 'online', 'online', 'warning']; // should be mostly online
            system.status = statuses[Math.floor(Math.random() * statuses.length)];
        }
        
        simulatedData.systems[systemId] = system;
    });
    
    // Check for alerts
    checkSystemAlerts(simulatedData.systems);
    
    // Log the data
    logSystemData(simulatedData);
    
    updateSystemColors();
    updateStatusCards();
    updateDroneReadiness();
}

// Start real-time data updates
function startDataUpdates() {
    console.log('🔄 Starting data updates every 3 seconds...');
    fetchLiveData(); // initial fetch
    setInterval(fetchLiveData, 3000); // Update every 3 seconds
}

// Update status panel with live data
function updateStatusPanel(data) {
    // for compatibility with existing backend
}

// Start countdown for drones (needs work)
function startDroneCountdown() {
    let seconds = 30;
    const interval = setInterval(() => {
        const droneBtn = document.querySelector('.btn-outline-primary');
        if (droneBtn && !droneBtn.disabled) {
            droneBtn.textContent = `Launch in ${seconds}s`;
            seconds--;
            if (seconds < 0) {
                droneBtn.textContent = 'Drones Deployed!';
                clearInterval(interval);
            }
        }
    }, 1000);
}

function updateDroneFleet() {
    const drones = [
        {id: 'UAV-001', status: 'ready', battery: 100, range: 50},
        {id: 'UAV-002', status: 'deploying', battery: 95, range: 45},
        {id: 'UAV-003', status: 'rtb', battery: 32, range: 12}
    ];
    
    const droneHtml = drones.map(d => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-${d.status === 'ready' ? 'success' : d.status === 'deploying' ? 'warning' : 'danger'}">
                ${d.id}
            </span>
            <div class="progress flex-grow-1 mx-2" style="height: 10px;">
                <div class="progress-bar" style="width: ${d.battery}%"></div>
            </div>
            <small>${d.range}km</small>
        </div>
    `).join('');
    
    const droneList = document.getElementById('drone-list');
    if (droneList) droneList.innerHTML = droneHtml;
}

// Call it in update loop
setInterval(updateDroneFleet, 5000);

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚢 Initializing Enhanced Ship Dashboard...');
    console.log('📊 Alert system active');
    console.log('📈 Data logging enabled');
    console.log('🚁 Drone readiness monitoring active');
	
    window.dashboardStartTime = Date.now();  // Store start time for uptime calculation
    
    updateSystemColors();
    addClickHandlers();
    startDataUpdates();
	initRadar();          
	startRadarAnimation();
    
    // Add refresh button functionality
    document.getElementById('refresh-system').addEventListener('click', function() {
        fetchLiveData();
        
        // Update the modal with fresh data (if known which system is open)
        const modalTitle = document.getElementById('systemModalLabel').textContent;
        if (modalTitle.includes(' - ')) {
            const systemName = modalTitle.split(' - ')[0];
            const systemId = Object.keys(shipSystems).find(id => 
                shipSystems[id].name === systemName
            );
            if (systemId) {
                setTimeout(() => showSystemDetails(systemId), 500);
            }
        }
    });
    
    // NEW: Export data functionality
    document.addEventListener('keydown', function(e) {
        // Press 'E' to export system log
        if (e.key === 'e' || e.key === 'E') {
            if (systemHistory.length > 0) {
                console.log('📊 System History Log:', systemHistory);
                console.log('⚠️ Alert Queue:', alertQueue);
            }
        }
    });
});

// Radar system variables
let radarData = null;
let radarCanvas = null;
let radarCtx = null;
let sweepAngle = 0;

// Initialize radar display
function initRadar() {
    radarCanvas = document.getElementById('radarCanvas');
    if (radarCanvas) {
        radarCtx = radarCanvas.getContext('2d');
        drawRadarScope();
    }
}

// Draw the basic radar scope (rings, lines, etc.)
function drawRadarScope() {
    if (!radarCtx) return;
    
    const centerX = 200;
    const centerY = 200;
    const maxRadius = 180;
    
    // Clear canvas
    radarCtx.clearRect(0, 0, 400, 400);
    
    // Draw range rings
    radarCtx.strokeStyle = '#0ea5e9';
    radarCtx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const radius = (maxRadius / 4) * i;
        radarCtx.beginPath();
        radarCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        radarCtx.stroke();
    }
    
    // Draw bearing lines (N, E, S, W)
    radarCtx.strokeStyle = '#0ea5e9';
    radarCtx.lineWidth = 0.5;
    
    // North-South line
    radarCtx.beginPath();
    radarCtx.moveTo(centerX, centerY - maxRadius);
    radarCtx.lineTo(centerX, centerY + maxRadius);
    radarCtx.stroke();
    
    // East-West line  
    radarCtx.beginPath();
    radarCtx.moveTo(centerX - maxRadius, centerY);
    radarCtx.lineTo(centerX + maxRadius, centerY);
    radarCtx.stroke();
    
    // compass markings
    radarCtx.fillStyle = '#10b981';
    radarCtx.font = 'bold 12px Courier New';
    radarCtx.textAlign = 'center';
    radarCtx.fillText('N', centerX, centerY - maxRadius - 10);
    radarCtx.fillText('S', centerX, centerY + maxRadius + 20);
    radarCtx.fillText('E', centerX + maxRadius + 15, centerY + 4);
    radarCtx.fillText('W', centerX - maxRadius - 15, centerY + 4);
    
    // Draw range labels
    radarCtx.fillStyle = '#7C8B8C';
    radarCtx.font = '10px Courier New';
    for (let i = 1; i <= 4; i++) {
        const radius = (maxRadius / 4) * i;
        const range = (30 / 4) * i; // 30nm max range
        radarCtx.fillText(range + 'nm', centerX + radius - 15, centerY - 5);
    }
}

// Draw radar sweep
function drawRadarSweep() {
    if (!radarCtx) return;
    
    const centerX = 200;
    const centerY = 200;
    const maxRadius = 180;
    
    // Draw sweep line
    const sweepX = centerX + Math.cos(sweepAngle) * maxRadius;
    const sweepY = centerY + Math.sin(sweepAngle) * maxRadius;
    
    radarCtx.strokeStyle = '#00ff00';
    radarCtx.lineWidth = 2;
    radarCtx.beginPath();
    radarCtx.moveTo(centerX, centerY);
    radarCtx.lineTo(sweepX, sweepY);
    radarCtx.stroke();
    
    // sweep trail (hopefully fading effect)
    const gradient = radarCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    
    radarCtx.fillStyle = gradient;
    radarCtx.beginPath();
    radarCtx.arc(centerX, centerY, maxRadius, sweepAngle - 0.3, sweepAngle);
    radarCtx.lineTo(centerX, centerY);
    radarCtx.fill();
    
    // Update sweep angle
    sweepAngle += 0.05; // Speed of the sweep
    if (sweepAngle > 2 * Math.PI) sweepAngle = 0;
}

// Draw radar contacts
function drawRadarContacts() {
    if (!radarCtx || !radarData) return;
    
    const centerX = 200;
    const centerY = 200;
    const maxRadius = 180;
    
    radarData.contacts.forEach(contact => {
        // Convert range to screen coordinates
        const screenRange = (contact.range_nm / 30) * maxRadius; // 30nm max range
        const bearingRad = (contact.bearing * Math.PI) / 180;
        
        const x = centerX + screenRange * Math.sin(bearingRad);
        const y = centerY - screenRange * Math.cos(bearingRad); // Negative because screen Y is inverted
        
        //  color based on contact type
        let color = '#ff6b35'; // Default orange
        if (contact.type === 'friendly_drone') color = '#10b981'; // Green for our drones
        else if (contact.type === 'surface_vessel') color = '#fbbf24'; // Yellow for ships
        else if (contact.type === 'aircraft') color = '#ef4444'; // Red for aircraft
        
        // Draw contact
        radarCtx.fillStyle = color;
        radarCtx.beginPath();
        radarCtx.arc(x, y, 4, 0, 2 * Math.PI);
        radarCtx.fill();
        
        // Add contact ID label
        radarCtx.fillStyle = '#ffffff';
        radarCtx.font = '8px Courier New';
        radarCtx.textAlign = 'center';
        radarCtx.fillText(contact.id, x, y - 8);
        
        // Add click detection (store contact data for clicking)
        contact.screenX = x;
        contact.screenY = y;
    });
}

// Update radar display
function updateRadar() {
    drawRadarScope();
    drawRadarSweep();
    drawRadarContacts();
}

// Fetch radar data and update display
async function fetchRadarData() {
    try {
        const response = await fetch(`${API_BASE}/radar`);
        if (response.ok) {
            radarData = await response.json();
            updateRadarContactsList();
            updateRadarStatus();
        }
    } catch (error) {
        console.log('Radar data fetch failed:', error);
    }
}

// Update radar contacts list in the side panel
function updateRadarContactsList() {
    if (!radarData) return;
    
    const contactsList = document.getElementById('radar-contacts-list');
    if (!contactsList) return;
    
    let html = '';
    
    radarData.contacts.forEach(contact => {
        let badgeClass = 'bg-secondary';
        let icon = 'fas fa-question';
        
        if (contact.type === 'friendly_drone') {
            badgeClass = 'bg-success';
            icon = 'fas fa-helicopter';
        } else if (contact.type === 'surface_vessel') {
            badgeClass = 'bg-warning';  
            icon = 'fas fa-ship';
        } else if (contact.type === 'aircraft') {
            badgeClass = 'bg-danger';
            icon = 'fas fa-plane';
        }
        
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-dark rounded contact-item" 
                 style="cursor: pointer;" onclick="showContactDetails('${contact.id}')">
                <div>
                    <i class="${icon}"></i>
                    <strong>${contact.id}</strong>
                    <br><small class="text-muted">${contact.mission}</small>
                </div>
                <div class="text-end">
                    <span class="badge ${badgeClass}">${contact.bearing}°</span><br>
                    <small>${contact.range_nm.toFixed(1)}nm</small>
                </div>
            </div>
        `;
    });
    
    contactsList.innerHTML = html;
}

// Update radar status indicators
function updateRadarStatus() {
    if (!radarData) return;
    
    const contactsCount = document.getElementById('radar-contacts-count');
    if (contactsCount) {
        contactsCount.textContent = `${radarData.contacts.length} Contacts`;
    }
}

// Show contact details (expand this later)
function showContactDetails(contactId) {
    if (!radarData) return;
    
    const contact = radarData.contacts.find(c => c.id === contactId);
    if (contact) {
        alert(`Contact Details:\n\n` +
              `ID: ${contact.id}\n` +
              `Type: ${contact.type}\n` +
              `Bearing: ${contact.bearing}°\n` +
              `Range: ${contact.range_nm.toFixed(1)} nm\n` +
              `Altitude: ${contact.altitude_ft} ft\n` +
              `Speed: ${contact.speed_kts} kts\n` +
              `Status: ${contact.status}\n` +
              `Mission: ${contact.mission}`);
    }
}


// START the radar animation loop
function startRadarAnimation() {
    setInterval(updateRadar, 100); // Update radar sweep 10 times per second
}

