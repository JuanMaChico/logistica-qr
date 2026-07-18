export { apiClient, setBaseUrl } from './client';
export { flags, isEnabled } from './flags';
export { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from './adapters/orders';
export type { Order, OrderStatus, NewOrder, UpdateOrderPayload, ApiResponse, PaginatedResponse } from './types';
