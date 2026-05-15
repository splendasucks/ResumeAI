import mongoose from "mongoose";
import { getServerEnv } from "./env";

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  const { MONGODB_URL } = getServerEnv();

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URL);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
  }
};
