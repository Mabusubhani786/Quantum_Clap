import fastify from "fastify";
import connectDB from "@/config/db/dbConfig.ts";
import registerRoutes from "@/router/index.ts";

const server = fastify();
const DEFAULT_PORT = 4000;

const start = async () => {
  await connectDB();
  await registerRoutes(server);
  const port = Number(process.env.PORT) || DEFAULT_PORT;

  server.listen({ port }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
};

start();
