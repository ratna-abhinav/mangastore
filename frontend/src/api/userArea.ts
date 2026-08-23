import { api, ApiError } from './client';
import type { CurrentUser } from './auth';

export interface CartItem {
  id: number;
  productId: number;
  title: string;
  image: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  stock: number;
  totalPrice: number;
}

export interface CartData {
  items: CartItem[];
  totalOrderPrice: number;
}

export function fetchCart(): Promise<CartData> {
  return api<CartData>('/api/users/cart');
}

export async function addToCart(productId: number): Promise<{ cartCount: number }> {
  const res = await api<{ success: boolean; cartCount: number }>(`/api/users/cart/products/${productId}`, {
    method: 'POST',
  });
  return { cartCount: res.cartCount };
}

export function updateCartItem(cartItemId: number, action: 'in' | 'de'): Promise<void> {
  return api<void>(`/api/users/cart/items/${cartItemId}?action=${action}`, { method: 'PATCH' });
}

export function removeCartItem(cartItemId: number): Promise<void> {
  return api<void>(`/api/users/cart/items/${cartItemId}`, { method: 'DELETE' });
}

export interface CheckoutData {
  orderPrice: number;
  fees: number;
  totalOrderPrice: number;
}

export function fetchCheckout(): Promise<CheckoutData> {
  return api<CheckoutData>('/api/users/checkout');
}

export interface OrderRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentType: string;
}

export function placeOrder(request: OrderRequest): Promise<void> {
  return api<void>('/api/users/orders', { method: 'POST', body: JSON.stringify(request) });
}

export interface MyOrder {
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

export interface MyOrdersData {
  orders: MyOrder[];
  totalSpent: number;
}

export function fetchMyOrders(): Promise<MyOrdersData> {
  return api<MyOrdersData>('/api/users/orders');
}

export function cancelOrder(id: number): Promise<void> {
  return api<void>(`/api/users/orders/${id}/cancel`, { method: 'POST' });
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  mobileNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  profileImage: string | null;
}

export function fetchProfile(): Promise<ProfileData> {
  return api<ProfileData>('/api/users/profile');
}

export async function updateProfile(formData: FormData): Promise<{ profileImage?: string }> {
  const res = await fetch('/api/users/profile', {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return res.json();
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return api<void>('/api/users/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export type { CurrentUser };
