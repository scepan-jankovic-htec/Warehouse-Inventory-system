export interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: Pagination;
}
