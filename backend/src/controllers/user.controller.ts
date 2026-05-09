import RestController from "@/helper/rest.controller.ts";
import User from "@/modules/user.model.ts";
import type { IUser } from "@/modules/user.model.ts";

class UserController extends RestController<IUser, Partial<IUser>> {
  protected override readonly model = User;

  constructor() {
    super({
      tableName: "user",
      schema: "user",
      lookupID: "_id",
      searchAble: true,
      orderBy: "created_date",
    });
  }
}

export default new UserController();
