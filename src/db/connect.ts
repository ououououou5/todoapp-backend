import mongoose from "mongoose";

export async function connectToMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

/* connection stored version

// src/db/connect.ts
import mongoose from "mongoose";

let mongoConnectPromise: Promise<typeof mongoose> | null = null;

export async function connectToMongo() {
  if (!mongoConnectPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");

    mongoose.set("strictQuery", true);

    mongoConnectPromise = mongoose.connect(uri).then(() => mongoose);
  }
  return mongoConnectPromise;
}


*/
