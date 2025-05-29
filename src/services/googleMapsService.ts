import "dotenv/config";
import { Client } from "@googlemaps/google-maps-services-js";
import { BusinessResult, PlaceDetails, BusinessType } from "../types.js";
import { extractBusinessDetails } from "../utils/logger.js";

/**
 * Service for interacting with Google Maps API
 */
export class GoogleMapsService {
  private client: Client;

  /**
   * Creates a new GoogleMapsService
   * @param apiKey - Google Maps API key
   */
  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error("Google Maps API key is required");
    }
    this.client = new Client({});
  }

  /**
   * Searches for places near a location based on place type
   * @param location - Geographic coordinates
   * @param radius - Search radius in meters
   * @param placeTypeOrKeyword - Type of place to search for or keyword
   * @returns Array of places found
   */
  async searchNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number,
    placeTypeOrKeyword: BusinessType,
  ): Promise<Array<any>> {
    let allPlaces: Array<any> = [];
    let nextPageToken: string | undefined = undefined;
    const MAX_PAGES = 3; // Google typically allows up to 60 results (20 per page)
    let currentPage = 0;

    try {
      do {
        currentPage++;
        const requestParams: any = {
          location,
          radius,
          keyword: placeTypeOrKeyword as string,
          type: 'car_repair',
          key: this.apiKey,
        };
        if (nextPageToken) {
          requestParams.pagetoken = nextPageToken;
          // As per Google's documentation, a short delay is needed before using a next_page_token
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        }

        const response = await this.client.placesNearby({
          params: requestParams,
          timeout: 10000, // 10 second timeout
        });

        if (response.data.results) {
          allPlaces = allPlaces.concat(response.data.results);
        }
        nextPageToken = response.data.next_page_token;

      } while (nextPageToken && currentPage < MAX_PAGES);

      return allPlaces;
    } catch (error) {
      console.error(
        `Error searching for ${placeTypeOrKeyword} places:`,
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  /**
   * Gets detailed information about a place
   * @param placeId - Google Maps place ID
   * @returns Place details object
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            "name",
            "formatted_address",
            "geometry",
            "rating",
            "user_ratings_total",
            "reviews",
            "opening_hours",
            "website",
            "formatted_phone_number",
          ],
          key: this.apiKey,
        },
        timeout: 10000, // 10 second timeout
      });

      return response.data.result as PlaceDetails;
    } catch (error) {
      console.error(
        `Error fetching details for place ${placeId}:`,
        error instanceof Error ? error.message : String(error),
      );
      return {};
    }
  }

  /**
   * Processes a batch of places to extract details
   * @param places - Array of places to process
   * @param placeType - Type of the places being processed
   * @param socialMediaDomainsOrMode - Array of social media domains or the string "all" to skip filtering
   * @returns Array of businesses without proper websites or all businesses based on mode
   */
  async processBatch(
    places: Array<{ place_id?: string; name?: string }>,
    placeType: string,
    socialMediaDomainsOrMode: readonly string[] | "all",
  ): Promise<BusinessResult[]> {
    const results: BusinessResult[] = [];

    await Promise.all(
      places.map(async (place) => {
        if (!place.place_id) return;

        try {
          const placeDetails = await this.getPlaceDetails(place.place_id);
          const businessDetails = extractBusinessDetails(
            place.place_id,
            placeDetails,
            placeType,
            socialMediaDomainsOrMode,
          );

          if (businessDetails) {
            results.push(businessDetails);
          }
        } catch (error) {
          console.error(
            `Error processing place ${place.name || place.place_id}:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }),
    );

    return results;
  }
}
