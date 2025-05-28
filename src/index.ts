import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { GoogleMapsService } from "./services/googleMapsService.js";
import {
  logSearchParameters,
  logSearchResults,
  formatElapsedTime,
  exportToMarkdown,
  logAllBusinesses,
} from "./utils/logger.js";
import { SearchOptions, BusinessResult, GeoLocation } from "./types.js";
import { fileURLToPath } from "url";
import chalk from "chalk";

/**
 * Default configuration for the search
 */
const DEFAULT_CONFIG: SearchOptions = {
  location: { lat: 49.8220544, lng: 19.0319995 }, // Bielsko-Biała, Poland
  radius: 20000, // 20km radius
  apiKey: process.env.GOOGLE_API_KEY,
  businessTypes: ["car_repair"],
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

/**
 * Searches for businesses based on the specified mode (either without websites or all businesses).
 * @param options - Configuration options from CLI and defaults
 * @param mode - 'no-website' or 'all'
 * @returns Array of business results
 */
async function findBusinesses(
  options: SearchOptions,
  mode: "no-website" | "all",
): Promise<BusinessResult[]> {
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
    throw new Error("Google Maps API key is required. Set GOOGLE_API_KEY in .env or use --apiKey option.");
  }
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error("Location with valid lat and lng is required. Use --lat and --lng options.");
  }
  if (!radius || radius <= 0) {
    throw new Error("Search radius must be a positive number. Use --radius option.");
  }
  if (!businessTypes || businessTypes.length === 0) {
    throw new Error("At least one business type is required. Use --businessTypes option (comma-separated).");
  }

  logSearchParameters(location, radius, businessTypes);

  const mapsService = new GoogleMapsService(apiKey);
  const foundBusinesses: BusinessResult[] = [];

  try {
    await Promise.all(
      [...businessTypes].map(async (placeType) => {
        try {
          const places = await mapsService.searchNearbyPlaces(
            location,
            radius,
            placeType,
          );

          if (places.length === 0) {
            console.log(`No ${placeType} places found in the area.`);
            return;
          }

          console.log(
            `Found ${places.length} ${placeType} places. Checking details...`,
          );

          for (let i = 0; i < places.length; i += batchSize) {
            const batch = places.slice(i, i + batchSize);
            
            // In 'all' mode, we don't filter by website status here,
            // we pass 'all' to processBatch which then skips the socialMediaDomains check.
            // In 'no-website' mode, it behaves as before.
            const filterModeForBatch = mode === "all" ? "all" : socialMediaDomains;

            const results = await mapsService.processBatch(
              batch,
              placeType as string,
              filterModeForBatch as readonly string[] | "all", // Pass mode or socialMediaDomains for filtering
            );

            if (results.length > 0) {
              foundBusinesses.push(...results);
            }

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

    return foundBusinesses;
  } catch (error) {
    console.error(
      `Error in findBusinesses (${mode} mode):`,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Main function to parse CLI arguments and run the search
 */
async function main(): Promise<void> {
  const yargsInstance = yargs(hideBin(process.argv));

  const argv = await yargsInstance
    .option("mode", {
      alias: "m",
      type: "string",
      description: "Search mode: 'no-website' or 'all'",
      choices: ["no-website", "all"],
      default: "no-website",
    })
    .option("lat", {
      type: "number",
      description: "Latitude for search center",
      default: DEFAULT_CONFIG.location?.lat,
    })
    .option("lng", {
      type: "number",
      description: "Longitude for search center",
      default: DEFAULT_CONFIG.location?.lng,
    })
    .option("radius", {
      alias: "r",
      type: "number",
      description: "Search radius in meters",
      default: DEFAULT_CONFIG.radius,
    })
    .option("businessTypes", {
      alias: "t",
      type: "string",
      description: "Comma-separated list of business types (e.g., 'car_repair,restaurant')",
      default: DEFAULT_CONFIG.businessTypes?.join(",") || "restaurant", // Default to restaurant if not in default config
    })
    .option("apiKey", {
      type: "string",
      description: "Google Maps API Key",
      default: process.env.GOOGLE_API_KEY,
    })
    .option("socialMediaDomains", {
        type: "string",
        description: "Comma-separated list of social media domains to check against for 'no-website' mode",
        default: DEFAULT_CONFIG.socialMediaDomains?.join(","),
    })
    .option("batchSize", {
        type: "number",
        description: "Number of place details to fetch in a single batch",
        default: DEFAULT_CONFIG.batchSize,
    })
    .option("batchDelay", {
        type: "number",
        description: "Delay in milliseconds between batches",
        default: DEFAULT_CONFIG.batchDelay,
    })
    .option("export", {
        alias: "e",
        type: "boolean",
        description: "Export results to a Markdown file",
        default: process.env.EXPORT_RESULTS === 'true' || false,
    })
    .help()
    .alias("help", "h")
    .parseAsync();

  // Check if any actual arguments were passed by the user
  // hideBin(process.argv) gives us the arguments after the script name
  if (hideBin(process.argv).length === 0) {
    console.log(chalk.yellow("No command-line arguments provided. Displaying help:\n"));
    yargsInstance.showHelp(); // Display the help screen
    return; // Exit without running the main logic
  }

  try {
    const startTime = Date.now();

    const searchOptions: SearchOptions = {
      location: { lat: argv.lat!, lng: argv.lng! } as GeoLocation,
      radius: argv.radius,
      apiKey: argv.apiKey,
      businessTypes: argv.businessTypes?.split(",").map(bt => bt.trim()) || [],
      socialMediaDomains: argv.socialMediaDomains?.split(",").map(d => d.trim()) || [],
      batchSize: argv.batchSize,
      batchDelay: argv.batchDelay,
    };

    const businesses = await findBusinesses(searchOptions, argv.mode as "no-website" | "all");
    const elapsedTime = formatElapsedTime(startTime);

    if (argv.mode === "no-website") {
      logSearchResults(businesses, elapsedTime);
    } else {
      // Assuming you'll add a logAllBusinesses function or adapt logSearchResults
      logAllBusinesses(businesses, elapsedTime);
    }

    if (argv.export && businesses.length > 0) {
      exportToMarkdown(businesses, elapsedTime, argv.mode); // Pass mode to export function
    }
  } catch (error) {
    console.error(
      chalk.red("Error running search:"), // Added chalk for consistency
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

// Export functions for potential programmatic use (though main CLI is primary)
export { findBusinesses, main };
