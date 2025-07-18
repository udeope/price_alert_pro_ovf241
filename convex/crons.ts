import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "send verification emails to new users",
  { minutes: 5 }, 
  internal.emails.processUnverifiedUsers,
  {} 
);

crons.interval(
  "process active price alerts",
  { minutes: 15 }, // Run every 15 minutes
  internal.priceAlerts.processActiveAlerts,
  {} // No arguments needed for the action
);

export default crons;
