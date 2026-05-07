import express from "express";
import cron from "node-cron";

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";

import monitorJob from "./jobs/monitorJob.js";
import cleanupJob from "./jobs/cleanupJob.js";
import retryJob from "./jobs/retryJob.js";

const app = express();

app.use(express.json());

await connectDB();

monitorJob();
cleanupJob();
retryJob();

app.get("/", (req, res) => {
  res.json({
    status: "Torrent Cleaner Running"
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});