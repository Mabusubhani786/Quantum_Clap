import RestController from "@/helper/rest.controller.ts";
import Role from "@/modules/role.model.ts";
import type { IRole } from "@/modules/role.model.ts";

class RoleController extends RestController<IRole, Partial<IRole>> {
  protected override readonly model = Role;

  constructor() {
    super({
      tableName: "role",
      schema: "role",
      lookupID: "_id",
      searchAble: true,
      orderBy: "created_date",
    });
  }

  protected override getSearchFields(): string[] {
    return ["role_name", "role_code", "description"];
  }
}

export default new RoleController();
