import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const buildMongoUri = () => {
  const envUri = process.env.MONGODB_URI;
  if (envUri) {
    return envUri;
  }

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST;
  const dbName = process.env.DB_NAME;
  const options = process.env.DB_OPTIONS;

  if (!user || !password || !host || !dbName) {
    throw new Error(
      "Missing one or more required DB env vars: DB_USER, DB_PASSWORD, DB_HOST, DB_NAME"
    );
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const query = options ? `?${options}` : "";

  return `mongodb+srv://${encodedUser}:${encodedPassword}@${host}/${dbName}${query}`;
};

const connectDB = async () => {
  const uri = buildMongoUri();

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
