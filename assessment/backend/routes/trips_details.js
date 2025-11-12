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
 * @route GET /api/trips/:fileName
 * @desc Get trip events by filename
 * @example GET /api/trips/trip_1_cross_country
 */
/**
 * GET /api/trips/stream/:fileName/:vehicleId
 * Streams events for a vehicle in timestamp order, preserving real delays, using Server-Sent Events (SSE)
 * Example: GET /api/trips/stream/trip_1_cross_country/ABC123VIN
 */
router.get("/stream/:fileName/:vehicleId", async (req, res) => {
  const start = Date.now();
  console.log(`Stream connection requested: file=${req.params.fileName} vehicle=${req.params.vehicleId}`);
  let aborted = false;
  const cleanup = () => {
    aborted = true;
    console.log(`Client disconnected from stream: vehicle=${req.params.vehicleId}`);
  };
  req.on('close', cleanup);
  res.on('close', cleanup);

  try {
    let { fileName, vehicleId } = req.params;
    if (!fileName.toLowerCase().endsWith(".json")) fileName = `${fileName}.json`;
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`Stream requested but trip file not found: ${filePath}`);
      res.status(404).json({ success: false, message: "Trip file not found." });
      return;
    }

    let rawData;
    try {
      rawData = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      console.error(`Error reading file for stream: ${filePath}`, err);
      res.status(500).json({ success: false, message: "Error reading trip file." });
      return;
    }

    let tripEvents;
    try {
      tripEvents = JSON.parse(rawData);
    } catch (err) {
      console.error(`Error parsing JSON for stream file: ${filePath}`, err);
      res.status(500).json({ success: false, message: "Invalid trip JSON." });
      return;
    }

    // Filter for this vehicle_id
    const eventsForVehicle = tripEvents.filter(e => e.vehicle_id === vehicleId);
    if (eventsForVehicle.length === 0) {
      console.log(`No events found for vehicle=${vehicleId} in file=${fileName}`);
      // Respond with empty SSE stream then end
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      res.write('event: end\ndata: no-events\n\n');
      res.end();
      return;
    }

    // Sort by timestamp
    eventsForVehicle.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log(`Streaming ${eventsForVehicle.length} events for vehicle=${vehicleId}`);

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stream events with real delays
    let lastTime = null;
    for (const event of eventsForVehicle) {
      if (aborted) break;
      const eventTime = new Date(event.timestamp).getTime();
      if (lastTime !== null) {
        const delay = eventTime - lastTime;
        if (delay > 0) {
          console.log(`Waiting ${delay}ms before sending next event for vehicle=${vehicleId}`);
          // Wait in small intervals so we can react to client disconnects
          const step = 200;
          let remaining = delay;
          while (remaining > 0 && !aborted) {
            const wait = Math.min(step, remaining);
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, wait));
            remaining -= wait;
          }
          if (aborted) break;
        }
      }
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        console.log(`Sent event for vehicle=${vehicleId} ts=${event.timestamp}`);
      } catch (err) {
        console.error(`Error writing to stream for vehicle=${vehicleId}:`, err);
        break;
      }
      lastTime = eventTime;
    }

    if (!aborted) {
      res.write('event: end\ndata: done\n\n');
      console.log(`Completed stream for vehicle=${vehicleId} duration=${Date.now()-start}ms`);
    }
    try {
      if (!res.writableEnded) res.end();
    } catch (err) {
      console.warn('Error ending response after stream:', err);
    }
    // remove listeners to avoid memory leaks
    try {
      req.removeListener('close', cleanup);
      res.removeListener('close', cleanup);
    } catch (err) {
      // ignore
    }
  } catch (error) {
    console.error("Error streaming events:", error);
    if (!res.headersSent) res.status(500).json({ success: false, message: "Error streaming events." });
    else res.end();
  }
});

/**
 * @route GET /api/trips/:fileName
 * @desc Get trip events by filename
 * @example GET /api/trips/trip_1_cross_country
 */
router.get("/:fileName", (req, res) => {
  try {
    let { fileName } = req.params;
    // Accept filenames provided with or without the .json extension
    if (!fileName.toLowerCase().endsWith(".json")) fileName = `${fileName}.json`;
    const filePath = path.join(dataDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Trip file not found." });
    }

    // Read and parse JSON
    const rawData = fs.readFileSync(filePath, "utf-8");
    const tripEvents = JSON.parse(rawData);

    // Sort chronologically by timestamp
    tripEvents.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    res.status(200).json({
      success: true,
      fileName: fileName.replace(/\.json$/i, ""),
      totalEvents: tripEvents.length,
      data: tripEvents,
    });
  } catch (error) {
    console.error("Error reading trip file:", error);
    res.status(500).json({ message: "Error reading trip data." });
  }
});

export default router;
