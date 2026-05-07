import cron from "node-cron";

import retry from "../services/retryService.js";

export default function retryJob() {
  cron.schedule("*/5 * * * *", async () => {
    console.log(
      "Running retry job"
    );

    await retry();
  });
}