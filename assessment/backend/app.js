import express from "express";
import cors from "cors";
import tripsRouter from "./routes/trips.js";
import tripsDetailsRouter from "./routes/trips_details.js";
import vehicleDetailsRouter from "./routes/vehicle_details.js";

const app = express();
app.use(cors());
app.use(express.json());

// Register specific trip sub-routes first so they are not captured by the
// more generic `/api/trips` router which has a `/:filename` route.
// Serve detailed trip events (JSON) from data files
// Example: GET /api/trips/details/trip_1_cross_country
app.use("/api/trips/details", tripsDetailsRouter);
// Serve vehicle lists per trip
// Example: GET /api/trips/vehicles -> { tripFile: [vehicleIds] }
// Example: GET /api/trips/vehicles/trip_1_cross_country -> { vehicles: [...] }
app.use("/api/trips/vehicles", vehicleDetailsRouter);
// Generic trips router (list files, return raw file by name, etc.)
app.use("/api/trips", tripsRouter);

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));