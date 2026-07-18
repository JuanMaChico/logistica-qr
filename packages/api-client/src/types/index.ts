export type { Order, OrderStatus, NewOrder, UpdateOrderPayload } from './order';

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
