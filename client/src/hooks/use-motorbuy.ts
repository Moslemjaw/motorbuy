import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { buildApiUrl } from "@/lib/api-config";

// === ROLES ===
export function useRole() {
  return useQuery({
    queryKey: [api.roles.get.path],
    queryFn: async () => {
      try {
        const res = await fetch(buildApiUrl(api.roles.get.path), {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("Role fetch status:", res.status, res.statusText);
        if (res.status === 401) {
          console.log("Role fetch: Unauthorized");
          return null;
        }
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Failed to fetch role:", res.status, errorText);
          throw new Error(`Failed to fetch role: ${res.status}`);
        }
        const data = await res.json();
        console.log("Role API raw response:", data);
        
        // Handle case where role might be missing or invalid
        if (!data || typeof data !== 'object') {
          console.error("Invalid role response format:", data);
          return { role: "customer" };
        }
        
        // Ensure role is one of the valid values
        const validRole = ["customer", "vendor", "admin"].includes(data.role) 
          ? data.role 
          : "customer";
        
        const parsed = { role: validRole };
        console.log("Role API parsed response:", parsed);
        return parsed;
      } catch (error) {
        console.error("Role fetch error:", error);
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to get latest role
    enabled: true, // Always enabled
  });
}

// === VENDORS ===
export function useVendors() {
  return useQuery({
    queryKey: [api.vendors.list.path],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(api.vendors.list.path), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return api.vendors.list.responses[200].parse(await res.json());
    },
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: [api.vendors.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.vendors.get.path, { id });
      const res = await fetch(buildApiUrl(url), { credentials: "include" });
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
      const res = await fetch(buildApiUrl(api.vendors.create.path), {
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
    mutationFn: async ({
      id,
      isApproved,
    }: {
      id: string;
      isApproved: boolean;
    }) => {
      const url = buildUrl(api.vendors.approve.path, { id });
      const res = await fetch(buildApiUrl(url), {
        method: api.vendors.approve.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update vendor status");
      return api.vendors.approve.responses[200].parse(await res.json());
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] }),
  });
}

// === PRODUCTS ===
export function useProducts(filters?: z.infer<typeof api.products.list.input>) {
  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      // Build query string
      const params = new URLSearchParams();
      if (filters?.categoryId)
        params.append("categoryId", String(filters.categoryId));
      if (filters?.vendorId)
        params.append("vendorId", String(filters.vendorId));
      if (filters?.search) params.append("search", filters.search);
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);

      const url = `${api.products.list.path}?${params.toString()}`;
      const res = await fetch(buildApiUrl(url), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(buildApiUrl(url), { credentials: "include" });
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
        stock: Number(data.stock),
      };

      const res = await fetch(buildApiUrl(api.products.create.path), {
        method: api.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create product");
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

// === CATEGORIES ===
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(api.categories.list.path), {
        credentials: "include",
      });
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
      const res = await fetch(buildApiUrl(api.cart.get.path), {
        credentials: "include",
      });
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
      const res = await fetch(buildApiUrl(api.cart.add.path), {
        method: api.cart.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 401) throw new Error("Please login to add to cart");
      if (!res.ok) throw new Error("Failed to add to cart");
      return api.cart.add.responses[201].parse(await res.json());
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.cart.get.path] }),
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await fetch(buildApiUrl(`/api/cart/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.cart.get.path] }),
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.cart.remove.path, { id });
      const res = await fetch(buildApiUrl(url), {
        method: api.cart.remove.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.cart.get.path] }),
  });
}

// === ORDERS ===
export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(api.orders.list.path), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(buildApiUrl(api.orders.create.path), {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create order");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cart.get.path] });
    },
  });
}

// === STORIES ===
export function useStories() {
  return useQuery({
    queryKey: [api.stories.list.path],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(api.stories.list.path), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stories");
      return api.stories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.stories.create.input>) => {
      const res = await fetch(buildApiUrl(api.stories.create.path), {
        method: api.stories.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create story");
      return api.stories.create.responses[201].parse(await res.json());
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.stories.list.path] }),
  });
}
