import type { FastifyReply, FastifyRequest } from "fastify";
import mongoose, { type Model } from "mongoose";
import {
  formatFailResponse,
  formatSuccessResponse,
} from "@/helper/response-formatter.ts";

type SaveOperation = "create" | "update";

interface HttpError extends Error {
  statusCode: number;
  details?: unknown;
}

export interface RestControllerConfig {
  tableName: string;
  schema: string;
  lookupID: string;
  searchAble?: boolean;
  searchable?: boolean;
  orderBy?: string;
  oederBy?: string;
}

const isHttpError = (error: unknown): error is HttpError => {
  if (!(error instanceof Error)) {
    return false;
  }

  return typeof (error as Partial<HttpError>).statusCode === "number";
};

const createHttpError = (
  statusCode: number,
  message: string,
  details?: unknown
): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export default abstract class RestController<
  TCreate extends object,
  TUpdate extends Partial<TCreate> = Partial<TCreate>,
> {
  protected readonly tableName: string;
  protected readonly schema: string;
  protected readonly lookupID: string;
  protected readonly searchAble: boolean;
  protected readonly orderBy: string | undefined;
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_COUNT = 10;

  protected abstract readonly model: Model<any>;

  protected constructor(config: RestControllerConfig) {
    this.tableName = config.tableName;
    this.schema = config.schema;
    this.lookupID = config.lookupID;
    this.searchAble = config.searchAble ?? config.searchable ?? false;
    this.orderBy = config.orderBy ?? config.oederBy;
  }

  protected async preSave(
    payload: TCreate | TUpdate,
    _request: FastifyRequest,
    _operation: SaveOperation
  ): Promise<TCreate | TUpdate> {
    return payload;
  }

  protected async postSave(
    response: unknown,
    _request: FastifyRequest,
    _operation: SaveOperation
  ): Promise<unknown> {
    return response;
  }

  protected getSearchFields(): string[] {
    return [];
  }

  public readonly create = async (
    request: FastifyRequest<{ Body: TCreate }>,
    reply: FastifyReply
  ) => {
    return this.withErrorHandling(reply, async () => {
      const payload = (await this.preSave(
        request.body as TCreate,
        request,
        "create"
      )) as TCreate;

      const created = await this.model.create(payload);
      const response = await this.postSave(created, request, "create");
      return reply.code(201).send(
        formatSuccessResponse({
          data: response,
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

  public readonly getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    return this.withErrorHandling(reply, async () => {
      const query = this.buildSearchQuery(request);
      const { page, pageCount, hasPagination } = this.getPaginationOptions(request);
      const queryBuilder = this.model.find(query).lean();

      if (hasPagination) {
        queryBuilder.skip((page - 1) * pageCount).limit(pageCount);
      }

      if (this.orderBy) {
        queryBuilder.sort(this.orderBy);
      }

      const records = await queryBuilder.exec();

      if (!hasPagination) {
        return reply.send(
          formatSuccessResponse({
            data: records,
            message: "Fetched successfully",
            totalRecordCount: records.length,
            keyValue: this.extractKeyValueFilters(request),
          })
        );
      }

      const totalCount = await this.model.countDocuments(query).exec();
      const totalPageCount = totalCount > 0 ? Math.ceil(totalCount / pageCount) : 0;

      return reply.send(
        formatSuccessResponse({
          data: records,
          message: "Fetched successfully",
          pagination: {
            count: pageCount,
            current_page: page,
            total_page_count: totalPageCount,
            total_record_count: totalCount,
          },
        })
      );
    });
  };

  public readonly getById = async (
    request: FastifyRequest<{ Params: Record<string, string> }>,
    reply: FastifyReply
  ) => {
    return this.withErrorHandling(reply, async () => {
      const lookupValue = this.getLookupValue(request);
      const identifierFilter = this.buildIdentifierFilter(lookupValue);
      const record = await this.model
        .findOne(identifierFilter)
        .lean()
        .exec();

      if (!record) {
        throw createHttpError(404, "Record not found", {
          [this.lookupID]: lookupValue,
        });
      }

      return reply.send(
        formatSuccessResponse({
          data: record,
          message: "Fetched successfully",
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

  public readonly update = async (
    request: FastifyRequest<{ Params: Record<string, string>; Body: TUpdate }>,
    reply: FastifyReply
  ) => {
    return this.withErrorHandling(reply, async () => {
      const lookupValue = this.getLookupValue(request);
      const identifierFilter = this.buildIdentifierFilter(lookupValue);
      const payload = (await this.preSave(
        request.body as TUpdate,
        request,
        "update"
      )) as TUpdate;

      const updated = await this.model
        .findOneAndUpdate(identifierFilter, payload, {
          new: true,
          runValidators: true,
          lean: true,
        })
        .exec();

      if (!updated) {
        throw createHttpError(404, "Record not found", {
          [this.lookupID]: lookupValue,
        });
      }

      const response = await this.postSave(updated, request, "update");
      return reply.send(
        formatSuccessResponse({
          data: response,
          message: "Updated successfully",
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

  public readonly remove = async (
    request: FastifyRequest<{ Params: Record<string, string> }>,
    reply: FastifyReply
  ) => {
    return this.withErrorHandling(reply, async () => {
      const lookupValue = this.getLookupValue(request);
      const identifierFilter = this.buildIdentifierFilter(lookupValue);
      const deleted = await this.model
        .findOneAndDelete(identifierFilter)
        .lean()
        .exec();

      if (!deleted) {
        throw createHttpError(404, "Record not found", {
          [this.lookupID]: lookupValue,
        });
      }

      return reply.send(
        formatSuccessResponse({
          data: { success: true, [this.lookupID]: lookupValue },
          message: "Deleted successfully",
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

  private getLookupValue(
    request: FastifyRequest<{ Params: Record<string, string> }>
  ): string {
    const lookupValue = request.params[this.lookupID] ?? request.params.id;
    if (!lookupValue) {
      throw createHttpError(400, `Missing route param '${this.lookupID}'`);
    }

    return lookupValue;
  }

  private buildSearchQuery(request: FastifyRequest): Record<string, unknown> {
    const query = this.normalizeQueryFilters(
      request.query as Record<string, unknown>
    );
    const idParam = query.id;
    delete query.id;
    delete query.q;
    delete query.page;
    delete query.page_count;
    delete query.limit;

    const queryParts: Record<string, unknown>[] = [];
    if (Object.keys(query).length > 0) {
      queryParts.push(query);
    }

    if (idParam !== undefined && idParam !== null && idParam !== "") {
      const idValue = Array.isArray(idParam) ? idParam[0] : idParam;
      queryParts.push(this.buildIdentifierFilter(String(idValue)));
    }

    if (!this.searchAble) {
      return this.combineQueryParts(queryParts);
    }

    const searchText = (request.query as Record<string, unknown>).q;
    if (typeof searchText !== "string" || !searchText.trim()) {
      return this.combineQueryParts(queryParts);
    }

    const fields = this.getSearchFields();
    if (!fields.length) {
      return this.combineQueryParts(queryParts);
    }

    queryParts.push({
      $or: fields.map((field) => ({
        [field]: { $regex: searchText.trim(), $options: "i" },
      })),
    });

    return this.combineQueryParts(queryParts);
  }

  private buildIdentifierFilter(lookupValue: string): Record<string, unknown> {
    const filters: Record<string, unknown>[] = [];
    const trimmedLookupValue = lookupValue.trim();

    if (trimmedLookupValue) {
      filters.push({ [this.lookupID]: trimmedLookupValue });
      filters.push({ id: trimmedLookupValue });

      if (mongoose.Types.ObjectId.isValid(trimmedLookupValue)) {
        filters.push({ _id: new mongoose.Types.ObjectId(trimmedLookupValue) });
      }

      const numericValue = Number(trimmedLookupValue);
      if (Number.isInteger(numericValue)) {
        filters.push({ id: numericValue });
      }
    }

    if (!filters.length) {
      return { [this.lookupID]: lookupValue };
    }

    return { $or: filters };
  }

  private normalizeQueryFilters(
    queryParams: Record<string, unknown>
  ): Record<string, unknown> {
    const normalizedQuery: Record<string, unknown> = {};

    Object.entries(queryParams).forEach(([key, rawValue]) => {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        return;
      }

      if (Array.isArray(rawValue)) {
        const normalizedArray = rawValue.map((value) =>
          this.normalizeQueryValue(key, value)
        );
        normalizedQuery[key] = normalizedArray;
        return;
      }

      normalizedQuery[key] = this.normalizeQueryValue(key, rawValue);
    });

    return normalizedQuery;
  }

  private normalizeQueryValue(key: string, value: unknown): unknown {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return trimmedValue;
    }

    if (key === "_id" && mongoose.Types.ObjectId.isValid(trimmedValue)) {
      return new mongoose.Types.ObjectId(trimmedValue);
    }

    if (key === "id") {
      const numericValue = Number(trimmedValue);
      if (Number.isInteger(numericValue)) {
        return numericValue;
      }
    }

    return trimmedValue;
  }

  private combineQueryParts(
    parts: Record<string, unknown>[]
  ): Record<string, unknown> {
    if (parts.length === 0) {
      return {};
    }

    if (parts.length === 1) {
      return parts[0]!;
    }

    return { $and: parts };
  }

  private getPaginationOptions(request: FastifyRequest): {
    page: number;
    pageCount: number;
    hasPagination: boolean;
  } {
    const requestQuery = request.query as Record<string, unknown>;
    const hasPage = requestQuery.page !== undefined;
    const hasPageCount =
      requestQuery.page_count !== undefined || requestQuery.limit !== undefined;
    const hasPagination = hasPage || hasPageCount;
    const rawPage = Number(requestQuery.page);
    const rawPageCount = Number(requestQuery.page_count ?? requestQuery.limit);

    const page = Number.isInteger(rawPage) && rawPage > 0
      ? rawPage
      : RestController.DEFAULT_PAGE;
    const pageCount =
      Number.isInteger(rawPageCount) && rawPageCount > 0
        ? rawPageCount
        : RestController.DEFAULT_PAGE_COUNT;

    return { page, pageCount, hasPagination };
  }

  private extractKeyValueFilters(
    request: FastifyRequest
  ): Record<string, unknown> {
    const query = this.normalizeQueryFilters(
      request.query as Record<string, unknown>
    );

    delete query.page;
    delete query.page_count;
    delete query.limit;
    delete query.q;

    return query;
  }

  private async withErrorHandling(
    reply: FastifyReply,
    executor: () => Promise<FastifyReply>
  ): Promise<FastifyReply> {
    try {
      return await executor();
    } catch (error) {
      if (isHttpError(error)) {
        return reply.code(error.statusCode).send(
          formatFailResponse({
            message: error.message,
            data: error.details ? [error.details] : [],
          })
        );
      }

      if (error instanceof mongoose.Error.ValidationError) {
        return reply.code(400).send(
          formatFailResponse({
            message: "Validation failed",
            data: [error.errors],
          })
        );
      }

      return reply.code(500).send(
        formatFailResponse({
          message: "Internal server error",
        })
      );
    }
  }
}
