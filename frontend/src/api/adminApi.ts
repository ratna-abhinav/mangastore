import { api } from './client';
import type { Category, PagedProducts } from './catalog';

class AdminApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

export interface DashboardStats {
  products: number;
  categories: number;
  users: number;
  admins: number;
  orders: number;
}

export function fetchDashboardStats(): Promise<DashboardStats> {
  return api<DashboardStats>('/api/admin/dashboard');
}

export interface AdminCategory {
  id: number;
  name: string;
  imageName: string;
  isActive?: number;
}

async function expectOk(res: Response): Promise<void> {
  if (!res.ok) throw new AdminApiError(res.status, await res.json().catch(() => null));
}

export interface AdminCategoryPage {
  content: AdminCategory[];
  pageNo: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export function fetchAdminCategories(pageNo = 0, pageSize = 10): Promise<AdminCategoryPage> {
  return api<AdminCategoryPage>(`/api/admin/categories?pageNo=${pageNo}&pageSize=${pageSize}`);
}

export function fetchAllCategories(): Promise<Category[]> {
  return api<Category[]>('/api/admin/categories-all');
}

export async function saveCategory(name: string, file?: File): Promise<void> {
  const fd = new FormData();
  fd.append('name', name);
  if (file) fd.append('file', file);
  await expectOk(await fetch('/api/admin/categories', { method: 'POST', credentials: 'include', body: fd }));
}

export async function updateCategory(id: number, name: string, isActive: boolean, file?: File): Promise<void> {
  const fd = new FormData();
  fd.append('name', name);
  fd.append('isActive', String(isActive ? 1 : 0));
  if (file) fd.append('file', file);
  await expectOk(await fetch(`/api/admin/categories/${id}`, { method: 'PUT', credentials: 'include', body: fd }));
}

export function deleteCategory(id: number): Promise<void> {
  return api<void>(`/api/admin/categories/${id}`, { method: 'DELETE' });
}

export function fetchAdminProducts(keyword = '', pageNo = 0, pageSize = 10): Promise<PagedProducts> {
  const qs = new URLSearchParams({ pageNo: String(pageNo), pageSize: String(pageSize) });
  if (keyword) qs.set('keyword', keyword);
  return api<PagedProducts>(`/api/admin/products?${qs}`);
}

export function deleteProduct(id: number): Promise<void> {
  return api<void>(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export interface ProductPayload {
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  discount: number;
  isActive: boolean;
  file?: File | null;
}

function productForm(p: ProductPayload): FormData {
  const fd = new FormData();
  fd.append('title', p.title);
  fd.append('description', p.description);
  fd.append('category', p.category);
  fd.append('price', String(p.price));
  fd.append('stock', String(p.stock));
  fd.append('discount', String(p.discount));
  fd.append('isActive', p.isActive ? '1' : '0');
  if (p.file) fd.append('file', p.file);
  return fd;
}

export async function createProduct(p: ProductPayload): Promise<void> {
  await expectOk(await fetch('/api/admin/products', { method: 'POST', credentials: 'include', body: productForm(p) }));
}

export async function updateProduct(id: number, p: ProductPayload): Promise<void> {
  await expectOk(await fetch(`/api/admin/products/${id}`, { method: 'PUT', credentials: 'include', body: productForm(p) }));
}

export interface AdminOrder {
  id: number;
  orderId: string;
  orderDate: string;
  productTitle: string;
  productImage: string;
  price: number;
  quantity: number;
  status: string;
  paymentType: string;
}

export interface AdminOrdersPage {
  orders: AdminOrder[];
  totalElements: number;
  pageNo?: number;
  totalPages?: number;
}

export function fetchAdminOrders(orderId = '', pageNo = 0, pageSize = 10): Promise<AdminOrdersPage> {
  const qs = new URLSearchParams({ pageNo: String(pageNo), pageSize: String(pageSize) });
  if (orderId.trim()) qs.set('orderId', orderId.trim());
  return api<AdminOrdersPage>(`/api/admin/orders?${qs}`);
}

export function updateOrderStatus(id: number, st: number): Promise<{ status: string }> {
  return api<{ status: string }>(`/api/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ st }),
  });
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  mobileNumber: string | null;
  isEnable: number;
  role: string;
  profileImage: string | null;
}

export function fetchAdminUsers(type: 1 | 2): Promise<AdminUser[]> {
  return api<AdminUser[]>(`/api/admin/users?type=${type}`);
}

export function setUserStatus(id: number, enabled: boolean): Promise<void> {
  return api<void>(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export interface AddAdminPayload {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  img?: File | null;
}

export async function addAdmin(payload: AddAdminPayload): Promise<void> {
  const fd = new FormData();
  fd.append('name', payload.name);
  fd.append('email', payload.email.trim());
  fd.append('mobileNumber', payload.mobileNumber);
  fd.append('password', payload.password);
  if (payload.img) fd.append('img', payload.img);
  await expectOk(await fetch('/api/admin/admins', { method: 'POST', credentials: 'include', body: fd }));
}
