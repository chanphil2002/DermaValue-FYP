import app from "./app";
import env from "./util/validateEnv";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const port = env.PORT;

console.log("Attempting to connect to PostgreSQL via Prisma...");

// ✅ Connect to PostgreSQL via Prisma
prisma.$connect()
  .then(() => {
    console.log("🟢 [Prisma]: Connected to PostgreSQL");

    // ✅ Start the server only after Prisma connects successfully
    app.listen(port, () => {
      console.log(`🚀 [Server]: Running at http://localhost:${port}`);
    });
  })
  .catch((error: any) => {
    console.error("🔴 [Prisma]: Connection error", error);
    process.exit(1); // Exit process if database connection fails
  });

// ✅ Graceful Shutdown (Disconnect Prisma on Exit)
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("🔴 [Prisma]: Disconnected");
  process.exit(0);
});