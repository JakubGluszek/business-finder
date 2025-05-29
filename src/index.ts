import { GoogleMapsService } from "./services/googleMapsService.js";
import {
  SearchOptions,
  MultiLocationSearchOptions,
  BusinessResult,
} from "./types.js";

/**
 * Default configuration for the search
 */
export const DEFAULT_CONFIG: Required<Omit<SearchOptions, 'apiKey'>> = {
  location: { lat: 49.8220544, lng: 19.0319995 }, // Bielsko-Biała, Poland
  radius: 20000, // 20km radius
  businessTypes: ["car_repair", "auto_parts_store", "car_dealer", "car_wash"],
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
 * BusinessFinder class - Main API for finding businesses
 */
export class BusinessFinder {
  private mapsService: GoogleMapsService;
  private config: Required<SearchOptions>;

  constructor(apiKey: string, options: Partial<SearchOptions> = {}) {
    if (!apiKey) {
      throw new Error("Google Maps API key is required");
    }

    this.config = {
      ...DEFAULT_CONFIG,
      apiKey,
      ...options,
    };

    this.mapsService = new GoogleMapsService(apiKey);
  }

  /**
   * Find businesses without proper websites
   * @param overrides - Optional overrides for search configuration
   * @returns Array of businesses without proper websites
   */
  async findBusinessesWithoutWebsites(
    overrides: Partial<SearchOptions> = {}
  ): Promise<BusinessResult[]> {
    const searchConfig = { ...this.config, ...overrides };
    return this.searchBusinesses(searchConfig, "no-website");
  }

  /**
   * Find all businesses matching the criteria
   * @param overrides - Optional overrides for search configuration
   * @returns Array of all businesses found
   */
  async findAllBusinesses(
    overrides: Partial<SearchOptions> = {}
  ): Promise<BusinessResult[]> {
    const searchConfig = { ...this.config, ...overrides };
    return this.searchBusinesses(searchConfig, "all");
  }

  /**
   * Search for businesses across multiple locations asynchronously
   * @param options - Multi-location search options
   * @param mode - Search mode ('no-website' or 'all')
   * @returns Array of business results from all locations
   */
  async searchMultipleLocations(
    options: MultiLocationSearchOptions,
    mode: "no-website" | "all"
  ): Promise<BusinessResult[]> {
    const {
      locations,
      businessTypes = this.config.businessTypes,
      socialMediaDomains = this.config.socialMediaDomains,
      batchSize = this.config.batchSize,
      batchDelay = this.config.batchDelay,
    } = options;

    if (!locations || locations.length === 0) {
      throw new Error("At least one location is required");
    }

    const allResults: BusinessResult[] = [];
    const foundBusinessIds = new Set<string>();

    // Search all locations concurrently
    await Promise.all(
      locations.map(async (locationWithRadius) => {
        const { location, radius, name: locationName } = locationWithRadius;
        
        // Search all business types for this location concurrently
        await Promise.all(
          businessTypes.map(async (placeType) => {
            try {
              const places = await this.mapsService.searchNearbyPlaces(
                location,
                radius,
                placeType
              );

              if (places.length === 0) {
                return;
              }

              for (let i = 0; i < places.length; i += batchSize) {
                const batch = places.slice(i, i + batchSize);
                const filterModeForBatch = mode === "all" ? "all" : socialMediaDomains;

                const results = await this.mapsService.processBatch(
                  batch,
                  placeType as string,
                  filterModeForBatch as readonly string[] | "all",
                  locationName
                );

                if (results.length > 0) {
                  results.forEach((business) => {
                    if (business.place_id && !foundBusinessIds.has(business.place_id)) {
                      allResults.push(business);
                      foundBusinessIds.add(business.place_id);
                    } else if (!business.place_id) {
                      allResults.push(business);
                    }
                  });
                }

                if (i + batchSize < places.length) {
                  await new Promise((resolve) => setTimeout(resolve, batchDelay));
                }
              }
            } catch (error) {
              throw new Error(
                `Error processing place type ${placeType} for location ${locationName || 'unnamed'}: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          })
        );
      })
    );

    return allResults;
  }

  /**
   * Search for businesses based on configuration and mode
   * @param options - Search configuration
   * @param mode - Search mode ('no-website' or 'all')
   * @returns Array of business results
   */
  async searchBusinesses(
    options: Required<SearchOptions>,
    mode: "no-website" | "all"
  ): Promise<BusinessResult[]> {
    const {
      location,
      radius,
      businessTypes,
      socialMediaDomains,
      batchSize,
      batchDelay,
    } = options;

    this.validateSearchOptions(options);

    const foundBusinesses: BusinessResult[] = [];
    const foundBusinessIds = new Set<string>();

    try {
      await Promise.all(
        businessTypes.map(async (placeType) => {
          try {
            const places = await this.mapsService.searchNearbyPlaces(
              location,
              radius,
              placeType
            );

            if (places.length === 0) {
              return;
            }

            for (let i = 0; i < places.length; i += batchSize) {
              const batch = places.slice(i, i + batchSize);
              const filterModeForBatch = mode === "all" ? "all" : socialMediaDomains;

              const results = await this.mapsService.processBatch(
                batch,
                placeType as string,
                filterModeForBatch as readonly string[] | "all"
              );

              if (results.length > 0) {
                results.forEach((business) => {
                  if (business.place_id && !foundBusinessIds.has(business.place_id)) {
                    foundBusinesses.push(business);
                    foundBusinessIds.add(business.place_id);
                  } else if (!business.place_id) {
                    foundBusinesses.push(business);
                  }
                });
              }

              if (i + batchSize < places.length) {
                await new Promise((resolve) => setTimeout(resolve, batchDelay));
              }
            }
          } catch (error) {
            throw new Error(
              `Error processing place type ${placeType}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        })
      );

      return foundBusinesses;
    } catch (error) {
      throw new Error(
        `Error in searchBusinesses (${mode} mode): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update the configuration
   * @param updates - Partial configuration updates
   */
  updateConfig(updates: Partial<SearchOptions>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   * @returns Current search configuration
   */
  getConfig(): Required<SearchOptions> {
    return { ...this.config };
  }

  /**
   * Validate search options
   * @param options - Search options to validate
   */
  private validateSearchOptions(options: Required<SearchOptions>): void {
    const { location, radius, businessTypes } = options;

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      throw new Error("Location with valid lat and lng is required");
    }
    if (!radius || radius <= 0) {
      throw new Error("Search radius must be a positive number");
    }
    if (!businessTypes || businessTypes.length === 0) {
      throw new Error("At least one business type is required");
    }
  }
}

/**
 * Standalone function for finding businesses without websites
 * @param apiKey - Google Maps API key
 * @param options - Search options
 * @returns Array of businesses without proper websites
 */
export async function findBusinessesWithoutWebsites(
  apiKey: string,
  options: SearchOptions
): Promise<BusinessResult[]> {
  const finder = new BusinessFinder(apiKey, options);
  return finder.findBusinessesWithoutWebsites();
}

/**
 * Standalone function for finding all businesses
 * @param apiKey - Google Maps API key
 * @param options - Search options
 * @returns Array of all businesses found
 */
export async function findAllBusinesses(
  apiKey: string,
  options: SearchOptions
): Promise<BusinessResult[]> {
  const finder = new BusinessFinder(apiKey, options);
  return finder.findAllBusinesses();
}

/**
 * Standalone function for finding businesses without websites across multiple locations
 * @param apiKey - Google Maps API key
 * @param options - Multi-location search options
 * @returns Array of businesses without proper websites from all locations
 */
export async function findBusinessesWithoutWebsitesMultiLocation(
  apiKey: string,
  options: MultiLocationSearchOptions
): Promise<BusinessResult[]> {
  const finder = new BusinessFinder(apiKey);
  return finder.searchMultipleLocations(options, "no-website");
}

/**
 * Standalone function for finding all businesses across multiple locations
 * @param apiKey - Google Maps API key
 * @param options - Multi-location search options
 * @returns Array of all businesses found from all locations
 */
export async function findAllBusinessesMultiLocation(
  apiKey: string,
  options: MultiLocationSearchOptions
): Promise<BusinessResult[]> {
  const finder = new BusinessFinder(apiKey);
  return finder.searchMultipleLocations(options, "all");
}

// Re-export types and services for convenience
export * from "./types.js";
export { GoogleMapsService } from "./services/googleMapsService.js";