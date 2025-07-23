"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

// Reusable data extraction logic (no changes needed here)
function extractProductData($: CheerioAPI, url: string) {
  const extract = (selectors: string[], attribute?: string): string => {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        if (attribute) {
          const attrValue = element.attr(attribute);
          if (attrValue) return attrValue.trim();
        } else {
          let text = element.text().trim();
          if (!text && element.val()) {
            text = String(element.val()).trim();
          }
          if (text) return text;
        }
      }
    }
    return '';
  };

  let price = 0;
  const priceSelectors = [
    '[itemprop="price"]', '[property="product:price:amount"]', '.price', '.Price', '.precio',
    '[class*="price"]', '[id*="price"]', '.product-price', '.current-price',
    '.sale-price', '.final-price', 'span[class*="currency"]'
  ];
  const priceTextRaw = extract(priceSelectors, 'content') || extract(priceSelectors);
  if (priceTextRaw) {
    const priceMatch = priceTextRaw.replace(/[^0-9.,]/g, '').match(/(\d{1,3}(?:[.,]\d{3})*[.,]\d{2,3}|\d+[.,]\d{2,3}|\d+)/);
    if (priceMatch && priceMatch[0]) {
      const cleanedPrice = priceMatch[0].replace(/\./g, (match, offset, string) => string.lastIndexOf('.') === offset ? match : '').replace(',', '.');
      price = parseFloat(cleanedPrice);
    }
  }

  let title = extract(['h1', '.product-title', '.product-name', '[itemprop="name"]', 'meta[property="og:title"]'], 'content');
  if (!title) title = extract(['h1', '.product-title', '.product-name', '[itemprop="name"]']);
  if (!title) title = $('title').first().text().trim();

  let imageUrl = extract(['meta[property="og:image"]', '.product-image img'], 'content');
  if (!imageUrl) imageUrl = extract(['.product-image img'], 'src');
  if (imageUrl && !imageUrl.startsWith('http')) {
    try {
      imageUrl = new URL(imageUrl, url).href;
    } catch {
      imageUrl = '';
    }
  }

  let description = extract(['meta[property="og:description"]', '[itemprop="description"]'], 'content');
  if (!description) description = extract(['.product-description', '.description']);

  let brand = extract(['[itemprop="brand"] [itemprop="name"]', 'meta[property="product:brand"]'], 'content');
  if (!brand) brand = extract(['[itemprop="brand"]', '.product-brand']);

  return {
    title: title.substring(0, 200),
    price: isNaN(price) ? 0 : price,
    imageUrl: imageUrl.substring(0, 1000),
    description: description.substring(0, 1000),
    brand: brand.substring(0, 100),
  };
}

export const scrapeProductInfo = internalAction({
  args: {
    url: v.string(),
  },
  handler: async (_, args) => {
    try {
      console.log(`[ApiScraper] Scraping with external API for URL: ${args.url}`);
      const apiKey = process.env.SCRAPER_API_KEY;
      if (!apiKey) {
        throw new Error("SCRAPER_API_KEY environment variable not set.");
      }

      const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(args.url)}&render=true`;
      
      const response = await fetch(scraperUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ScraperAPI. Status: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const productData = extractProductData($, args.url);
      
      console.log("[ApiScraper] Extracted data:", productData);

      if (!productData.title && !productData.price) {
        console.log("[ApiScraper] Failed to extract significant data with API.");
        return { success: false, error: "Could not extract product data with API.", ...productData };
      }

      return { success: true, ...productData };

    } catch (error: any) {
      console.error('[ApiScraper] Scraping failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown scraping error',
        title: '', price: 0, imageUrl: '', description: '', brand: ''
      };
    }
  },
});
