import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, errorSchemas } from "@shared/routes";
import { z } from "zod";

// === ROLES ===
export function useRole() {
  return useQuery({
    queryKey: [api.roles.get.path],
    queryFn: async () => {
      const res = await fetch(api.roles.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch role");
      return api.roles.get.responses[200].parse(await res.json());
    },
    retry: false
  });
}

// === VENDORS ===
export function useVendors() {
  return useQuery({
    queryKey: [api.vendors.list.path],
    queryFn: async () => {
      const res = await fetch(api.vendors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return api.vendors.list.responses[200].parse(await res.json());
    },
  });
}

export function useVendor(id: number) {
  return useQuery({
    queryKey: [api.vendors.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.vendors.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return api.vendors.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.vendors.create.input>) => {
      const res = await fetch(api.vendors.create.path, {
        method: api.vendors.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
           const error = errorSchemas.validation.parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to create vendor");
      }
      return api.vendors.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.roles.get.path] }); // Role might change
    },
  });
}

export function useApproveVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isApproved }: { id: number, isApproved: boolean }) => {
      const url = buildUrl(api.vendors.approve.path, { id });
      const res = await fetch(url, {
        method: api.vendors.approve.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update vendor status");
      return api.vendors.approve.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] }),
  });
}

// === PRODUCTS ===
export function useProducts(filters?: z.infer<typeof api.products.list.input>) {
  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      // Build query string
      const params = new URLSearchParams();
      if (filters?.categoryId) params.append("categoryId", String(filters.categoryId));
      if (filters?.vendorId) params.append("vendorId", String(filters.vendorId));
      if (filters?.search) params.append("search", filters.search);
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);

      const url = `${api.products.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.products.create.input>) => {
      // Ensure numeric fields are numbers
      const payload = {
        ...data,
        price: Number(data.price), // backend expects decimal/number
        stock: Number(data.stock),
        vendorId: Number(data.vendorId),
        categoryId: Number(data.categoryId),
      };
      
      const res = await fetch(api.products.create.path, {
        method: api.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create product");
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

// === CATEGORIES ===
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

// === CART ===
export function useCart() {
  return useQuery({
    queryKey: [api.cart.get.path],
    queryFn: async () => {
      const res = await fetch(api.cart.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch cart");
      return api.cart.get.responses[200].parse(await res.json());
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.cart.add.input>) => {
      const res = await fetch(api.cart.add.path, {
        method: api.cart.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 401) throw new Error("Please login to add to cart");
      if (!res.ok) throw new Error("Failed to add to cart");
      return api.cart.add.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cart.get.path] }),
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cart.remove.path, { id });
      const res = await fetch(url, { method: api.cart.remove.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cart.get.path] }),
  });
}

// === ORDERS ===
export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(api.orders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.orders.create.input>) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create order");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cart.get.path] }); // Cart likely cleared
    },
  });
}

// === STORIES ===
export function useStories() {
  return useQuery({
    queryKey: [api.stories.list.path],
    queryFn: async () => {
      const res = await fetch(api.stories.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stories");
      return api.stories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.stories.create.input>) => {
      const res = await fetch(api.stories.create.path, {
        method: api.stories.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create story");
      return api.stories.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.stories.list.path] }),
  });
}
