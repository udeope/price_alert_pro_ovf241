import { query, mutation, internalQuery } from "./_generated/server"; // Added internalQuery
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel"; 

export const createProduct = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    basePrice: v.number(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log(`[createProduct] Attempting creation by userId: ${userId} for product name: ${args.name}`);
    
    if (!userId) {
      console.error("[createProduct] User must be logged in to create a product.");
      throw new Error("User must be logged in to create a product.");
    }
    
    const userExistingProduct = await ctx.db
      .query("products")
      .withIndex("by_user_and_active", q => q.eq("createdBy", userId).eq("isActive", true))
      .filter(q => q.eq(q.field("url"), args.url)) 
      .first();
      
    if (userExistingProduct) {
      console.log(`[createProduct] User ${userId} already has product with URL ${args.url}. ID: ${userExistingProduct._id}`);
      return userExistingProduct._id;
    }

    const newProductId: Id<"products"> = await ctx.db.insert("products", {
      ...args,
      isActive: true,
      createdBy: userId,
    });
    console.log(`[createProduct] SUCCESS: Product ${newProductId} created for userId: ${userId} with name: ${args.name}`);

    await ctx.db.insert("priceHistory", {
      productId: newProductId,
      price: args.basePrice,
      timestamp: Date.now(),
    });
    console.log(`[createProduct] Price history recorded for new product ${newProductId}`);

    return newProductId;
  },
});

// Internal query to get product details for alert checking (less restrictive)
export const getProductForAlertCheck = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args): Promise<Doc<"products"> | null> => {
    return await ctx.db.get(args.productId);
  },
});

// Internal query to get variant details for alert checking
export const getVariantForAlertCheck = internalQuery({
  args: { variantId: v.id("productVariants") },
  handler: async (ctx, args): Promise<Doc<"productVariants"> | null> => {
    return await ctx.db.get(args.variantId);
  },
});


export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log(`[getProduct] Called for productId: ${args.productId} by userId: ${userId}`);
    if (!userId) {
      console.log(`[getProduct] No userId, returning null for productId: ${args.productId}`);
      return null;
    }
    const product = await ctx.db.get(args.productId);
    if (!product) {
        console.log(`[getProduct] Product ${args.productId} not found.`);
        return null;
    }
    if (product.createdBy !== userId) {
      console.log(`[getProduct] Ownership mismatch for ${args.productId}. Owner: ${product.createdBy}, Requester: ${userId}. Returning null.`);
      return null;
    }
    console.log(`[getProduct] Returning product ${args.productId} for owner ${userId}.`);
    return product;
  },
});

export const getProductByUrl = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log(`[getProductByUrl] Called for URL: ${args.url} by userId: ${userId}`);
    if (!userId) {
      console.log(`[getProductByUrl] No userId, returning null for URL: ${args.url}`);
      return null;
    }
    const product = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("createdBy", userId)) 
      .filter((q) => q.eq(q.field("url"), args.url)) 
      .first();
    console.log(`[getProductByUrl] Found product: ${product?._id} for user ${userId} and URL ${args.url}`);
    return product;
  },
});

export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx); 
    console.log(`[getAllProducts] Called by currentUserId: ${currentUserId} (Type: ${typeof currentUserId})`);

    if (!currentUserId) {
      console.log("[getAllProducts] No currentUserId, returning empty array.");
      return [];
    }

    const userProducts = await ctx.db
      .query("products")
      .withIndex("by_user_and_active", (q) => 
        q.eq("createdBy", currentUserId).eq("isActive", true)
      )
      .order("desc") 
      .collect();
    
    console.log(`[getAllProducts] Found ${userProducts.length} active products for currentUserId: ${currentUserId}.`);
    return userProducts;
  },
});

export const searchProducts = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    console.log(`[searchProducts] Called by currentUserId: ${currentUserId} with term: "${args.searchTerm}"`);

    if (!currentUserId) {
      console.log("[searchProducts] No currentUserId, returning empty array.");
      return [];
    }

    const userActiveProducts = await ctx.db
      .query("products")
      .withIndex("by_user_and_active", q => q.eq("createdBy", currentUserId).eq("isActive", true))
      .collect();
    
    console.log(`[searchProducts] ${userActiveProducts.length} active products for user ${currentUserId} before search term filter.`);

    if (!args.searchTerm.trim()) {
        console.log("[searchProducts] Empty search term, returning all user's active products.");
        return userActiveProducts.sort((a, b) => b._creationTime - a._creationTime);
    }

    const lowerSearchTerm = args.searchTerm.toLowerCase();
    const filteredResults = userActiveProducts.filter(product => 
      product.name.toLowerCase().includes(lowerSearchTerm) ||
      (product.brand && product.brand.toLowerCase().includes(lowerSearchTerm)) ||
      (product.category && product.category.toLowerCase().includes(lowerSearchTerm)) ||
      product.url.toLowerCase().includes(lowerSearchTerm)
    ).sort((a,b) => b._creationTime - a._creationTime); 

    console.log(`[searchProducts] Returning ${filteredResults.length} products after search term filter for term "${args.searchTerm}".`);
    return filteredResults;
  },
});

export const createVariant = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    price: v.number(),
    attributes: v.object({
      size: v.optional(v.string()),
      flavor: v.optional(v.string()),
      color: v.optional(v.string()),
    }),
    sku: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log(`[createVariant] Attempting for productId: ${args.productId} by userId: ${userId}`);
    if (!userId) {
      console.error("[createVariant] User must be logged in to create a variant.");
      throw new Error("User must be logged in to create a variant.");
    }
    const product = await ctx.db.get(args.productId);
    if (!product) {
        console.error(`[createVariant] Product ${args.productId} not found.`);
        throw new Error("Product not found.");
    }
    if (product.createdBy !== userId) {
      console.error(`[createVariant] Ownership mismatch for product ${args.productId}. Owner: ${product.createdBy}, Requester: ${userId}.`);
      throw new Error("Product not found or user does not have permission to add variants to this product.");
    }
    
    const variantId: Id<"productVariants"> = await ctx.db.insert("productVariants", {
      ...args,
      isAvailable: true,
    });
    console.log(`[createVariant] SUCCESS: Variant ${variantId} created for product ${args.productId} by user ${userId}.`);

    await ctx.db.insert("priceHistory", {
      productId: args.productId,
      variantId: variantId,
      price: args.price,
      timestamp: Date.now(),
    });
    console.log(`[createVariant] Price history recorded for new variant ${variantId} of product ${args.productId}`);

    return variantId;
  },
});

export const getProductVariants = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx); 
    console.log(`[getProductVariants] Called for productId: ${args.productId} by userId: ${userId}`);

    const product = await ctx.db.get(args.productId);
    if (!product) {
        console.log(`[getProductVariants] Product ${args.productId} not found. Returning no variants.`);
        return [];
    }

    const variants = await ctx.db
      .query("productVariants")
      .withIndex("by_product_and_availability", (q) => 
        q.eq("productId", args.productId).eq("isAvailable", true)
      )
      .order("asc") 
      .collect();
    console.log(`[getProductVariants] Returning ${variants.length} available variants for product ${args.productId}.`);
    return variants;
  },
});

export const updateVariantPrice = mutation({
  args: {
    variantId: v.id("productVariants"),
    newPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    console.log(`[updateVariantPrice] Attempting for variantId: ${args.variantId} by userId: ${userId}`);
    if (!userId) {
      console.error("[updateVariantPrice] User must be logged in to update variant price.");
      throw new Error("User must be logged in to update variant price.");
    }
    const variant = await ctx.db.get(args.variantId);
    if (!variant) {
      console.error(`[updateVariantPrice] Variant ${args.variantId} not found.`);
      throw new Error("Variant not found.");
    }
    const product = await ctx.db.get(variant.productId);
    if (!product) {
        console.error(`[updateVariantPrice] Product ${variant.productId} for variant ${args.variantId} not found.`);
        throw new Error("Associated product not found.");
    }
    if (product.createdBy !== userId) {
      console.error(`[updateVariantPrice] Ownership mismatch for product ${variant.productId} (variant ${args.variantId}). Owner: ${product.createdBy}, Requester: ${userId}.`);
      throw new Error("Product not found or user does not have permission to update this variant.");
    }

    await ctx.db.patch(args.variantId, { price: args.newPrice });
    console.log(`[updateVariantPrice] SUCCESS: Variant ${args.variantId} price updated by user ${userId}.`);

    await ctx.db.insert("priceHistory", {
      productId: product._id, 
      variantId: args.variantId,
      price: args.newPrice,
      timestamp: Date.now(),
    });
    console.log(`[updateVariantPrice] Price history recorded for variant ${args.variantId} price update.`);
  },
});

export const updateProductBasePrice = mutation({
  args: {
    productId: v.id("products"),
    newBasePrice: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in.");
    }
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }
    if (product.createdBy !== userId) {
      throw new Error("User does not have permission to update this product.");
    }

    await ctx.db.patch(args.productId, { basePrice: args.newBasePrice });

    await ctx.db.insert("priceHistory", {
      productId: args.productId,
      price: args.newBasePrice,
      timestamp: Date.now(),
    });
    console.log(`[updateProductBasePrice] Price history recorded for product ${args.productId} base price update.`);
  }
});

export const getPriceHistory = query({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx, args): Promise<Doc<"priceHistory">[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      console.log("[getPriceHistory] No user logged in, returning empty history.");
      return [];
    }

    const product = await ctx.db.get(args.productId);
    if (!product || product.createdBy !== userId) {
      console.log("[getPriceHistory] Product not found or not owned by user, returning empty history.");
      return [];
    }

    let queryBuilder = ctx.db
      .query("priceHistory")
      .withIndex("by_product_and_time", (q) => q.eq("productId", args.productId));

    if (args.variantId) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("variantId"), args.variantId));
    } else {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field("variantId"), undefined));
    }
    
    const history = await queryBuilder.order("desc").collect(); // Newest first
    console.log(`[getPriceHistory] Found ${history.length} entries for product ${args.productId}, variant ${args.variantId}`);
    return history;
  },
});
