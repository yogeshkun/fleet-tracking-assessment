# Fleet Tracking Assessment Data Generator

This system generates realistic fleet tracking data for the assessment using real road routes from the OSRM (Open Source Routing Machine) API.

## Features

- Fetches real driving routes between coordinates using OSRM public API
- Generates comprehensive fleet tracking events with realistic GPS data
- Creates diverse trip scenarios across different US regions
- Produces chronologically ordered events with proper timestamps
- Supports both single trip generation (development) and multi-trip assessment data

## Implementation Overview

The generator creates **comprehensive fleet tracking events** with both specific and random placement logic:

**Specific Placement Events:**
- **Location ping events** (regular GPS updates every 30 seconds)
- **Trip lifecycle events** (tracking_started, trip_started, trip_completed, tracking_stopped)
- **Distance milestone events** (at regular distance intervals)
- **Time milestone events** (at regular time intervals - accounts for stopping time)
- **Scheduled stop events** (planned stops with arrival/departure)

**Random Placement Events:**
- **Movement/Behavior Events**: speed_changed, speed_violation, vehicle_stopped, vehicle_moving, unscheduled_stop
- **Technical/System Events**: signal_degraded, signal_lost/recovered, device_battery_low, device_overheating, device_error
- **Conditional Events**: fuel_level_low, refueling_started/completed, trip_paused/resumed, vehicle_telemetry
- **Trip Cancellation**: trip_cancelled (random chance, can truncate events)

**Key Features:**
- **Realistic trip durations** based on actual route distances
- **Realistic GPS data**: speed, heading, accuracy, altitude, signal quality
- **Smart time calculations**: Time milestones account for unscheduled stops
- **Fuel consumption modeling**: Based on distance and consumption rate
- **Proper event structure** matching the fleet tracking event types specification
- **Chronological ordering** of all events by timestamp

## Usage

1. Navigate to data generator and install dependencies:
```bash
cd data-generator
npm install
```

2. Run the script:
```bash
npm start
```

3. Generate assessment data (5 different trip scenarios):
```bash
cd data-generator
npm run assessment
# OR for candidates:
npm run generate
```

4. The scripts will (run from `data-generator/` folder):
   - **npm start**: Generate single comprehensive trip for development/testing
   - **npm run assessment** / **npm run generate**: Generate 5 different trip scenarios for candidate assessment
   - **npm run geojson**: Process `trip-events.json` and create GeoJSON files (development only)

## Output Files

### Assessment Trip Files (`assessment-YYYY-MM-DD-HH-MM-SS/` folder)
The assessment script generates 5 different trip scenarios with **randomized diverse routes** across the United States:

1. **`trip_1_cross_country.json`** - Cross-country long haul delivery
   - **Routes**: NY→LA, SF→Miami, Chicago→Seattle, Houston→Boston
   - **Purpose**: Tests comprehensive event handling and extended streaming
   - **Features**: Transcontinental distances, multiple time zones, varied terrain

2. **`trip_2_urban_dense.json`** - Dense urban delivery route
   - **Routes**: Chicago metro, LA metro, NYC metro, SF Bay Area
   - **Purpose**: Tests high-frequency event processing and urban patterns
   - **Features**: Dense location updates, traffic patterns, short distances

3. **`trip_3_mountain_cancelled.json`** - Mountain route cancelled due to weather
   - **Routes**: Denver→Salt Lake, Salt Lake→Boise, Denver→Vail, Fresno→Yosemite
   - **Purpose**: Tests edge case handling and abrupt stream termination
   - **Features**: High altitude routes, weather cancellations, terrain challenges

4. **`trip_4_southern_technical.json`** - Southern route with technical issues
   - **Routes**: Houston→Miami, Atlanta→New Orleans, Austin→El Paso, Tampa→Orlando
   - **Purpose**: Tests error state visualization and device problem handling
   - **Features**: Gulf Coast/Southern routes, enhanced technical events, heat issues

5. **`trip_5_regional_logistics.json`** - Regional logistics with fuel management
   - **Routes**: Seattle→Portland, Boston→NYC, Detroit→Chicago, Sacramento→Fresno
   - **Purpose**: Tests operational event visualization and fuel management
   - **Features**: Regional corridors, fuel optimization, maintenance events

**🎲 Randomization**: Each generation selects different routes from 20+ options, ensuring unique assessment data per candidate.

**Additional Assessment Files:**
- `fleet-tracking-event-types.md` - Complete event type reference

### Development Trip Events (`trip-events.json`)
Single comprehensive trip for development/testing. Here's an example location_ping event structure:

```json
{
  "event_id": "evt_1762154470128_letpsjcr4",
  "event_type": "location_ping",
  "timestamp": "2025-11-03T10:00:00.000Z",
  "vehicle_id": "VH_123",
  "trip_id": "trip_20251103_100000",
  "location": {
    "lat": 37.774938,
    "lng": -122.419449,
    "accuracy_meters": 14.1,
    "altitude_meters": 31.2
  },
  "movement": {
    "speed_kmh": 0,
    "heading_degrees": 0,
    "moving": false
  },
  "signal_quality": "excellent"
}
```


## Project Structure

```
fleet-tracking-assessment/
├── README.md                      # 🎯 Main assessment entry point for candidates
├── HOW_TO_GENERATE_DATA.md       # 🛠️ Data generation instructions for candidates
├── FLEET_TRACKING_EVENT_TYPES.md # 📖 Complete event type reference (27 types)
├── assessment-fallback-data/      # 💾 Pre-generated fallback data for candidates
│   ├── trip_1_cross_country.json  # Fallback cross-country trip
│   ├── trip_2_urban_dense.json    # Fallback urban trip
│   ├── trip_3_mountain_cancelled.json # Fallback cancelled trip
│   ├── trip_4_southern_technical.json # Fallback technical issues trip
│   ├── trip_5_regional_logistics.json # Fallback logistics trip
│   └── fleet-tracking-event-types.md # Event type reference
└── data-generator/                # 🔧 Data generation tools (for development)
    ├── TECHNICAL_README.md        # This file (technical documentation)
    ├── generate-trip-events.js    # Single trip generator (development)
    ├── generate-assessment-trips.js # Assessment data generator (5 scenarios)
    ├── event-generators.js        # Specific placement event generators
    ├── random-event-generators.js # Random placement event generators
    ├── package.json               # Dependencies and scripts
    ├── package-lock.json          # Dependency lock file
    ├── node_modules/              # Dependencies (after npm install)
    └── assessment-YYYY-MM-DD-HH-MM-SS/ # Generated assessment folder
        ├── trip_1_cross_country.json  # Cross-country long haul (varies)
        ├── trip_2_urban_dense.json    # Dense urban delivery (varies)
        ├── trip_3_mountain_cancelled.json # Mountain route cancelled (varies)
        ├── trip_4_southern_technical.json # Southern route with issues (varies)
        ├── trip_5_regional_logistics.json # Regional logistics (varies)
        └── fleet-tracking-event-types.md # Event type reference
```

## Configuration

You can modify the following constants in `data-generator/generate-trip-events.js`:

- `START_COORDS`: Starting coordinates [longitude, latitude]
- `END_COORDS`: Ending coordinates [longitude, latitude]
- `VEHICLE_ID`: Vehicle identifier
- `TRIP_ID`: Trip identifier
- Time interval between location pings (currently 30 seconds)

## Event Types Generated

### Specific Placement Events (Position-Dependent)
- **Trip Lifecycle**: `tracking_started`, `trip_started`, `trip_completed`, `tracking_stopped`
- **Distance Milestones**: `distance_milestone` at 50km, 100km, 150km, 200km, 250km, 300km, 400km, 500km
- **Time Milestones**: `time_milestone` at 1hr, 2hr, 4hr, 6hr, 8hr, 12hr, 16hr, 20hr, 24hr intervals (accounts for stops)
- **Scheduled Stops**: `stop_arrival` and `stop_departure` at 25%, 50%, and 75% of the route
- **Location Pings**: `location_ping` every 30 seconds with realistic GPS data

### Random Placement Events (Context-Dependent)
- **Movement/Behavior**: `speed_changed`, `speed_violation`, `vehicle_stopped`, `vehicle_moving`, `unscheduled_stop`
- **Technical/System**: `signal_degraded`, `signal_lost`, `signal_recovered`, `device_battery_low`, `device_overheating`, `device_error`
- **Conditional**: `fuel_level_low`, `refueling_started`, `refueling_completed`, `trip_paused`, `trip_resumed`, `vehicle_telemetry`
- **Trip Cancellation**: `trip_cancelled` (5% chance, occurs early in trip, stops all further event generation)

## Troubleshooting

### Common Issues and Solutions

**1. OSRM API Connection Issues**
```
Error: Request failed with status code 429 (Too Many Requests)
Error: ENOTFOUND router.project-osrm.org
```
- **Solution**: The public OSRM API has rate limits. Wait a few minutes and try again
- **Alternative**: If persistent, check your internet connection or try again later
- **Workaround**: Use fallback data in `assessment-fallback-data/` folder

**2. Node.js Version Issues**
```
Error: Unexpected token '??' (nullish coalescing)
SyntaxError: Unexpected token 'optional chaining'
```
- **Solution**: Update to Node.js v14+ (recommended: v18+)
- **Check version**: `node --version`
- **Update**: Download from [nodejs.org](https://nodejs.org)

**3. npm install Failures**
```
Error: EACCES: permission denied
Error: Cannot resolve dependency tree
```
- **Solution**: Clear npm cache: `npm cache clean --force`
- **Alternative**: Delete `node_modules/` and `package-lock.json`, then run `npm install`
- **Permissions**: On macOS/Linux, avoid using `sudo` with npm

**4. Large File Generation Issues**
```
Error: JavaScript heap out of memory
Error: EMFILE: too many open files
```
- **Solution**: Increase Node.js memory: `node --max-old-space-size=4096 generate-assessment-trips.js`
- **File limits**: On macOS/Linux: `ulimit -n 4096`

**5. Empty or Corrupted Output Files**
- **Check**: Ensure stable internet connection during generation
- **Verify**: Generated files should be 100KB+ (except cancelled trips)
- **Solution**: Delete corrupted files and regenerate

**6. Generation Takes Too Long**
- **Expected time**: 2-5 minutes for full assessment data
- **If stuck**: Check console for error messages
- **Solution**: Restart generation, ensure OSRM API is accessible

### Getting Help

If issues persist:
1. Check the console output for specific error messages
2. Verify Node.js version compatibility (v18+ recommended)
3. Ensure stable internet connection for OSRM API calls
4. Use fallback data as alternative: `assessment-fallback-data/`

## Next Steps

The script can be further extended with:
- **External data integration** (real fuel station locations, actual signal dead zones)
- **Multiple trip scenarios** (different routes, vehicle types, weather conditions)
- **Advanced fuel modeling** (real-time fuel station prices, route optimization)
- **Traffic condition events** (based on real traffic data)
- **Driver behavior analysis** (fatigue detection, driving patterns)
- **Fleet management integration** (dispatch events, maintenance scheduling)

## Dependencies

- **axios**: For HTTP requests to OSRM API
- **fs**: For file system operations (built-in Node.js module)

## API Used

- **OSRM API**: `http://router.project-osrm.org/route/v1/driving/` - Public routing service
- No API key required for the public OSRM instance
