import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { summarizeTrip } from "../utils/summary.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../data");

router.get("/", (req, res) => {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  res.json(files);
});

router.get("/:filename", (req, res) => {
  const filePath = path.join(dataDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  const data = JSON.parse(fs.readFileSync(filePath));
  res.json(data);
});

router.get("/:filename/summary", (req, res) => {
  const filePath = path.join(dataDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  const data = JSON.parse(fs.readFileSync(filePath));
  const summary = summarizeTrip(data);
  res.json(summary);
});

export default router;
