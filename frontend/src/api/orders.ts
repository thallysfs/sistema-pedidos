import axios from 'axios'

const api = axios.create({ baseURL: '/orders' })

export interface OrderItemResponse {
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface OrderResponse {
  id: string
  customerName: string
  createdAt: string
  items: OrderItemResponse[]
  total: number
}

export interface PagedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface BillingByDayResponse {
  date: string
  totalRevenue: number
  orderCount: number
}

export interface BillingSummary {
  byDay: BillingByDayResponse[]
  totalRevenue: number
  orderCount: number
  averageTicket: number
}

export interface CreateOrderItemRequest {
  productName: string
  quantity: number
  unitPrice: number
}

export interface CreateOrderRequest {
  customerName: string
  items: CreateOrderItemRequest[]
}

export const getOrders = (page: number, pageSize = 10) =>
  api.get<PagedResponse<OrderResponse>>('', { params: { page, pageSize } }).then(r => r.data)

export const getBilling = (from: string, to: string) =>
  api.get<BillingByDayResponse[]>('/billing', { params: { from, to } }).then(r => r.data)

export const createOrder = (data: CreateOrderRequest) =>
  api.post<OrderResponse>('', data).then(r => r.data)
