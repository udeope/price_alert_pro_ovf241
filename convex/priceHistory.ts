import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const getForProduct = query({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx, args): Promise<Doc<"priceHistory">[]> => {
    if (!args.productId) {
      return [];
    }

    let queryBuilder;
    if (args.variantId) {
      // Si hay variantId, usamos el índice específico para variantes
      queryBuilder = ctx.db
        .query("priceHistory")
        .withIndex("by_variant_and_time", (q) => q.eq("variantId", args.variantId));
    } else {
      // Si no, usamos el índice de producto y filtramos por variante indefinida
      queryBuilder = ctx.db
        .query("priceHistory")
        .withIndex("by_product_and_time", (q) => q.eq("productId", args.productId))
        .filter((q) => q.eq(q.field("variantId"), undefined));
    }

    return await queryBuilder.order("asc").collect();
  },
});