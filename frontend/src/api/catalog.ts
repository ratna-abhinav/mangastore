import { api } from './client';

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  discount: number;
  discountedPrice: number | null;
}

export interface Category {
  id: number;
  name: string;
  imageName: string;
}

export interface PagedProducts {
  content: Product[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface HomeData {
  categories: Category[];
  products: Product[];
}

export function fetchHome(): Promise<HomeData> {
  return api<HomeData>('/api/catalog/home');
}

export function fetchCategories(): Promise<Category[]> {
  return api<Category[]>('/api/categories');
}

export interface ProductFilters {
  category?: string;
  keyword?: string;
  pageNo?: number;
  pageSize?: number;
}

export function fetchProducts(filters: ProductFilters): Promise<PagedProducts> {
  const qs = new URLSearchParams();
  if (filters.category) qs.set('category', filters.category);
  if (filters.keyword) qs.set('keyword', filters.keyword);
  qs.set('pageNo', String(filters.pageNo ?? 0));
  qs.set('pageSize', String(filters.pageSize ?? 12));
  return api<PagedProducts>(`/api/products?${qs.toString()}`);
}

export function fetchProduct(id: string | number): Promise<Product> {
  return api<Product>(`/api/products/${id}`);
}
