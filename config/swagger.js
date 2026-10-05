// -------------------------------------------------------------
//  Swagger / OpenAPI Spec
//  - Hand-written OpenAPI 3.0 document describing every existing
//    route, so it stays accurate without relying on JSDoc
//    comment parsing.
//  - Mounted only in non-production environments (see index.js).
//    Update this file whenever a route's request/response shape
//    changes.
// -------------------------------------------------------------

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Mira API",
    version: "1.0.0",
    description:
      "Mira — Shopping Decision Platform. Rule-based (no AI) product intelligence, price intelligence, review intelligence and comparison APIs.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Products" },
    { name: "Categories" },
    { name: "Home" },
    { name: "Intelligence" },
    { name: "Health" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          brand: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          image: { type: "string" },
          rating: { type: "number" },
          salesCount: { type: "number" },
          source: { type: "string" },
          sourceId: { type: "string" },
          isAmazing: { type: "boolean" },
          aiScore: { type: "number" },
          aiBadges: { type: "array", items: { type: "string" } },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          phone: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          avatarUrl: { type: "string" },
          bio: { type: "string" },
          gender: { type: "string", enum: ["male", "female", "other"] },
          birthDate: { type: "string", format: "date" },
          savedProducts: { type: "array", items: { type: "string" } },
          savedCategories: { type: "array", items: { type: "string" } },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          icon: { type: "string" },
          parent: { type: "string", nullable: true },
          order: { type: "integer" },
          subcategories: { type: "array", items: { type: "object" } },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          errorCode: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "Send OTP to a phone number (rate limited: 3/min)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone"],
                properties: { phone: { type: "string", example: "09120000000" } },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP sent" },
          400: { description: "Missing phone", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          429: { description: "Rate limited" },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP → login or register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone", "code"],
                properties: {
                  phone: { type: "string", example: "09120000000" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login/registration successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { $ref: "#/components/schemas/User" },
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Rotate access/refresh tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "New token pair issued" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (invalidate refresh token)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logged out" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the authenticated user's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User profile",
            content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } } } },
          },
          401: { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update the authenticated user's profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  avatarUrl: { type: "string" },
                  bio: { type: "string" },
                  gender: { type: "string", enum: ["male", "female", "other"] },
                  birthDate: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated user" }, 401: { description: "Unauthorized" } },
      },
    },
    "/users/me/save-product": {
      patch: {
        tags: ["Users"],
        summary: "Toggle a product in the user's saved list",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["productId"], properties: { productId: { type: "string" } } },
            },
          },
        },
        responses: { 200: { description: "Toggled" }, 400: { description: "productId is required" }, 404: { description: "Not found" } },
      },
    },
    "/users/me/saved-products": {
      get: {
        tags: ["Users"],
        summary: "Get all saved products of the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Saved products",
            content: { "application/json": { schema: { type: "object", properties: { savedProducts: { type: "array", items: { $ref: "#/components/schemas/Product" } } } } } },
          },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products (paginated, filterable, sortable)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["price_asc", "price_desc", "rating", "sales", "newest"] } },
        ],
        responses: {
          200: {
            description: "Product list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                        hasNextPage: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get a single product by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Product", content: { "application/json": { schema: { type: "object", properties: { product: { $ref: "#/components/schemas/Product" } } } } } },
          404: { description: "Not found" },
        },
      },
    },
    "/products/search/query": {
      get: {
        tags: ["Products"],
        summary: "Search products, categorized by price/rating/sales",
        parameters: [{ name: "q", in: "query", schema: { type: "string" } }],
        responses: {
          200: {
            description: "Categorized search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    price_low: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    rating_high: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    sales_high: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/products/compare/list": {
      get: {
        tags: ["Products"],
        summary: "Compare products by ID (Rule-Based Compare Engine)",
        description:
          "Returns the raw product list plus a `comparison` object (value scores, per-factor comparisons, winner, reasoning) when 2+ ids are given.",
        parameters: [{ name: "ids", in: "query", required: true, schema: { type: "string" }, example: "id1,id2,id3" }],
        responses: {
          200: {
            description: "Products + comparison",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    comparison: {
                      type: "object",
                      properties: {
                        items: { type: "array", items: { type: "object" } },
                        winner: { type: "object" },
                        reasoning: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "Get all categories as a nested tree (top-level + subcategories)",
        responses: { 200: { description: "Category tree" } },
      },
    },
    "/categories/{slug}/products": {
      get: {
        tags: ["Categories"],
        summary: "Get products in a category (paginated)",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
        ],
        responses: {
          200: { description: "Category + products" },
          404: { description: "Category not found" },
        },
      },
    },
    "/home": {
      get: {
        tags: ["Home"],
        summary: "Home page sections (guest or personalized)",
        security: [{ bearerAuth: [] }],
        description: "Authorization header is optional — guests get default sections.",
        responses: { 200: { description: "Home data" } },
      },
    },
    "/intelligence/products/{id}/intelligence": {
      get: {
        tags: ["Intelligence"],
        summary: "Get rule-based product intelligence (Value Score, Price Intelligence, Review Intelligence)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Intelligence data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        aiScore: { type: "number" },
                        aiBadges: { type: "array", items: { type: "string" } },
                        reviewStats: { type: "object" },
                        categoryStats: { type: "object" },
                        priceIntelligence: { type: "object" },
                        reviewIntelligence: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Product not found" },
        },
      },
    },
    "/health": {
      // Mounted at the app root (not under /api/v1) — override the
      // server for this path only.
      servers: [{ url: "/", description: "App root" }],
      get: {
        tags: ["Health"],
        summary: "Liveness/readiness check — Mongo + Redis connection status",
        responses: {
          200: { description: "All services connected" },
          503: { description: "One or more services are disconnected" },
        },
      },
    },
  },
};

export default swaggerSpec;
