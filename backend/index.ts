import fastify from "fastify";
import connectDB from "@/config/db/dbConfig.ts";
import registerRoutes from "@/router/index.ts";

const server = fastify();
const DEFAULT_PORT = 4000;
const DEFAULT_HOST = "0.0.0.0";

const start = async () => {
  await connectDB();

  server.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }
  });

  await registerRoutes(server);
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const host = process.env.HOST || DEFAULT_HOST;

  server.listen({ port, host }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
};

start();
