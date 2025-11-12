import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON data folder
const dataDir = path.join(__dirname, "../data");

/**
 * GET /api/trips/vehicles
 * Return a mapping of trip filename -> unique vehicle ids seen in that trip's events
 * Example: GET /api/trips/vehicles
 */
router.get("/", (req, res) => {
	try {
		const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

		const result = {};

		files.forEach((file) => {
			const filePath = path.join(dataDir, file);
			try {
				const raw = fs.readFileSync(filePath, "utf-8");
				const events = JSON.parse(raw);
				const vehicleIds = Array.from(
					new Set(events.map((e) => e.vehicle_id).filter(Boolean))
				);
				// key without extension for consistency with other routes
				const key = file.replace(/\.json$/i, "");
				result[key] = vehicleIds;
			} catch (err) {
				// If a file fails to parse skip it but record an empty array
				const key = file.replace(/\.json$/i, "");
				result[key] = [];
			}
		});

		res.status(200).json({ success: true, vehiclesByTrip: result });
	} catch (error) {
		console.error("Error listing vehicle details:", error);
		res.status(500).json({ success: false, message: "Error reading vehicle data." });
	}
});

/**
 * GET /api/trips/vehicles/all
 * Return a deduplicated array of all vehicle_id (VIN) strings seen across all trip files
 * Example: GET /api/trips/vehicles/all
 */
router.get("/all", (req, res) => {
	try {
		const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

		const vins = new Set();

		files.forEach((file) => {
			const filePath = path.join(dataDir, file);
			try {
				const raw = fs.readFileSync(filePath, "utf-8");
				const events = JSON.parse(raw);
				events.forEach((e) => {
					if (e && e.vehicle_id) vins.add(String(e.vehicle_id));
				});
			} catch (err) {
				// Ignore parse/read errors for individual files
			}
		});

		res.status(200).json({ success: true, vehicle_id: Array.from(vins) });
	} catch (error) {
		console.error("Error aggregating VINs:", error);
		res.status(500).json({ success: false, message: "Error reading vehicle data." });
	}
});

/**
 * GET /api/trips/vehicles/:fileName
 * Return unique vehicle ids for a single trip file (filename may be provided with or without .json)
 * Example: GET /api/trips/vehicles/trip_1_cross_country
 */
router.get("/:fileName", (req, res) => {
	try {
		let { fileName } = req.params;
		if (!fileName.toLowerCase().endsWith(".json")) fileName = `${fileName}.json`;

		const filePath = path.join(dataDir, fileName);
		if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Trip file not found." });

		const raw = fs.readFileSync(filePath, "utf-8");
		const events = JSON.parse(raw);
		const vehicleIds = Array.from(new Set(events.map((e) => e.vehicle_id).filter(Boolean)));

		res.status(200).json({ success: true, fileName: fileName.replace(/\.json$/i, ""), vehicles: vehicleIds });
	} catch (error) {
		console.error("Error reading vehicle details:", error);
		res.status(500).json({ success: false, message: "Error reading trip vehicle data." });
	}
});

export default router;