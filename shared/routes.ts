import { z } from 'zod';
import { 
  insertVendorSchema, 
  insertProductSchema, 
  insertStorySchema,
  type Vendor,
  type Category,
  type Product,
  type Order,
  type VendorStory,
  type CartItem
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  roles: {
    get: {
      method: 'GET' as const,
      path: '/api/roles',
      responses: {
        200: z.object({ role: z.enum(["customer", "vendor", "admin"]) }),
        401: errorSchemas.unauthorized
      }
    }
  },
  vendors: {
    list: {
      method: 'GET' as const,
      path: '/api/vendors',
      responses: {
        200: z.array(z.custom<Vendor>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vendors/:id',
      responses: {
        200: z.custom<Vendor>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vendors',
      input: z.object({ storeName: z.string(), description: z.string(), logoUrl: z.string().optional() }),
      responses: {
        201: z.custom<Vendor>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized
      },
    },
    approve: {
      method: 'PATCH' as const,
      path: '/api/vendors/:id/approve',
      input: z.object({ isApproved: z.boolean() }),
      responses: {
        200: z.custom<Vendor>(),
        404: errorSchemas.notFound,
      }
    }
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        categoryId: z.string().optional(),
        vendorId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'newest']).optional()
      }).optional(),
      responses: {
        200: z.array(z.custom<Product>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<Product>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<Product>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<Category>()),
      },
    },
  },
  cart: {
    get: {
      method: 'GET' as const,
      path: '/api/cart',
      responses: {
        200: z.array(z.custom<CartItem & { product: Product }>()),
        401: errorSchemas.unauthorized
      }
    },
    add: {
      method: 'POST' as const,
      path: '/api/cart',
      input: z.object({ productId: z.string(), quantity: z.number().optional() }),
      responses: {
        201: z.custom<CartItem>(),
        401: errorSchemas.unauthorized
      }
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/cart/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound
      }
    }
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      responses: {
        201: z.custom<Order>(),
        400: errorSchemas.validation
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.custom<Order>()),
      }
    }
  },
  stories: {
    list: {
      method: 'GET' as const,
      path: '/api/stories',
      responses: {
        200: z.array(z.custom<VendorStory & { vendor: Vendor }>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/stories',
      input: insertStorySchema,
      responses: {
        201: z.custom<VendorStory>(),
        401: errorSchemas.unauthorized
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
