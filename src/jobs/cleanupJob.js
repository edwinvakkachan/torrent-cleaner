import cron from "node-cron";

import cleanup from "../services/cleanupService.js";

export default function cleanupJob() {
  cron.schedule("*/10 * * * *", async () => {
    console.log(
      "Running cleanup job"
    );

    await cleanup();
  });
}