import mongoose from "mongoose";
import dns from "dns";
import { getEnv } from "./env.config.js";

// Force Google DNS — fixes ISP-level DNS blocks on MongoDB Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
  const uri = getEnv("MONGODB_URL");

  mongoose.connection.on("connected", () =>
    console.log("✅ MongoDB connected"),
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("⚠️  MongoDB disconnected"),
  );
  mongoose.connection.on("error", (err) =>
    console.error("❌ MongoDB error:", err.message),
  );

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  });
};
