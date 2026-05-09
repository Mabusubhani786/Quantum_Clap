import RestController from "@/helper/rest.controller.ts";
import { hashPassword, isPasswordHashed } from "@/helper/password.helper.ts";
import User from "@/modules/user.model.ts";
import type { IUser } from "@/modules/user.model.ts";

class UserController extends RestController<IUser, Partial<IUser>> {
  protected override readonly model = User;

  protected override async preSave(
    payload: IUser | Partial<IUser>
  ): Promise<IUser | Partial<IUser>> {
    const password = payload.password;

    if (typeof password !== "string" || isPasswordHashed(password)) {
      return payload;
    }

    return {
      ...payload,
      password: await hashPassword(password),
    };
  }

  constructor() {
    super({
      tableName: "users",
      schema: "users",
      lookupID: "_id",
      searchAble: true,
      orderBy: "created_date",
    });
  }
}

export default new UserController();
