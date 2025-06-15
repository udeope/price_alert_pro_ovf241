"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import * as cheerio from "cheerio";

// List of common user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export const scrapeProductInfo = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[CheerioScraper] Fetching URL: ${args.url}`);
      const response = await fetch(args.url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br', // Request compressed content
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'DNT': '1', // Do Not Track
        }
      });

      if (!response.ok) {
        console.error(`[CheerioScraper] Failed to fetch URL: ${args.url}. Status: ${response.status}`);
        return {
          success: false,
          error: `Failed to fetch URL. Status: ${response.status} ${response.statusText}`,
          title: '', price: 0, imageUrl: '', description: '', brand: ''
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      console.log(`[CheerioScraper] HTML loaded for URL: ${args.url}`);

      // Helper function to extract text or attribute
      const extract = (selectors: string[], attribute?: string): string => {
        for (const selector of selectors) {
          const element = $(selector).first();
          if (element.length) {
            if (attribute) {
              const attrValue = element.attr(attribute);
              if (attrValue) return attrValue.trim();
            } else {
              // Try to get text, considering different ways sites might hide it
              let text = element.text().trim();
              if (!text && element.val()) { // For input/meta tags with value/content
                 text = String(element.val()).trim();
              }
              if (text) return text;
            }
          }
        }
        return '';
      };
      
      // Price extraction logic (more robust)
      let price = 0;
      const priceSelectors = [
        '[itemprop="price"]', '[property="product:price:amount"]', '.price', '.Price', '.precio', 
        '[class*="price"]', '[id*="price"]', '.product-price', '.current-price', 
        '.sale-price', '.final-price', 'span[class*="currency"]'
      ];
      const priceTextRaw = extract(priceSelectors, 'content') || extract(priceSelectors);
      if (priceTextRaw) {
        console.log(`[CheerioScraper] Raw price text: "${priceTextRaw}"`);
        // Remove currency symbols, thousands separators, keep decimal point
        const priceMatch = priceTextRaw.replace(/[^0-9.,]/g, '').match(/(\d{1,3}(?:[.,]\d{3})*[.,]\d{2,3}|\d+[.,]\d{2,3}|\d+)/);
        if (priceMatch && priceMatch[0]) {
          let cleanedPrice = priceMatch[0];
          // If multiple dots and a comma, assume dot is thousand sep, comma is decimal
          if (cleanedPrice.includes(',') && cleanedPrice.split('.').length > 1) {
            cleanedPrice = cleanedPrice.replace(/\./g, ''); // Remove all dots
          }
          cleanedPrice = cleanedPrice.replace(',', '.'); // Comma to dot for decimal
          price = parseFloat(cleanedPrice);
          console.log(`[CheerioScraper] Parsed price: ${price}`);
        } else {
            console.log(`[CheerioScraper] Could not parse price from: "${priceTextRaw}"`);
        }
      } else {
        console.log("[CheerioScraper] Price element not found.");
      }


      // Title extraction
      let title = extract([
        'h1', '.product-title', '.product-name', '.pdp-title', '.product_title',
        '[itemprop="name"]', 'meta[property="og:title"]', 'meta[name="twitter:title"]'
      ], 'content');
      if (!title) title = extract(['h1', '.product-title', '.product-name', '.pdp-title', '.product_title']);
      if (!title) title = $('title').first().text().trim();
      console.log(`[CheerioScraper] Extracted title: "${title}"`);


      // Image URL extraction
      let imageUrl = extract([
        'meta[property="og:image"]', 'meta[name="twitter:image"]', 
        '.product-image img', '.main-image img', '.gallery-image img', 'img.product-main-image'
      ], 'content');
      if (!imageUrl) imageUrl = extract(['.product-image img', '.main-image img', '.gallery-image img', 'img.product-main-image'], 'src');
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          imageUrl = new URL(imageUrl, args.url).href;
        } catch (e) {
          console.warn(`[CheerioScraper] Could not construct absolute image URL for "${imageUrl}" from base "${args.url}":`, e);
          imageUrl = ''; // Clear if invalid
        }
      }
      console.log(`[CheerioScraper] Extracted image URL: "${imageUrl}"`);

      // Description extraction
      let description = extract([
        'meta[property="og:description"]', 'meta[name="description"]', 'meta[name="twitter:description"]',
        '.product-description', '.description', '.short-description', '[itemprop="description"]'
      ], 'content');
      if (!description) description = extract(['.product-description', '.description', '.short-description', '[itemprop="description"]']);
      console.log(`[CheerioScraper] Extracted description (raw): "${description.substring(0,100)}..."`);


      // Brand extraction
      let brand = extract([
        '[itemprop="brand"] [itemprop="name"]', '[data-brand]',
        'meta[property="product:brand"]'
      ], 'content');
      if (!brand) brand = extract(['[itemprop="brand"]', '.product-brand', '.brand-name']);
      console.log(`[CheerioScraper] Extracted brand: "${brand}"`);


      const productData = {
        title: title.substring(0, 200),
        price: isNaN(price) ? 0 : price, // Ensure price is a number
        imageUrl: imageUrl.substring(0, 1000), // Limit URL length
        description: description.substring(0, 1000), // Limit description length
        brand: brand.substring(0, 100),
      };
      
      console.log("[CheerioScraper] Extracted data:", productData);

      if (!productData.title && !productData.price) {
         console.log("[CheerioScraper] Failed to extract significant data.");
         return { success: false, error: "Could not extract significant product data.", ...productData };
      }

      return {
        success: true,
        ...productData
      };

    } catch (error: any) {
      console.error('[CheerioScraper] Scraping error:', error);
      return {
        success: false,
        error: error.message ? error.message : 'Unknown scraping error',
        title: '', price: 0, imageUrl: '', description: '', brand: ''
      };
    }
  },
});
