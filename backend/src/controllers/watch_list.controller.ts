import RestController from "@/helper/rest.controller.ts";
import WatchList from "@/modules/watch_list.model.ts";
import type { IWatchList } from "@/modules/watch_list.model.ts";

class WatchListController extends RestController<
  IWatchList,
  Partial<IWatchList>
> {
  protected override readonly model = WatchList;

  constructor() {
    super({
      tableName: "watch_list",
      schema: "watch_list",
      lookupID: "_id",
      searchAble: true,
      orderBy: "-created_date",
    });
  }

  protected override getSearchFields(): string[] {
    return ["title", "overview", "media_type", "source"];
  }
}

export default new WatchListController();
