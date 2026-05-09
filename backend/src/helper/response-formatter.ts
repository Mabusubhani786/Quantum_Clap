export type ResponseStatus = "success" | "fail";

export interface ResponsePagination {
  count: number;
  current_page: number;
  total_page_count: number;
  total_record_count: number;
}

export interface ResponsePayload<T> {
  status: ResponseStatus;
  data: T[];
  message: string;
  pagination?: ResponsePagination;
  total_record_count?: number;
  key_value?: Record<string, unknown>;
}

interface SuccessFormatterInput<T> {
  data: T | T[];
  message: string;
  pagination?: Partial<ResponsePagination>;
  totalRecordCount?: number;
  keyValue?: Record<string, unknown>;
}

interface FailFormatterInput {
  message: string;
  data?: unknown[];
  pagination?: Partial<ResponsePagination>;
  keyValue?: Record<string, unknown>;
}

const DEFAULT_PAGINATION: ResponsePagination = {
  count: 0,
  current_page: 0,
  total_page_count: 0,
  total_record_count: 0,
};

const withPaginationDefaults = (
  pagination?: Partial<ResponsePagination>
): ResponsePagination => ({
  ...DEFAULT_PAGINATION,
  ...pagination,
});

export const formatSuccessResponse = <T>({
  data,
  message,
  pagination,
  totalRecordCount,
  keyValue,
}: SuccessFormatterInput<T>): ResponsePayload<T> => {
  const response: ResponsePayload<T> = {
    status: "success",
    data: Array.isArray(data) ? data : [data],
    message,
  };

  if (pagination) {
    response.pagination = withPaginationDefaults(pagination);
  }

  if (typeof totalRecordCount === "number") {
    response.total_record_count = totalRecordCount;
  }

  if (keyValue && Object.keys(keyValue).length > 0) {
    response.key_value = keyValue;
  }

  return response;
};

export const formatFailResponse = ({
  message,
  data = [],
  pagination,
  keyValue,
}: FailFormatterInput): ResponsePayload<unknown> => {
  const response: ResponsePayload<unknown> = {
    status: "fail",
    data,
    message,
  };

  if (pagination) {
    response.pagination = withPaginationDefaults(pagination);
  }

  if (keyValue && Object.keys(keyValue).length > 0) {
    response.key_value = keyValue;
  }

  return response;
};
