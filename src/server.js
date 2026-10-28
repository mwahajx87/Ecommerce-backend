import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 5000;

try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 10) {
    throw new Error("JWT_SECRET must be set to at least 10 characters.");
  }
  await connectDatabase();

  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
  });
} catch (error) {
  console.error(`Backend startup failed: ${error.message}`);
  process.exitCode = 1;
}
