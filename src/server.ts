import app from "./app";
import env from "./util/validateEnv";
import mongoose from "mongoose";

const port = env.PORT;

console.log("Attempting to connect to MongoDB...");

mongoose.set('debug', true); // Enable mongoose debug mode

mongoose.connect(env.MONGO_CONNECTION_STRING!, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging indefinitely
})
  .then(() => {
    console.log("[mongo]: Connected to the database");
    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("[mongo]: Connection error", error);
  });