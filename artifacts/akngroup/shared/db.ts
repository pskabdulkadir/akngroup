import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mlm";

if (!MONGO_URI) {
  throw new Error("MONGODB_URI environment variable is not defined.");
}

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(MONGO_URI, {
    autoIndex: true,
  });

  console.log("✅ MongoDB connected");
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
  console.log("❌ MongoDB disconnected");
};