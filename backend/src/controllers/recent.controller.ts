import type { FastifyReply, FastifyRequest } from "fastify";
import RestController from "@/helper/rest.controller.ts";
import { formatSuccessResponse } from "@/helper/response-formatter.ts";
import Recent from "@/modules/recent.model.ts";
import type { IRecent } from "@/modules/recent.model.ts";

type RecentQuery = {
  range?: string;
  period?: string;
  recent_range?: string;
  from_date?: string;
  to_date?: string;
}

const rangeAliases: Record<string, "today" | "week" | "month"> = {
  today: "today",
  "24h": "today",
  "24hours": "today",
  week: "week",
  "1week": "week",
  "7days": "week",
  month: "month",
  "1month": "month",
  "1mnt": "month",
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getRangeStart(range: "today" | "week" | "month") {
  const date = new Date();

  if (range === "today") {
    return getStartOfToday();
  }

  if (range === "week") {
    date.setDate(date.getDate() - 7);
    return date;
  }

  date.setMonth(date.getMonth() - 1);
  return date;
}

function normalizeRange(value?: string) {
  if (!value) {
    return undefined;
  }

  return rangeAliases[value.toLowerCase().replace(/[\s_-]/g, "")];
}

function getDateRangeQuery(request: FastifyRequest) {
  const query = request.query as RecentQuery;
  const requestedRange = normalizeRange(
    query.range ?? query.period ?? query.recent_range
  );
  const watchedAt: Record<string, Date> = {};

  if (requestedRange) {
    watchedAt.$gte = getRangeStart(requestedRange);
    watchedAt.$lte = new Date();
  }

  if (query.from_date) {
    const fromDate = new Date(query.from_date);
    if (!Number.isNaN(fromDate.getTime())) {
      watchedAt.$gte = fromDate;
    }
  }

  if (query.to_date) {
    const toDate = new Date(query.to_date);
    if (!Number.isNaN(toDate.getTime())) {
      watchedAt.$lte = toDate;
    }
  }

  return Object.keys(watchedAt).length > 0 ? { watched_at: watchedAt } : {};
}

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

  protected override getBaseQuery(
    request: FastifyRequest
  ): Record<string, unknown> {
    const userId = this.getRequestUserId(request);
    return userId ? { user_id: userId } : {};
  }

  protected override preparePayloadForSave(
    payload: IRecent | Partial<IRecent>,
    request: FastifyRequest,
    _operation: "create" | "update"
  ): IRecent | Partial<IRecent> {
    const userId = this.getRequestUserId(request);
    return userId ? { ...payload, user_id: userId } : payload;
  }

  protected override buildSearchQuery(
    request: FastifyRequest
  ): Record<string, unknown> {
    const baseQuery = super.buildSearchQuery(request);
    const dateRangeQuery = getDateRangeQuery(request);

    if (Object.keys(dateRangeQuery).length === 0) {
      return baseQuery;
    }

    return { $and: [baseQuery, dateRangeQuery] };
  }

  public override readonly create = async (
    request: FastifyRequest<{ Body: IRecent }>,
    reply: FastifyReply
  ) => {
    return this.withErrorHandling(reply, async () => {
      const payload = this.preparePayloadForSave(
        await this.preSave(request.body, request, "create"),
        request,
        "create"
      ) as IRecent;
      const mediaType = payload.media_type?.toLowerCase() ?? "movie";
      const now = new Date();

      const existingTodayRecord = await this.model
        .findOneAndUpdate(
          {
            user_id: payload.user_id,
            media_id: String(payload.media_id),
            media_type: mediaType,
            watched_at: {
              $gte: getStartOfToday(),
              $lte: now,
            },
          },
          {
            ...payload,
            media_id: String(payload.media_id),
            media_type: mediaType,
            watched_at: now,
            is_active: payload.is_active ?? true,
          },
          {
            new: true,
            runValidators: true,
            lean: true,
          }
        )
        .exec();

      if (existingTodayRecord) {
        return reply.send(
          formatSuccessResponse({
            data: existingTodayRecord,
            message: "Recent activity refreshed",
            pagination: {
              count: 1,
              current_page: 1,
              total_page_count: 1,
              total_record_count: 1,
            },
          })
        );
      }

      const created = await this.model.create({
        ...payload,
        media_id: String(payload.media_id),
        media_type: mediaType,
        watched_at: now,
        is_active: payload.is_active ?? true,
      });

      return reply.code(201).send(
        formatSuccessResponse({
          data: created,
          message: "Created successfully",
          pagination: {
            count: 1,
            current_page: 1,
            total_page_count: 1,
            total_record_count: 1,
          },
        })
      );
    });
  };
}

export default new RecentController();
