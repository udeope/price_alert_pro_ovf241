/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as emailTokens from "../emailTokens.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as priceAlerts from "../priceAlerts.js";
import type * as products from "../products.js";
import type * as router from "../router.js";
import type * as users from "../users.js";
import type * as webScraper from "../webScraper.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  emailTokens: typeof emailTokens;
  emails: typeof emails;
  http: typeof http;
  notifications: typeof notifications;
  priceAlerts: typeof priceAlerts;
  products: typeof products;
  router: typeof router;
  users: typeof users;
  webScraper: typeof webScraper;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
