// src/server.js

import express from "express";

import dotenv from "dotenv";
dotenv.config();

import { loginQB } from "./services/qbService.js";

import connectDB from "./config/db.js";

import monitorJob from "./jobs/monitorJob.js";
import cleanupJob from "./jobs/cleanupJob.js";
import retryJob from "./jobs/retryJob.js";

const app = express();

app.use(express.json());

await connectDB();

await loginQB();

monitorJob();
cleanupJob();
retryJob();

app.get("/", (req, res) => {
  res.json({
    status: "Torrent Cleaner Running"
  });
});

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on ${process.env.PORT}`
  );
});