import cron from "node-cron";

import monitor from "../services/monitorService.js";

export default function monitorJob() {
  cron.schedule("*/5 * * * *", async () => {
    console.log(
      "Running monitor job"
    );

    await monitor();
  });
}