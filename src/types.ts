/**
 * Geographic location coordinates
 */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Location with its own radius setting
 */
export interface LocationWithRadius {
  location: GeoLocation;
  radius: number;
  name?: string; // Optional name for the location (e.g., "Warsaw", "Krakow")
}

/**
 * Search options for the Google Maps API
 */
export interface SearchOptions {
  location?: GeoLocation;
  radius?: number;
  apiKey?: string;
  businessTypes?: readonly BusinessType[] | BusinessType[];
  socialMediaDomains?: readonly string[] | string[];
  batchSize?: number;
  batchDelay?: number;
}

/**
 * Multi-location search options
 */
export interface MultiLocationSearchOptions {
  locations: LocationWithRadius[];
  apiKey?: string;
  businessTypes?: readonly BusinessType[] | BusinessType[];
  socialMediaDomains?: readonly string[] | string[];
  batchSize?: number;
  batchDelay?: number;
}

/**
 * Business type for Google Maps API
 */
export type BusinessType = PlaceType2 | string;

/**
 * Business information including details from Place API
 */
export interface BusinessResult {
  name: string;
  type: string;
  hasNoWebsite: boolean;
  hasSocialOnly: boolean;
  website?: string;
  address?: string;
  phone?: string;
  rating?: number;
  totalRatings?: number;
  latLng?: GeoLocation;
  place_id?: string;
  searchLocation?: string; // Which location this result came from
}

/**
 * Place details from Google Maps API
 */
export interface PlaceDetails {
  name?: string;
  website?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: {
    location?: GeoLocation;
  };
  opening_hours?: {
    weekday_text?: string[];
  };
  reviews?: Array<{
    author_name?: string;
    rating?: number;
    text?: string;
    time?: number;
  }>;
}

/**
 * Type definition for PlaceType2 from Google Maps API
 * This is a placeholder - in a real project, you'd import this from Google Maps types
 */
export type PlaceType2 =
  | "accounting"
  | "airport"
  | "amusement_park"
  | "aquarium"
  | "art_gallery"
  | "atm"
  | "bakery"
  | "bank"
  | "bar"
  | "beauty_salon"
  | "bicycle_store"
  | "book_store"
  | "bowling_alley"
  | "bus_station"
  | "cafe"
  | "campground"
  | "car_dealer"
  | "car_rental"
  | "car_repair"
  | "car_wash"
  | "casino"
  | "cemetery"
  | "church"
  | "city_hall"
  | "clothing_store"
  | "convenience_store"
  | "courthouse"
  | "dentist"
  | "department_store"
  | "doctor"
  | "drugstore"
  | "electrician"
  | "electronics_store"
  | "embassy"
  | "fire_station"
  | "florist"
  | "funeral_home"
  | "furniture_store"
  | "gas_station"
  | "gym"
  | "hair_care"
  | "hardware_store"
  | "hindu_temple"
  | "home_goods_store"
  | "hospital"
  | "insurance_agency"
  | "jewelry_store"
  | "laundry"
  | "lawyer"
  | "library"
  | "light_rail_station"
  | "liquor_store"
  | "local_government_office"
  | "locksmith"
  | "lodging"
  | "meal_delivery"
  | "meal_takeaway"
  | "mosque"
  | "movie_rental"
  | "movie_theater"
  | "moving_company"
  | "museum"
  | "night_club"
  | "painter"
  | "park"
  | "parking"
  | "pet_store"
  | "pharmacy"
  | "physiotherapist"
  | "plumber"
  | "police"
  | "post_office"
  | "primary_school"
  | "real_estate_agency"
  | "restaurant"
  | "roofing_contractor"
  | "rv_park"
  | "school"
  | "secondary_school"
  | "shoe_store"
  | "shopping_mall"
  | "spa"
  | "stadium"
  | "storage"
  | "store"
  | "subway_station"
  | "supermarket"
  | "synagogue"
  | "taxi_stand"
  | "tourist_attraction"
  | "train_station"
  | "transit_station"
  | "travel_agency"
  | "university"
  | "veterinary_care"
  | "zoo";
