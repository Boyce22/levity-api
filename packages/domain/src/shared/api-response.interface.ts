export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  limit: number;
  totalPages?: number;
  nextCursor?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
