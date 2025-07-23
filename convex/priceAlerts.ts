import { query, mutation, internalMutation, internalQuery, internalAction, ActionCtx, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { Doc } from "./_generated/dataModel";

// Helper query to find an existing active alert for a product/variant
export const findExistingAlert = internalQuery({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx: QueryCtx, args) => {
    let query = ctx.db
      .query("priceAlerts")
      .withIndex("by_user", (q) => q.eq("createdBy", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.eq(q.field("productId"), args.productId));

    if (args.variantId) {
      query = query.filter((q) => q.eq(q.field("variantId"), args.variantId));
    } else {
      query = query.filter((q) => q.eq(q.field("variantId"), undefined));
    }
    return await query.first();
  },
});

export const createPriceAlert = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    productName: v.string(),
    variantName: v.optional(v.string()),
    currentPrice: v.number(),
    targetPrice: v.optional(v.number()),
    userContact: v.string(),
    contactType: v.union(v.literal("whatsapp"), v.literal("telegram"), v.literal("email")),
    // Nuevos parámetros para alertas inteligentes
    alertType: v.optional(v.union(
      v.literal("fixed_price"),
      v.literal("percentage"),
      v.literal("any_drop"),
      v.literal("seasonal")
    )),
    percentageThreshold: v.optional(v.number()),
    multipleThresholds: v.optional(v.array(v.object({
      percentage: v.number(),
      triggered: v.boolean(),
      notifiedAt: v.optional(v.number())
    }))),
    seasonalContext: v.optional(v.object({
      isBlackFridayAlert: v.boolean(),
      isChristmasAlert: v.boolean(),
      isSummerSaleAlert: v.boolean()
    })),
    maxDailyNotifications: v.optional(v.number()),
    groupSimilarAlerts: v.optional(v.boolean()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to create an alert.");
    }

    const existingAlert = await ctx.runQuery(internal.priceAlerts.findExistingAlert, {
      userId,
      productId: args.productId,
      variantId: args.variantId,
    });

    if (existingAlert) {
      console.log(`[createPriceAlert] User ${userId} already has an active alert for product ${args.productId} (variant: ${args.variantId}).`);
      throw new Error("An active alert for this product/variant already exists.");
    }
    
    console.log(`[createPriceAlert] Creating alert for userId: ${userId}, product: ${args.productName}, contact: ${args.contactType}`);

    // Determinar el tipo de alerta basado en los parámetros
    let alertType = args.alertType || "any_drop"; // Por defecto, cualquier bajada
    if (args.targetPrice !== undefined && args.targetPrice !== null) {
      alertType = "fixed_price"; // Si hay precio objetivo, es alerta fija
    }
    if (args.percentageThreshold !== undefined) {
      alertType = "percentage"; // Si hay porcentaje, es alerta por porcentaje
    }
    if (args.multipleThresholds && args.multipleThresholds.length > 0) {
      alertType = "percentage"; // Múltiples umbrales también es por porcentaje
    }

    const alertId = await ctx.db.insert("priceAlerts", {
      ...args,
      isActive: true,
      createdBy: userId,
      lastChecked: Date.now(),
      alertType,
      notificationSettings: {
        maxDailyNotifications: args.maxDailyNotifications || 3,
        lastNotificationDate: undefined,
        notificationsToday: 0,
        groupSimilarAlerts: args.groupSimilarAlerts || true
      }
    });

    console.log(`[createPriceAlert] SUCCESS: Alert ${alertId} created for userId: ${userId}`);
    return alertId;
  },
});

export const updatePriceAlert = mutation({
  args: {
    alertId: v.id("priceAlerts"),
    targetPrice: v.optional(v.number()),
    userContact: v.string(),
    contactType: v.union(v.literal("whatsapp"), v.literal("telegram"), v.literal("email")),
    isActive: v.optional(v.boolean()), 
  },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to update an alert.");
    }

    const existingAlert = await ctx.db.get(args.alertId);
    if (!existingAlert) {
      throw new Error("Alert not found.");
    }

    if (existingAlert.createdBy !== userId) {
      throw new Error("You do not have permission to update this alert.");
    }

    const { alertId, ...updateFields } = args;

    await ctx.db.patch(alertId, updateFields);
    console.log(`[updatePriceAlert] SUCCESS: Alert ${alertId} updated by userId: ${userId}`);
    return alertId;
  },
});

export const getUserAlerts = query({
  args: {},
  handler: async (ctx: QueryCtx): Promise<(Doc<"priceAlerts"> & { product: Doc<"products"> | null })[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      console.log("[getUserAlerts] No userId, returning empty array.");
      return [];
    }
    const alerts = await ctx.db
      .query("priceAlerts")
      .withIndex("by_user", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();

    const alertsWithProducts = await Promise.all(
      alerts.map(async (alert) => {
        const product = alert.productId ? await ctx.db.get(alert.productId) : null;
        return { ...alert, product };
      })
    );

    console.log(`[getUserAlerts] Found ${alertsWithProducts.length} alerts for userId: ${userId}`);
    return alertsWithProducts;
  },
});

export const updateAlertStatus = mutation({
  args: {
    alertId: v.id("priceAlerts"),
    isActive: v.boolean(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in.");
    }
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.createdBy !== userId) {
      throw new Error("Alert not found or user does not have permission.");
    }
    await ctx.db.patch(args.alertId, { isActive: args.isActive, lastChecked: Date.now() }); // Update lastChecked when status changes
    console.log(`[updateAlertStatus] Alert ${args.alertId} status updated to ${args.isActive} by userId: ${userId}`);
    return true;
  },
});

export const deleteAlert = mutation({
  args: { alertId: v.id("priceAlerts") },
  handler: async (ctx: MutationCtx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in.");
    }
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.createdBy !== userId) {
      throw new Error("Alert not found or user does not have permission.");
    }
    await ctx.db.delete(args.alertId);
    console.log(`[deleteAlert] Alert ${args.alertId} deleted by userId: ${userId}`);
    return true;
  },
});

// Internal query to get a single alert (used by actions)
export const getAlertInternal = internalQuery({
  args: { alertId: v.id("priceAlerts") },
  handler: async (ctx: QueryCtx, args): Promise<Doc<"priceAlerts"> | null> => {
    return await ctx.db.get(args.alertId);
  },
});

// Internal query to get all active alerts
export const getActiveAlertsInternal = internalQuery({
  args: {},
  handler: async (ctx: QueryCtx): Promise<Doc<"priceAlerts">[]> => {
    return await ctx.db
      .query("priceAlerts")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();
  },
});

// Internal mutation to update an alert after a check
// Internal mutation para actualizar múltiples umbrales
export const updateMultipleThresholds = internalMutation({
  args: {
    alertId: v.id("priceAlerts"),
    thresholds: v.array(v.object({
      percentage: v.number(),
      triggered: v.boolean(),
      notifiedAt: v.optional(v.number())
    }))
  },
  handler: async (ctx: MutationCtx, args): Promise<void> => {
    await ctx.db.patch(args.alertId, { 
      multipleThresholds: args.thresholds 
    });
  },
});

export const updateAlertAfterCheck = internalMutation({
  args: {
    alertId: v.id("priceAlerts"),
    newCurrentPrice: v.optional(v.number()), // The new price that was detected
    setInactive: v.optional(v.boolean()),
    notified: v.optional(v.boolean()), // Flag if notification was sent
  },
  handler: async (ctx: MutationCtx, args): Promise<void> => {
    const updatePayload: Partial<Doc<"priceAlerts">> = { lastChecked: Date.now() };
    if (args.newCurrentPrice !== undefined) {
      updatePayload.currentPrice = args.newCurrentPrice; // Update the alert's currentPrice to the new one
    }
    if (args.setInactive) {
      updatePayload.isActive = false;
    }
    // We could add a 'lastNotified' field if we want to track that separately
    await ctx.db.patch(args.alertId, updatePayload);

    // If a new price was detected and it's different, record it in history
    if (args.newCurrentPrice !== undefined) {
        const alert = await ctx.db.get(args.alertId);
        if (alert) {
             // Check if this new price is actually different from the last recorded price for this alert
            const lastHistoryEntry = await ctx.db.query("priceHistory")
                .withIndex("by_product_and_time", q => q.eq("productId", alert.productId!)) // productId should exist
                .filter(q => alert.variantId ? q.eq(q.field("variantId"), alert.variantId) : q.eq(q.field("variantId"), undefined))
                .order("desc")
                .first();
            
            if (!lastHistoryEntry || lastHistoryEntry.price !== args.newCurrentPrice) {
                await ctx.db.insert("priceHistory", {
                    productId: alert.productId!, // productId must exist on an alert
                    variantId: alert.variantId,
                    price: args.newCurrentPrice,
                    timestamp: Date.now(),
                });
                console.log(`[updateAlertAfterCheck] Price history recorded for alert ${args.alertId} with new price ${args.newCurrentPrice}`);
            }
        }
    }
  },
});


export const processActiveAlerts = internalAction({
  args: {}, // No arguments needed, cron will trigger it
  handler: async (ctx: ActionCtx, args): Promise<{ processed: number; notified: number }> => {
    console.log("[processActiveAlerts] Starting to process active alerts.");
    const activeAlerts = await ctx.runQuery(internal.priceAlerts.getActiveAlertsInternal);
    let notifiedCount = 0;

    if (!activeAlerts || activeAlerts.length === 0) {
      console.log("[processActiveAlerts] No active alerts found.");
      return { processed: 0, notified: 0 };
    }

    console.log(`[processActiveAlerts] Found ${activeAlerts.length} active alerts to process.`);

    for (const alert of activeAlerts) {
      if (!alert.productId) {
        console.warn(`[processActiveAlerts] Alert ${alert._id} missing productId. Skipping.`);
        await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id, setInactive: true });
        continue;
      }

      let currentMarketPrice: number | undefined;
      let productName = alert.productName; // Use name from alert as fallback

      const product = await ctx.runQuery(internal.products.getProductForAlertCheck, { productId: alert.productId });
      if (!product) {
        console.warn(`[processActiveAlerts] Product ${alert.productId} for alert ${alert._id} not found. Setting alert inactive.`);
        await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id, setInactive: true });
        continue;
      }
      productName = product.name; // Get latest product name

      if (alert.variantId) {
        const variant = await ctx.runQuery(internal.products.getVariantForAlertCheck, { variantId: alert.variantId });
        if (variant && variant.productId === alert.productId) { // Ensure variant belongs to the product
          currentMarketPrice = variant.price;
          productName = `${product.name} - ${variant.name}`; // More specific name
        } else {
          console.warn(`[processActiveAlerts] Variant ${alert.variantId} for alert ${alert._id} not found or mismatched product. Setting alert inactive.`);
          await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id, setInactive: true });
          continue;
        }
      } else {
        currentMarketPrice = product.basePrice;
      }

      if (currentMarketPrice === undefined) {
        console.warn(`[processActiveAlerts] Could not determine current market price for alert ${alert._id}. Skipping.`);
        await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id }); // Just update lastChecked
        continue;
      }

      console.log(`[processActiveAlerts] Alert ${alert._id}: DB Price=${alert.currentPrice}, Market Price=${currentMarketPrice}, Target=${alert.targetPrice}`);

      let shouldNotify = false;
      let notificationMessage = "";
      
      // Nueva lógica para alertas inteligentes
      const alertType = alert.alertType || "any_drop"; // Por defecto para alertas existentes
      switch (alertType) {
        case "fixed_price":
          if (alert.targetPrice !== undefined && currentMarketPrice <= alert.targetPrice) {
            shouldNotify = true;
            notificationMessage = `¡Precio objetivo alcanzado! €${currentMarketPrice.toFixed(2)} (objetivo: €${alert.targetPrice.toFixed(2)})`;
          }
          break;
          
        case "percentage": {
          const originalPrice = alert.currentPrice;
          const percentageDrop = ((originalPrice - currentMarketPrice) / originalPrice) * 100;
          
          if (alert.multipleThresholds && alert.multipleThresholds.length > 0) {
            // Verificar múltiples umbrales
            for (const threshold of alert.multipleThresholds) {
              if (percentageDrop >= threshold.percentage && !threshold.triggered) {
                shouldNotify = true;
                notificationMessage = `¡Descuento del ${threshold.percentage}%! Precio: €${currentMarketPrice.toFixed(2)} (antes: €${originalPrice.toFixed(2)})`;
                // Marcar este umbral como activado
                const updatedThresholds = alert.multipleThresholds.map((t: { percentage: number; triggered: boolean; notifiedAt?: number }) =>
                  t.percentage === threshold.percentage
                    ? { ...t, triggered: true, notifiedAt: Date.now() }
                    : t
                );
                await ctx.runMutation(internal.priceAlerts.updateMultipleThresholds, {
                  alertId: alert._id,
                  thresholds: updatedThresholds
                });
                break;
              }
            }
          } else if (alert.percentageThreshold && percentageDrop >= alert.percentageThreshold) {
            shouldNotify = true;
            notificationMessage = `¡Descuento del ${percentageDrop.toFixed(1)}%! Precio: €${currentMarketPrice.toFixed(2)} (antes: €${originalPrice.toFixed(2)})`;
          }
          break;
        }
          
        case "seasonal": {
          // Lógica para alertas estacionales
          const currentDate = new Date();
          const month = currentDate.getMonth() + 1;
          const day = currentDate.getDate();
          
          let isSeasonalPeriod = false;
          if (alert.seasonalContext?.isBlackFridayAlert && month === 11 && day >= 24 && day <= 30) {
            isSeasonalPeriod = true;
          } else if (alert.seasonalContext?.isChristmasAlert && month === 12 && day >= 20) {
            isSeasonalPeriod = true;
          } else if (alert.seasonalContext?.isSummerSaleAlert && month >= 6 && month <= 8) {
            isSeasonalPeriod = true;
          }
          
          if (isSeasonalPeriod && currentMarketPrice < alert.currentPrice) {
            shouldNotify = true;
            notificationMessage = `¡Oferta estacional detectada! Precio: €${currentMarketPrice.toFixed(2)}`;
          }
          break;
        }
          
        case "any_drop":
        default: {
          if (currentMarketPrice < alert.currentPrice) {
            shouldNotify = true;
            const savingsAmount = alert.currentPrice - currentMarketPrice;
            notificationMessage = `¡Precio más bajo! €${currentMarketPrice.toFixed(2)} (ahorras €${savingsAmount.toFixed(2)})`;
          }
          break;
        }
      }

      if (shouldNotify) {
        console.log(`[processActiveAlerts] Price condition met for alert ${alert._id}. Product: ${productName}, New Price: ${currentMarketPrice}`);
        
        const user = await ctx.runQuery(internal.users.getUserById, { userId: alert.createdBy! }); // createdBy should exist
        if (user && user.email) {
          await ctx.runAction(internal.notifications.sendPriceDropNotification, {
            alertId: alert._id,
            userEmail: user.email,
            userName: user.name || "User",
            productName: productName,
            variantName: alert.variantName,
            newPrice: currentMarketPrice,
            targetPrice: alert.targetPrice,
            productUrl: product.url, // Pass product URL for the email
            contactType: alert.contactType, // Pass contact type
            userContact: alert.userContact, // Pass user's specific contact for that type
          });
          notifiedCount++;
          await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, {
            alertId: alert._id,
            newCurrentPrice: currentMarketPrice,
            setInactive: true, // Deactivate after notification
            notified: true,
          });
        } else {
          console.warn(`[processActiveAlerts] User ${alert.createdBy} or email not found for alert ${alert._id}. Cannot notify.`);
          await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id, newCurrentPrice: currentMarketPrice }); // Update price but don't deactivate
        }
      } else {
        // No price drop, just update lastChecked and potentially the currentPrice if it changed (e.g. price went up)
        if (currentMarketPrice !== alert.currentPrice) {
            await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id, newCurrentPrice: currentMarketPrice });
        } else {
            await ctx.runMutation(internal.priceAlerts.updateAlertAfterCheck, { alertId: alert._id });
        }
      }
    }
    console.log(`[processActiveAlerts] Finished processing. Processed: ${activeAlerts.length}, Notified: ${notifiedCount}`);
    return { processed: activeAlerts.length, notified: notifiedCount };
  },
});
