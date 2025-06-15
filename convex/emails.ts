"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { Resend } from "resend";
import { ActionCtx } from "./_generated/server"; 
import crypto from "crypto"; 

const RESEND_API_KEY = process.env.CONVEX_RESEND_API_KEY;
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL; // Used for links back to the app

export const sendVerificationEmail = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx: ActionCtx, args) => {
    if (!CONVEX_SITE_URL) {
      console.error("CONVEX_SITE_URL environment variable is not set. Cannot send verification email.");
      return { success: false, error: "Server configuration error." };
    }
    if (!RESEND_API_KEY) {
      console.error("CONVEX_RESEND_API_KEY is not set. Cannot send email.");
      return { success: false, error: "Email service not configured." };
    }

    const user: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserById, { userId: args.userId });

    if (!user || !user.email) {
      console.log(`User ${args.userId} not found or has no email.`);
      return { success: false, error: "User not found or no email." };
    }

    if (user.emailVerificationTime) {
      console.log(`Email for user ${args.userId} is already verified.`);
      return { success: true, message: "Email already verified." };
    }
    
    const existingToken: Doc<"emailVerificationTokens"> | null = await ctx.runQuery(internal.emailTokens.getActiveTokenForUser, { userId: args.userId });
    if (existingToken) {
        console.log(`Active verification token already exists for user ${args.userId}. Email not resent immediately.`);
        return { success: true, message: "Verification email recently sent or active token exists." };
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.runMutation(internal.emailTokens.storeToken, {
      userId: args.userId,
      token,
      expiresAt,
    });

    const verificationUrl = `${CONVEX_SITE_URL}/verifyEmail?token=${token}`;
    
    const resend = new Resend(RESEND_API_KEY);

    const emailHtml = `
<div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 20px auto; border: 1px solid #dddddd; border-radius: 8px; padding: 25px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
  <div style="text-align: center; margin-bottom: 25px;">
    <h1 style="color: #007bff; font-size: 26px; margin-bottom: 10px;">Welcome to PriceAlert Pro!</h1>
  </div>
  <p style="font-size: 16px; margin-bottom: 15px;">Hello ${user.name || 'Valued User'},</p>
  <p style="font-size: 16px; margin-bottom: 15px;">Thank you for signing up for PriceAlert Pro! We're thrilled to have you join our community and help you stay on top of the best prices.</p>
  <p style="font-size: 16px; margin-bottom: 25px;">To complete your registration and unlock all the features of PriceAlert Pro, please verify your email address by clicking the button below. This step ensures your account is secure and you're ready to go!</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" style="background-color: #28a745; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 17px; display: inline-block; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Verify Your Email Address</a>
  </div>
  <p style="font-size: 16px; margin-bottom: 15px;">This verification link is valid for 24 hours. If you don't verify your email within this time, you may need to request a new verification link by attempting to log in again.</p>
  <p style="font-size: 16px; margin-bottom: 25px;">If you did not sign up for PriceAlert Pro, please disregard this email. Your account will not be activated and no further action is needed on your part.</p>
  <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0;">
  <div style="font-size: 0.9em; color: #777777; text-align: center;">
    <p style="margin-bottom: 5px;">&copy; ${new Date().getFullYear()} PriceAlert Pro. All rights reserved.</p>
    <p style="margin-bottom: 0;">If you have any questions or need assistance, please feel free to contact our support team.</p>
  </div>
</div>`;

    try {
      await resend.emails.send({
        from: "PriceAlert Pro <welcome@pricealert.convexchef.app>", 
        to: user.email,
        subject: "Welcome to PriceAlert Pro! Please Verify Your Email", 
        html: emailHtml,
      });
      console.log(`Verification email sent to ${user.email} for user ${args.userId}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to send verification email to ${user.email}:`, error);
      return { success: false, error: "Failed to send email." };
    }
  },
});

export const processUnverifiedUsers = internalAction({
    args: {}, 
    handler: async (ctx: ActionCtx) => {
        const usersToVerify: Doc<"users">[] = await ctx.runQuery(internal.emailTokens.getUsersNeedingVerification);
        console.log(`[Cron] Found ${usersToVerify.length} users needing verification.`);
        for (const user of usersToVerify) {
            if (user.email) { 
                 console.log(`[Cron] Processing user ${user._id} (${user.email}) for email verification.`);
                 await ctx.runAction(internal.emails.sendVerificationEmail, { userId: user._id });
            } else {
                 console.log(`[Cron] Skipping user ${user._id} as they have no email.`);
            }
        }
    }
});

export const sendPriceDropEmail = internalAction({
  args: {
    toEmail: v.string(),
    userName: v.string(),
    productName: v.string(),
    variantName: v.optional(v.string()),
    newPrice: v.number(),
    targetPrice: v.optional(v.number()),
    productUrl: v.string(),
  },
  handler: async (ctx: ActionCtx, args) => {
    if (!RESEND_API_KEY) {
      console.error("[sendPriceDropEmail] CONVEX_RESEND_API_KEY is not set. Cannot send email.");
      return { success: false, error: "Email service not configured." };
    }
    if (!CONVEX_SITE_URL) {
        console.warn("[sendPriceDropEmail] CONVEX_SITE_URL is not set. Links in email might be incomplete.");
    }

    const resend = new Resend(RESEND_API_KEY);

    const fullProductName = args.variantName ? `${args.productName} - ${args.variantName}` : args.productName;
    const subject = `¡Alerta de Precio! ${fullProductName} ha bajado de precio`;
    
    let message = `<p>¡Hola ${args.userName}!</p>
                   <p>Buenas noticias: El precio de <strong>${fullProductName}</strong> ha bajado a <strong>€${args.newPrice.toFixed(2)}</strong>.</p>`;
    if (args.targetPrice !== undefined && args.targetPrice !== null) {
      message += `<p>Tu precio objetivo era €${args.targetPrice.toFixed(2)}.</p>`;
    }
    message += `<p>Puedes ver el producto aquí: <a href="${args.productUrl}">${args.productUrl}</a></p>
                <p>¡No te lo pierdas!</p>
                <p>Saludos,<br>El equipo de PriceAlert Pro</p>
                <hr>
                <p style="font-size:0.8em; color:grey;">Para dejar de recibir alertas para este producto, puedes desactivarla en la sección "Mis Alertas" en <a href="${CONVEX_SITE_URL || '#'}">PriceAlert Pro</a>.</p>`;

    const emailHtml = `
<div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 20px auto; border: 1px solid #dddddd; border-radius: 8px; padding: 25px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
  <div style="text-align: center; margin-bottom: 25px;">
    <h1 style="color: #28a745; font-size: 26px; margin-bottom: 10px;">🎉 ¡Alerta de Precio! 🎉</h1>
  </div>
  ${message}
  <div style="font-size: 0.9em; color: #777777; text-align: center; margin-top: 25px;">
    <p style="margin-bottom: 5px;">&copy; ${new Date().getFullYear()} PriceAlert Pro. Todos los derechos reservados.</p>
  </div>
</div>`;

    try {
      await resend.emails.send({
        from: "PriceAlert Pro Alerts <alerts@pricealert.convexchef.app>",
        to: args.toEmail,
        subject: subject,
        html: emailHtml,
      });
      console.log(`[sendPriceDropEmail] Price drop email sent to ${args.toEmail} for product ${fullProductName}`);
      return { success: true };
    } catch (error) {
      console.error(`[sendPriceDropEmail] Failed to send price drop email to ${args.toEmail}:`, error);
      return { success: false, error: "Failed to send price drop email." };
    }
  },
});
