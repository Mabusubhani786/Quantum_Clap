import mongoose from "mongoose";

export const healthCheckHandler = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();

  const tables = collections.map((collection) => ({
    name: collection.name,
    type: collection.type || "collection",
  }));

  return {
    health: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    tableCount: tables.length,
    tables,
  };
};

export default { healthCheckHandler };
