"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const sendPriceDropNotification = internalAction({
  args: {
    alertId: v.id("priceAlerts"),
    userEmail: v.string(),
    userName: v.string(),
    productName: v.string(),
    variantName: v.optional(v.string()),
    newPrice: v.number(),
    targetPrice: v.optional(v.number()),
    productUrl: v.string(),
    contactType: v.union(v.literal("whatsapp"), v.literal("telegram"), v.literal("email")),
    userContact: v.string(), // This is the specific contact string (e.g. email address, phone, telegram ID)
  },
  handler: async (ctx, args) => {
    console.log(`[sendPriceDropNotification] Preparing notification for alert ${args.alertId}, contact type: ${args.contactType}`);

    if (args.contactType === "email") {
      // Ensure the userContact for email type is indeed the user's email.
      // Or, if userContact is specifically for email, use that. Here, we assume args.userEmail is the one to use.
      await ctx.runAction(internal.emails.sendPriceDropEmail, {
        toEmail: args.userEmail, // The verified email of the user account
        userName: args.userName,
        productName: args.productName,
        variantName: args.variantName,
        newPrice: args.newPrice,
        targetPrice: args.targetPrice,
        productUrl: args.productUrl,
      });
      console.log(`[sendPriceDropNotification] Email notification process initiated for ${args.userEmail}`);
    } else if (args.contactType === "whatsapp") {
      // Placeholder for WhatsApp notification logic
      console.log(`[sendPriceDropNotification] WhatsApp notification requested for ${args.userContact} (Not Implemented)`);
      // Example: await ctx.runAction(internal.whatsapp.sendNotification, { to: args.userContact, ... });
    } else if (args.contactType === "telegram") {
      // Placeholder for Telegram notification logic
      console.log(`[sendPriceDropNotification] Telegram notification requested for ${args.userContact} (Not Implemented)`);
      // Example: await ctx.runAction(internal.telegram.sendNotification, { to: args.userContact, ... });
    } else {
      console.warn(`[sendPriceDropNotification] Unknown contact type: ${args.contactType} for alert ${args.alertId}`);
    }
    return { success: true };
  },
});
