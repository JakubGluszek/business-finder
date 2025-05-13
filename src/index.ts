import "dotenv/config";
import { Client } from "@googlemaps/google-maps-services-js";

// Initialize the Google Maps client
const gmaps = new Client({});

// Define the search parameters
const location = { lat: 52.2297, lng: 21.0122 }; // Warsaw, Poland
const radius = 5000; // 5km radius
const businessType = "restaurant"; // Change to 'store', 'cafe', etc. as needed

// Main async function to search for businesses
async function findBusinessesWithoutWebsites(): Promise<void> {
  try {
    // Perform Nearby Search
    const response = await gmaps.placesNearby({
      params: {
        location,
        radius,
        type: businessType,
        key: process.env.GOOGLE_API_KEY || "YOUR_API_KEY", // Replace with your API key
      },
    });

    const places = response.data.results;
    const noWebsiteBusinesses: string[] = [];

    // Iterate through places to check website details
    for (const place of places) {
      if (!place.place_id) continue;
      const detailsResponse = await gmaps.placeDetails({
        params: {
          place_id: place.place_id,
          fields: ["website"],
          key: process.env.GOOGLE_API_KEY || "YOUR_API_KEY",
        },
      });

      const website: string | undefined = detailsResponse.data.result.website;

      // Check if website is missing or points to social media
      if (
        (!website ||
          website.includes("facebook.com") ||
          website.includes("instagram.com")) &&
        place.name
      ) {
        noWebsiteBusinesses.push(place.name);
      }
    }

    // Output results
    if (noWebsiteBusinesses.length > 0) {
      console.log("Businesses without proper websites:", noWebsiteBusinesses);
    } else {
      console.log("No businesses found without proper websites.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
findBusinessesWithoutWebsites();
