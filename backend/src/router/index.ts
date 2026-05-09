import type { FastifyInstance } from "fastify";
import { healthCheckHandler } from "@/controllers/health.controller.ts";
import jwtUserController from "@/controllers/jwt_user.controller.ts";
import roleController from "@/controllers/role.controller.ts";
import userController from "@/controllers/user.controller.ts";

const pingHandler = async () => {
  return "pong\n";
};

const registerRoutes = async (server: FastifyInstance) => {
  server.get("/ping", pingHandler);
  server.get("/health", healthCheckHandler);
  server.post("/jwt_user/token", jwtUserController.createToken);
  server.post("/jwt_user/refresh", jwtUserController.refreshToken);
  server.post("/jwt_user/revoke", jwtUserController.revokeToken);

  server.post("/users", userController.create);
  server.get("/users", userController.getAll);
  server.get("/users/:id", userController.getById);
  server.put("/users/:id", userController.update);
  server.patch("/users/:id", userController.update);
  server.delete("/users/:id", userController.remove);

  server.post("/roles", roleController.create);
  server.get("/roles", roleController.getAll);
  server.get("/roles/:id", roleController.getById);
  server.put("/roles/:id", roleController.update);
  server.patch("/roles/:id", roleController.update);
  server.delete("/roles/:id", roleController.remove);
};

export default registerRoutes;
