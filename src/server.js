import app from "./app.js";
import { testDbConnection } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await testDbConnection();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
