import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

export const storeToken = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Remove any old tokens for this user before inserting a new one
    const oldTokens = await ctx.db
        .query("emailVerificationTokens")
        .withIndex("by_user_and_expires", q => q.eq("userId", args.userId))
        .collect();
    for (const oldToken of oldTokens) {
        await ctx.db.delete(oldToken._id);
    }
    await ctx.db.insert("emailVerificationTokens", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
    });
  },
});

export const findToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx: QueryCtx, args): Promise<Doc<"emailVerificationTokens"> | null> => {
    return await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
  },
});

export const getActiveTokenForUser = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx: QueryCtx, args): Promise<Doc<"emailVerificationTokens"> | null> => {
        const now = Date.now();
        return await ctx.db
            .query("emailVerificationTokens")
            .withIndex("by_user_and_expires", q => q.eq("userId", args.userId).gt("expiresAt", now))
            .first(); 
    }
});

export const deleteToken = internalMutation({
  args: { tokenId: v.id("emailVerificationTokens") },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.tokenId);
  },
});

export const markUserEmailAsVerified = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.patch(args.userId, { emailVerificationTime: Date.now() });
  },
});

export const getUsersNeedingVerification = internalQuery({
    args: {},
    handler: async (ctx: QueryCtx): Promise<Doc<"users">[]> => {
        const users = await ctx.db.query("users")
            .filter(q => q.eq(q.field("emailVerificationTime"), undefined)) 
            .collect();
        
        const usersNeedingEmail: Doc<"users">[] = [];
        const now = Date.now();

        for (const user of users) {
            if (!user.email) continue; 

            const activeToken = await ctx.db.query("emailVerificationTokens")
                .withIndex("by_user_and_expires", q => q.eq("userId", user._id).gt("expiresAt", now))
                .first();
            
            if (!activeToken) {
                usersNeedingEmail.push(user);
            }
        }
        return usersNeedingEmail;
    }
});
