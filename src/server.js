import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

try {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`SHOP.CO API listening on port ${env.port}`);
  });
} catch (error) {
  console.error("Failed to start API", error);
  process.exitCode = 1;
}
