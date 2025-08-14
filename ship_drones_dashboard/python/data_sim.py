#Geoff King
#data_sim.py
#Generates random data to see modals update

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import datetime
import json

app = Flask(__name__)
CORS(app)  # allows all origins

# Mission data storage (simulating a database)
mission_data = {
    "active_mission": None,
    "mission_history": [],
    "total_missions": 0,
    "vessel_stats": {
        "hours_operational": 2457,
        "nautical_miles": 12853,
        "fuel_consumed": 45789
    }
}

# Ship systems data with random generation
def generate_ship_data():
    # simulate some system degradation over time
    time_factor = datetime.datetime.now().second / 60  # 0 to 1 based on current second
    
    # More sophisticated status determination
    def get_system_status(base_reliability=0.9):
        rand = random.random()
        if rand < base_reliability:
            return "online"
        elif rand < base_reliability + 0.08:
            return "warning"
        else:
            return "critical"
    
    return {
        "timestamp": datetime.datetime.now().isoformat(),
        "vessel_info": {
            "name": "USS Bootstrap",
            "class": "Guided Missile Destroyer",
            "hull_number": "DDG-101",
            "crew_complement": 280,
            "displacement": "9,200 tons",
            "length": "509 feet",
            "beam": "66 feet",
            "speed": "30+ knots"
        },
        "systems": {
            "bridge": {
                "name": "Bridge",
                "status": get_system_status(0.95),  # Bridge most reliable
                "temp": random.randint(68, 78),
                "crew_count": random.randint(4, 8),
                "heading": random.randint(0, 359),
                "speed_knots": random.randint(0, 32)
            },
            "engine1": {
                "name": "Port Engine",
                "status": get_system_status(0.85),
                "temp": random.randint(185, 215),  # gives range for realism
                "power": random.randint(70, 95),
                "rpm": random.randint(2800, 3200),
                "fuel_rate": round(random.uniform(120, 180), 1),  # gallons/hour
                "hours_since_maintenance": random.randint(100, 500)
            },
            "engine2": {
                "name": "Starboard Engine", 
                "status": get_system_status(0.85),
                "temp": random.randint(185, 215),
                "power": random.randint(70, 95),
                "rpm": random.randint(2800, 3200),
                "fuel_rate": round(random.uniform(120, 180), 1),
                "hours_since_maintenance": random.randint(100, 500)
            },
            "comms": {
                "name": "Communications",
                "status": get_system_status(0.88),
                "signal": random.randint(75, 98),
                "channels_active": random.randint(12, 24),
                "encryption": "AES-256",
                "satellite_lock": random.choice([True, True, True, False]),  # Usually true
                "bandwidth_usage": random.randint(20, 80)  # percentage
            },
            "weapons": {
                "name": "Weapons Systems",
                "status": random.choice(["standby", "standby", "online", "warning"]),
                "ready": random.choice([True, True, False]),  # Usually ready
                "missile_count": random.randint(85, 96),
                "ciws_status": random.choice(["ready", "ready", "testing"]),  # Close-In Weapon System
                "targeting_accuracy": random.randint(92, 99)  # percentage
            },
            "radar": {
                "name": "Radar Systems",
                "status": get_system_status(0.92),
                "range_nm": random.randint(180, 250),  # nautical miles
                "contacts_tracked": random.randint(0, 15),
                "mode": random.choice(["search", "track", "combat"]),
                "power_output": random.randint(85, 100)
            },
            "sonar": {
                "name": "Sonar Systems",
                "status": get_system_status(0.90),
                "mode": random.choice(["passive", "active", "off"]),
                "depth_feet": random.randint(100, 600),
                "contacts": random.randint(0, 3),
                "water_temp_f": random.randint(45, 75)
            }
        },
        "environmental": {
            "sea_state": random.choice(["calm", "moderate", "rough"]),
            "wind_speed_knots": random.randint(5, 25),
            "wind_direction": random.randint(0, 359),
            "visibility_nm": random.randint(5, 20),
            "air_temp_f": random.randint(50, 85),
            "barometric_pressure": round(random.uniform(29.80, 30.20), 2)
        },
        "mission": generate_mission_data()
    }

def generate_mission_data():
    """Generate current mission information"""
    missions = [
        {"type": "patrol", "name": "Routine Patrol", "priority": "standard"},
        {"type": "escort", "name": "Merchant Escort", "priority": "high"},
        {"type": "training", "name": "Fleet Exercise", "priority": "low"},
        {"type": "surveillance", "name": "Maritime Surveillance", "priority": "high"},
        {"type": "transit", "name": "Port Transit", "priority": "standard"}
    ]
    
    current_mission = random.choice(missions)
    current_mission.update({
        "duration_hours": random.randint(2, 48),
        "progress": random.randint(10, 90),
        "eta": (datetime.datetime.now() + datetime.timedelta(hours=random.randint(1, 12))).isoformat()
    })
    
    return current_mission

@app.route('/api/systems')
def get_systems():
    data = generate_ship_data()
    print(f"Serving data at {data['timestamp']}")  # Server-side logging
    return jsonify(data)

@app.route('/api/metrics')
def get_metrics():
    """Endpoint for system performance metrics"""
    metrics = {
        "timestamp": datetime.datetime.now().isoformat(),
        "performance": {
            "overall_efficiency": random.randint(85, 98),
            "fuel_efficiency": random.randint(70, 95),
            "crew_readiness": random.randint(88, 100),
            "combat_readiness": random.randint(80, 100)
        },
        "resources": {
            "fuel_percentage": random.randint(60, 95),
            "ammunition_percentage": random.randint(75, 95),
            "provisions_days": random.randint(15, 45),
            "fresh_water_percentage": random.randint(70, 98)
        },
        "maintenance": {
            "scheduled_items": random.randint(3, 12),
            "overdue_items": random.randint(0, 3),
            "completed_today": random.randint(0, 5)
        }
    }
    return jsonify(metrics)

@app.route('/api/drone-systems')
def get_drone_systems():
    """Future endpoint for drone fleet management"""
    drones = []
    for i in range(3):  # Simulate 3 drones
        drone = {
            "id": f"DRONE-{i+1:03d}",
            "status": random.choice(["docked", "deployed", "returning", "maintenance"]),
            "battery": random.randint(20, 100),
            "range_km": random.randint(5, 50),
            "altitude_m": random.randint(0, 500) if random.choice([True, False]) else 0,
            "mission": random.choice(["surveillance", "patrol", "idle", "reconnaissance"]),
            "last_contact": datetime.datetime.now().isoformat()
        }
        drones.append(drone)
    
    return jsonify({
        "timestamp": datetime.datetime.now().isoformat(),
        "total_drones": len(drones),
        "operational": sum(1 for d in drones if d["status"] in ["deployed", "returning"]),
        "drones": drones
    })

@app.route('/api/alerts')
def get_alerts():
    """Generate system alerts"""
    alert_types = [
        {"level": "info", "system": "Bridge", "message": "Course adjustment completed"},
        {"level": "warning", "system": "Engine", "message": "Temperature above normal"},
        {"level": "info", "system": "Radar", "message": "New contact detected"},
        {"level": "warning", "system": "Fuel", "message": "Consumption rate high"},
        {"level": "critical", "system": "Hull", "message": "Minor damage detected"},
        {"level": "info", "system": "Comms", "message": "Satellite handover complete"}
    ]
    
    # Generate 0-3 random alerts
    num_alerts = random.randint(0, 3)
    alerts = []
    for _ in range(num_alerts):
        alert = random.choice(alert_types).copy()
        alert["timestamp"] = datetime.datetime.now().isoformat()
        alert["id"] = random.randint(1000, 9999)
        alerts.append(alert)
    
    return jsonify(alerts)

@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "uptime_seconds": random.randint(1000, 100000),
        "version": "2.0.0",
        "endpoints_available": [
            "/api/systems",
            "/api/metrics", 
            "/api/drone-systems",
            "/api/alerts",
            "/api/health"
        ]
    })

@app.route('/')
def home():
    return """
    <h1>🚢 Ship Dashboard API v2.0</h1>
    <h2>Available Endpoints:</h2>
    <ul>
        <li><a href="/api/systems">/api/systems</a> - Main ship systems data</li>
        <li><a href="/api/metrics">/api/metrics</a> - Performance metrics</li>
        <li><a href="/api/drone-systems">/api/drone-systems</a> - Drone fleet status</li>
        <li><a href="/api/alerts">/api/alerts</a> - System alerts</li>
        <li><a href="/api/health">/api/health</a> - API health check</li>
    </ul>
    <p>CORS enabled for frontend access</p>
    """

@app.route('/api/hardware-status')
def hardware_status():
    """Endpoint for future hardware connections"""
    return jsonify({
        "hardware_connected": False,
        "available_ports": ["COM3", "COM4", "/dev/ttyUSB0"],
        "protocol": "MAVLink",  # Real drone protocol
        "message": "Ready for hardware connection"
    })


@app.route('/api/radar')
def get_radar_contacts():
    """Generate simulated radar contacts including drones relative to ship"""
    import math
    
    # Ship's current position (center of radar)
    ship_lat = 41.2345
    ship_lon = -70.5678
    
    contacts = []
    
    # Adds some simulated drones around the ship
    drone_contacts = [
        {
            "id": "UAV-001",
            "type": "friendly_drone",
            "bearing": random.randint(0, 359),
            "range_nm": random.uniform(2, 15),
            "altitude_ft": random.randint(200, 800),
            "speed_kts": random.randint(25, 50),
            "status": "operational",
            "mission": "patrol"
        },
        {
            "id": "UAV-002", 
            "type": "friendly_drone",
            "bearing": random.randint(0, 359),
            "range_nm": random.uniform(1, 12),
            "altitude_ft": random.randint(150, 600),
            "speed_kts": random.randint(20, 45),
            "status": "returning",
            "mission": "reconnaissance"
        },
        {
            "id": "UAV-003",
            "type": "friendly_drone", 
            "bearing": random.randint(0, 359),
            "range_nm": random.uniform(3, 20),
            "altitude_ft": random.randint(100, 400),
            "speed_kts": random.randint(15, 35),
            "status": "deploying",
            "mission": "surveillance"
        }
    ]
    
    # Adds some other contacts (ships, aircraft)
    other_contacts = [
        {
            "id": "SFC-001",
            "type": "surface_vessel",
            "bearing": random.randint(0, 359),
            "range_nm": random.uniform(5, 25),
            "altitude_ft": 0,
            "speed_kts": random.randint(8, 18),
            "status": "unknown",
            "mission": "transit"
        },
        {
            "id": "AIR-001", 
            "type": "aircraft",
            "bearing": random.randint(0, 359),
            "range_nm": random.uniform(10, 35),
            "altitude_ft": random.randint(2000, 8000),
            "speed_kts": random.randint(150, 300),
            "status": "civilian",
            "mission": "transit"
        }
    ]
    
    # Combine all contacts to radar
    all_contacts = drone_contacts + other_contacts
    
    # Convert to radar format with x,y coordinates for display
    for contact in all_contacts:
        # Convert polar (bearing/range) to cartesian (x/y) for radar display
        bearing_rad = math.radians(contact["bearing"])
        contact["x"] = contact["range_nm"] * math.sin(bearing_rad)
        contact["y"] = contact["range_nm"] * math.cos(bearing_rad) 
        
        # Add some random movement for next update
        contact["bearing"] = (contact["bearing"] + random.randint(-5, 5)) % 360
        contact["range_nm"] = max(0.5, contact["range_nm"] + random.uniform(-0.5, 0.5))
    
    return jsonify({
        "timestamp": datetime.datetime.now().isoformat(),
        "ship_position": {"lat": ship_lat, "lon": ship_lon},
        "radar_settings": {
            "range_nm": 30,
            "sweep_rpm": 12,
            "bearing": random.randint(0, 359)  # Current sweep position
        },
        "contacts": all_contacts,
        "contact_summary": {
            "total": len(all_contacts),
            "drones": len(drone_contacts),
            "surface": len([c for c in all_contacts if c["type"] == "surface_vessel"]),
            "air": len([c for c in all_contacts if c["type"] == "aircraft"])
        }
    })

if __name__ == '__main__':
    print("🚢 Starting Enhanced Ship Dashboard API v2.0...")
    print("📡 CORS enabled for frontend access")
    print("🌐 API available at: http://localhost:5000")
    print("📊 New endpoints added for metrics and drone systems")
    app.run(debug=True, host='0.0.0.0', port=5000)
