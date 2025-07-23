import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  products: defineTable({
    name: v.string(),
    url: v.string(),
    basePrice: v.number(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    lastScraped: v.optional(v.number()),
    scrapingStatus: v.optional(v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("pending")
    )),
  })
    .index("by_url", ["url"])
    .index("by_user", ["createdBy"]) 
    .index("by_active", ["isActive"]) 
    .index("by_user_and_active", ["createdBy", "isActive"])
    .searchIndex("by_name_and_brand", {
      searchField: "name",
      filterFields: ["createdBy", "isActive", "brand", "category"],
    }),

  productVariants: defineTable({
    productId: v.id("products"),
    name: v.string(), 
    price: v.number(),
    attributes: v.object({
      size: v.optional(v.string()),
      flavor: v.optional(v.string()),
      color: v.optional(v.string()),
    }),
    sku: v.optional(v.string()),
    isAvailable: v.boolean(),
  })
    .index("by_product", ["productId"])
    .index("by_product_and_availability", ["productId", "isAvailable"]),

  priceAlerts: defineTable({
    productUrl: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    variantId: v.optional(v.id("productVariants")),
    productName: v.string(),
    variantName: v.optional(v.string()),
    currentPrice: v.number(),
    targetPrice: v.optional(v.number()),
    userContact: v.string(),
    contactType: v.union(v.literal("whatsapp"), v.literal("telegram"), v.literal("email")),
    isActive: v.boolean(),
    lastChecked: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    // Campos nuevos para alertas inteligentes
    alertType: v.optional(v.union(
      v.literal("fixed_price"),      // Alerta cuando el precio alcance una cantidad específica
      v.literal("percentage"),       // Alerta cuando el precio baje por un porcentaje
      v.literal("any_drop"),         // Alerta ante cualquier baja de precio
      v.literal("seasonal")          // Alerta basadas en patrones estacionales
    )),
    percentageThreshold: v.optional(v.number()), // Para alertas basadas en porcentaje (ejemplo 20 para 20%)
    multipleThresholds: v.optional(v.array(v.object({
      percentage: v.number(),
      triggered: v.boolean(),
      notifiedAt: v.optional(v.number())
    }))), // Para alertas con múltiples porcentajes
    seasonalContext: v.optional(v.object({
      isBlackFridayAlert: v.boolean(),
      isChristmasAlert: v.boolean(),
      isSummerSaleAlert: v.boolean()
    })),
    notificationSettings: v.optional(v.object({
      maxDailyNotifications: v.number(),
      lastNotificationDate: v.optional(v.number()),
      notificationsToday: v.number(),
      groupSimilarAlerts: v.boolean()
    }))
  })
    .index("by_product_url", ["productUrl"])
    .index("by_product", ["productId"])
    .index("by_user", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_product_and_variant", ["productId", "variantId"]),

  priceHistory: defineTable({
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    price: v.number(),
    timestamp: v.number(),
  })
    .index("by_product_and_time", ["productId", "timestamp"])
    .index("by_variant_and_time", ["variantId", "timestamp"]),

  emailVerificationTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(), // Timestamp for when the token expires
  })
    .index("by_token", ["token"])
    .index("by_user_and_expires", ["userId", "expiresAt"]),
};

export default defineSchema({
  ...authTables, // authTables already includes emailVerificationTime on users table
  ...applicationTables,
});
