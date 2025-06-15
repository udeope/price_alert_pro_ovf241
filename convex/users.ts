// Helper query to be used by internal actions/mutations if needed
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, args: { userId: Id<"users"> }): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(args.userId);
  },
});
