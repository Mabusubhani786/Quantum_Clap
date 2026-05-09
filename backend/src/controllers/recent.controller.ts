import RestController from "@/helper/rest.controller.ts";
import Recent from "@/modules/recent.model.ts";
import type { IRecent } from "@/modules/recent.model.ts";

class RecentController extends RestController<IRecent, Partial<IRecent>> {
  protected override readonly model = Recent;

  constructor() {
    super({
      tableName: "recent",
      schema: "recent",
      lookupID: "_id",
      searchAble: true,
      orderBy: "-watched_at",
    });
  }

  protected override getSearchFields(): string[] {
    return ["title", "overview", "media_type", "source"];
  }
}

export default new RecentController();
