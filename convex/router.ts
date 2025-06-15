import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/verifyEmail",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const tokenString = url.searchParams.get("token");

    if (!tokenString) {
      return new Response("<html><body style='font-family: sans-serif; text-align: center; padding: 20px;'><p>Verification token is missing.</p></body></html>", { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    const tokenDoc = await ctx.runQuery(internal.emailTokens.findToken, { token: tokenString });

    if (!tokenDoc) {
      return new Response("<html><body style='font-family: sans-serif; text-align: center; padding: 20px;'><p>Invalid or already used verification token. Your email might already be verified.</p></body></html>", { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    if (tokenDoc.expiresAt < Date.now()) {
      await ctx.runMutation(internal.emailTokens.deleteToken, { tokenId: tokenDoc._id });
      return new Response("<html><body style='font-family: sans-serif; text-align: center; padding: 20px;'><p>Verification token has expired. Please try signing up or logging in again to receive a new one.</p></body></html>", { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    await ctx.runMutation(internal.emailTokens.markUserEmailAsVerified, { userId: tokenDoc.userId });
    
    await ctx.runMutation(internal.emailTokens.deleteToken, { tokenId: tokenDoc._id });

    return new Response(
      `<html>
         <body style="font-family: sans-serif; text-align: center; padding: 40px; color: #333;">
           <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
             <h1 style="color: #007bff;">Email Verified!</h1>
             <p>Your email address has been successfully verified.</p>
             <p>You can now close this tab and enjoy PriceAlert Pro.</p>
             <p style="margin-top: 30px;"><a href="/" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Go to App</a></p>
           </div>
         </body>
       </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }),
});

export default http;
