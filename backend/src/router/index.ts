import type { FastifyInstance } from "fastify";
import { healthCheckHandler } from "@/controllers/health.controller.ts";
import jwtUserController from "@/controllers/jwt_user.controller.ts";
import recentController from "@/controllers/recent.controller.ts";
import roleController from "@/controllers/role.controller.ts";
import userController from "@/controllers/user.controller.ts";
import watchListController from "@/controllers/watch_list.controller.ts";

const pingHandler = async () => {
  return "pong\n";
};

const registerRoutes = async (server: FastifyInstance) => {
  server.get("/ping", pingHandler);
  server.get("/health", healthCheckHandler);
  server.post("/sign-in", jwtUserController.createToken);
  server.post("/jwt_user/token", jwtUserController.createToken);
  server.post("/jwt_user/refresh", jwtUserController.refreshToken);
  server.post("/jwt_user/revoke", jwtUserController.revokeToken);

  server.post("/user", userController.create);
  server.get("/user", userController.getAll);
  server.get("/user/:id", userController.getById);
  server.put("/user/:id", userController.update);
  server.patch("/user/:id", userController.update);
  server.delete("/user/:id", userController.remove);

  server.post("/recent", recentController.create);
  server.get("/recent", recentController.getAll);
  server.get("/recent/:id", recentController.getById);
  server.put("/recent/:id", recentController.update);
  server.patch("/recent/:id", recentController.update);
  server.delete("/recent/:id", recentController.remove);

  server.post("/watch-list", watchListController.create);
  server.get("/watch-list", watchListController.getAll);
  server.get("/watch-list/:id", watchListController.getById);
  server.put("/watch-list/:id", watchListController.update);
  server.patch("/watch-list/:id", watchListController.update);
  server.delete("/watch-list/:id", watchListController.remove);

  server.post("/roles", roleController.create);
  server.get("/roles", roleController.getAll);
  server.get("/roles/:id", roleController.getById);
  server.put("/roles/:id", roleController.update);
  server.patch("/roles/:id", roleController.update);
  server.delete("/roles/:id", roleController.remove);
};

export default registerRoutes;
