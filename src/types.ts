import { Doc } from "../convex/_generated/dataModel";

// Define the type for a product object, matching the schema
export type ProductType = Doc<"products">;

// Define the type for an alert object, matching the schema
export type PriceAlertType = Doc<"priceAlerts">;

// Define a composite type for an alert that includes its associated product information
export type PriceAlertWithProduct = PriceAlertType & {
  product: ProductType | null;
};
