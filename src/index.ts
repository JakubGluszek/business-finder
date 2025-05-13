import "dotenv/config";
import { GoogleMapsService } from "./services/googleMapsService.js";
import {
  logSearchParameters,
  logSearchResults,
  formatElapsedTime,
} from "./utils/logger.js";
import { likelyClientTypes } from "./const.js";
import { SearchOptions, BusinessResult } from "./types.js";
import { fileURLToPath } from "url";

/**
 * Default configuration for the search
 */
const DEFAULT_CONFIG: SearchOptions = {
  location: { lat: 49.8220544, lng: 19.0319995 }, // Bielsko-Biała, Poland
  radius: 10000, // 10km radius
  apiKey: process.env.GOOGLE_API_KEY,
  businessTypes: likelyClientTypes,
  socialMediaDomains: [
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "linkedin.com",
    "tiktok.com",
  ],
  batchSize: 5,
  batchDelay: 200, // 200ms delay between batches
};

// Get current file's URL for ESM module detection
const currentFileUrl = import.meta.url;

/**
 * Searches for businesses without proper websites in a given area
 * @param options - Configuration options
 * @returns Array of business results without proper websites
 */
async function findBusinessesWithoutWebsites(
  options: SearchOptions = {},
): Promise<BusinessResult[]> {
  // Merge default config with provided options
  const config = { ...DEFAULT_CONFIG, ...options };
  const {
    location,
    radius,
    apiKey,
    businessTypes,
    socialMediaDomains,
    batchSize = 5,
    batchDelay = 200,
  } = config;

  if (!apiKey) {
    throw new Error("Google Maps API key is required");
  }

  // Log search parameters
  logSearchParameters(location!, radius!, businessTypes!);

  // Initialize the Google Maps service
  const mapsService = new GoogleMapsService(apiKey);
  const noWebsiteBusinesses: BusinessResult[] = [];

  try {
    // Process each business type in parallel with controlled concurrency
    await Promise.all(
      [...businessTypes!].map(async (placeType) => {
        try {
          // Search for places of this type
          const places = await mapsService.searchNearbyPlaces(
            location!,
            radius!,
            placeType,
          );

          if (places.length === 0) {
            console.log(`No ${placeType} places found in the area.`);
            return;
          }

          console.log(
            `Found ${places.length} ${placeType} places. Checking details...`,
          );

          // Batch place details requests with controlled concurrency
          for (let i = 0; i < places.length; i += batchSize) {
            const batch = places.slice(i, i + batchSize);

            const results = await mapsService.processBatch(
              batch,
              placeType as string,
              socialMediaDomains!,
            );

            if (results.length > 0) {
              noWebsiteBusinesses.push(...results);
            }

            // Add a small delay between batches to avoid hitting rate limits
            if (i + batchSize < places.length) {
              await new Promise((resolve) => setTimeout(resolve, batchDelay));
            }
          }
        } catch (error) {
          console.error(
            `Error processing place type ${placeType}:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }),
    );

    return noWebsiteBusinesses;
  } catch (error) {
    console.error(
      "Error in findBusinessesWithoutWebsites:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Main function to run the search and display results
 */
async function main(): Promise<void> {
  try {
    const startTime = Date.now();

    const businesses = await findBusinessesWithoutWebsites();

    const elapsedTime = formatElapsedTime(startTime);

    // Log the search results
    logSearchResults(businesses, elapsedTime);

    // Export the results if needed
    if (businesses.length > 0 && process.env.EXPORT_RESULTS === "true") {
      // Could add export functionality here (CSV, JSON, etc.)
      console.log(`\nResults could be exported to a file.`);
    }
  } catch (error) {
    console.error(
      "Error running search:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script if this file is executed directly
// ESM equivalent of `if (require.main === module)`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

// Export functions for use in other modules
export { findBusinessesWithoutWebsites, main };
