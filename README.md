# @business-finder/core

A TypeScript library for finding businesses without proper websites using the Google Maps API. Perfect for identifying potential clients for web development services or market research.

## Features

- 🔍 Search for businesses by type within a specified radius
- 🌐 Identify businesses with no website or only social media presence
- 📍 Get detailed place information including ratings, reviews, and contact details
- 🚀 **Multi-location concurrent search** - Search multiple cities simultaneously
- ⚡ Configurable search parameters and batch processing
- 🔧 TypeScript support with full type definitions
- 📦 Clean API suitable for React/Vue/Angular applications

## Installation

```bash
npm install @business-finder/core
# or
yarn add @business-finder/core
# or
pnpm add @business-finder/core
```

## Quick Start

### Single Location Search

```typescript
import { BusinessFinder } from '@business-finder/core';

const finder = new BusinessFinder('YOUR_GOOGLE_MAPS_API_KEY', {
  location: { lat: 49.8220544, lng: 19.0319995 }, // Bielsko-Biała, Poland
  radius: 20000, // 20km radius
  businessTypes: ['restaurant', 'cafe', 'bar']
});

// Find businesses without websites
const businessesWithoutWebsites = await finder.findBusinessesWithoutWebsites();

// Find all businesses (regardless of website status)
const allBusinesses = await finder.findAllBusinesses();

console.log('Found', businessesWithoutWebsites.length, 'businesses without proper websites');
```

### Multi-Location Search (Recommended)

```typescript
import { findAllBusinessesMultiLocation } from '@business-finder/core';

// Search multiple cities concurrently with different radius for each
const results = await findAllBusinessesMultiLocation('YOUR_GOOGLE_MAPS_API_KEY', {
  locations: [
    { 
      location: { lat: 50.0647, lng: 19.9450 }, // Krakow
      radius: 15000, // 15km
      name: 'Krakow'
    },
    { 
      location: { lat: 52.2297, lng: 21.0122 }, // Warsaw
      radius: 25000, // 25km  
      name: 'Warsaw'
    },
    { 
      location: { lat: 54.3520, lng: 18.6466 }, // Gdansk
      radius: 10000, // 10km
      name: 'Gdansk'
    }
  ],
  businessTypes: ['restaurant', 'cafe', 'bar'],
  batchSize: 10
});

// Results include which city each business was found in
results.forEach(business => {
  console.log(`${business.name} in ${business.searchLocation}`);
});
```

## API Reference

### Multi-Location Functions (Recommended)

Perfect for searching multiple cities at once:

```typescript
import { 
  findAllBusinessesMultiLocation, 
  findBusinessesWithoutWebsitesMultiLocation 
} from '@business-finder/core';

// Find all businesses across multiple locations
const allBusinesses = await findAllBusinessesMultiLocation('YOUR_API_KEY', {
  locations: [
    { location: { lat: 40.7128, lng: -74.0060 }, radius: 20000, name: 'NYC' },
    { location: { lat: 34.0522, lng: -118.2437 }, radius: 15000, name: 'LA' }
  ],
  businessTypes: ['restaurant', 'gym']
});

// Find businesses without websites across multiple locations
const businessesWithoutWebsites = await findBusinessesWithoutWebsitesMultiLocation('YOUR_API_KEY', {
  locations: [
    { location: { lat: 40.7128, lng: -74.0060 }, radius: 20000, name: 'NYC' },
    { location: { lat: 34.0522, lng: -118.2437 }, radius: 15000, name: 'LA' }
  ],
  businessTypes: ['restaurant', 'cafe']
});
```

### BusinessFinder Class

```typescript
const finder = new BusinessFinder(apiKey: string, options?: Partial<SearchOptions>);
```

#### Methods

- `findBusinessesWithoutWebsites(overrides?: Partial<SearchOptions>): Promise<BusinessResult[]>`
- `findAllBusinesses(overrides?: Partial<SearchOptions>): Promise<BusinessResult[]>`
- `searchMultipleLocations(options: MultiLocationSearchOptions, mode: 'no-website' | 'all'): Promise<BusinessResult[]>`
- `updateConfig(updates: Partial<SearchOptions>): void`
- `getConfig(): Required<SearchOptions>`

### Configuration Options

#### Single Location Search

```typescript
interface SearchOptions {
  location?: { lat: number; lng: number };
  radius?: number; // in meters
  apiKey?: string;
  businessTypes?: BusinessType[];
  socialMediaDomains?: string[];
  batchSize?: number;
  batchDelay?: number; // in milliseconds
}
```

#### Multi-Location Search

```typescript
interface MultiLocationSearchOptions {
  locations: LocationWithRadius[];
  apiKey?: string;
  businessTypes?: BusinessType[];
  socialMediaDomains?: string[];
  batchSize?: number;
  batchDelay?: number;
}

interface LocationWithRadius {
  location: { lat: number; lng: number };
  radius: number;
  name?: string; // Optional name for the location
}
```

### Business Result

```typescript
interface BusinessResult {
  name: string;
  type: string;
  hasNoWebsite: boolean;
  hasSocialOnly: boolean;
  website?: string;
  address?: string;
  phone?: string;
  rating?: number;
  totalRatings?: number;
  latLng?: { lat: number; lng: number };
  place_id?: string;
  searchLocation?: string; // Which location this result came from
}
```

## Advanced Usage

### React Example with Multiple Cities

```typescript
import React, { useState } from 'react';
import { findAllBusinessesMultiLocation, BusinessResult } from '@business-finder/core';

function MultiCityBusinessSearch() {
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const searchBusinesses = async () => {
    setLoading(true);
    try {
      const results = await findAllBusinessesMultiLocation(
        process.env.REACT_APP_GOOGLE_MAPS_API_KEY!,
        {
          locations: [
            { location: { lat: 40.7128, lng: -74.0060 }, radius: 15000, name: 'New York' },
            { location: { lat: 34.0522, lng: -118.2437 }, radius: 20000, name: 'Los Angeles' },
            { location: { lat: 41.8781, lng: -87.6298 }, radius: 18000, name: 'Chicago' }
          ],
          businessTypes: ['restaurant', 'cafe', 'bar'],
          batchSize: 8
        }
      );
      
      setBusinesses(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Group businesses by city
  const businessesByCity = businesses.reduce((acc, business) => {
    const city = business.searchLocation || 'Unknown';
    if (!acc[city]) acc[city] = [];
    acc[city].push(business);
    return acc;
  }, {} as Record<string, BusinessResult[]>);
  
  return (
    <div>
      <button onClick={searchBusinesses} disabled={loading}>
        {loading ? 'Searching...' : 'Search Multiple Cities'}
      </button>
      
      {Object.entries(businessesByCity).map(([city, cityBusinesses]) => (
        <div key={city}>
          <h2>{city} ({cityBusinesses.length} businesses)</h2>
          {cityBusinesses.map(business => (
            <div key={business.place_id}>
              <h3>{business.name}</h3>
              <p>{business.address}</p>
              <p>Rating: {business.rating}/5 ({business.totalRatings} reviews)</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Map Integration Example

Perfect for your use case with interactive maps:

```typescript
import { findBusinessesWithoutWebsitesMultiLocation } from '@business-finder/core';

// User selects cities on map with custom radius for each
const selectedLocations = [
  { location: { lat: 50.0647, lng: 19.9450 }, radius: 12000, name: 'Krakow' },
  { location: { lat: 51.1079, lng: 17.0385 }, radius: 8000, name: 'Wroclaw' },
  { location: { lat: 52.4064, lng: 16.9252 }, radius: 6000, name: 'Poznan' }
];

// Fetch businesses for all selected locations
const businesses = await findBusinessesWithoutWebsitesMultiLocation(apiKey, {
  locations: selectedLocations,
  businessTypes: ['restaurant', 'cafe', 'gym', 'beauty_salon']
});

// Save to IndexedDB
await saveToIndexedDB(businesses);
```

### Backend API with Hono

The package works perfectly on the backend too. Here's a Hono server example:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  findAllBusinessesMultiLocation, 
  findBusinessesWithoutWebsitesMultiLocation,
  MultiLocationSearchOptions 
} from '@business-finder/core';

const app = new Hono()
  .use('*', cors())
  // Search businesses across multiple locations
  .post('/api/businesses/search', async (c) => {
    try {
      const body = await c.req.json();
      const { locations, businessTypes, mode = 'no-website' } = body;
      
      if (!locations || !Array.isArray(locations)) {
        return c.json({ error: 'Locations array is required' }, 400);
      }

      const searchOptions: MultiLocationSearchOptions = {
        locations,
        businessTypes: businessTypes || ['restaurant', 'cafe', 'gym'],
        batchSize: 8
      };

      const results = mode === 'all' 
        ? await findAllBusinessesMultiLocation(process.env.GOOGLE_MAPS_API_KEY!, searchOptions)
        : await findBusinessesWithoutWebsitesMultiLocation(process.env.GOOGLE_MAPS_API_KEY!, searchOptions);

      // Group results by location for easier frontend consumption
      const resultsByLocation = results.reduce((acc, business) => {
        const location = business.searchLocation || 'unknown';
        if (!acc[location]) acc[location] = [];
        acc[location].push(business);
        return acc;
      }, {} as Record<string, typeof results>);

      return c.json({
        success: true,
        totalResults: results.length,
        resultsByLocation,
        allResults: results
      });
    } catch (error) {
      console.error('Search error:', error);
      return c.json({ 
        error: 'Search failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  })
  // Get businesses for a single location (quick search)
  .post('/api/businesses/search-single', async (c) => {
    try {
      const { lat, lng, radius = 15000, businessTypes = ['restaurant'] } = await c.req.json();
      
      if (!lat || !lng) {
        return c.json({ error: 'Latitude and longitude are required' }, 400);
      }

      const results = await findBusinessesWithoutWebsitesMultiLocation(
        process.env.GOOGLE_MAPS_API_KEY!,
        {
          locations: [{ location: { lat, lng }, radius, name: 'Search Location' }],
          businessTypes
        }
      );

      return c.json({
        success: true,
        count: results.length,
        businesses: results
      });
    } catch (error) {
      return c.json({ 
        error: 'Search failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  })
  // Health check endpoint
  .get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

export default app;
```

**Frontend Integration with Backend:**

```typescript
// Frontend code calling your Hono API
async function searchBusinesses(selectedLocations: LocationWithRadius[]) {
  const response = await fetch('/api/businesses/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: selectedLocations,
      businessTypes: ['restaurant', 'cafe', 'gym'],
      mode: 'no-website'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Save to IndexedDB
    await saveToIndexedDB(data.allResults);
    
    // Update UI with results grouped by location
    updateMapMarkers(data.resultsByLocation);
  }
}
```

**Environment Setup:**

```bash
# .env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Deploy to Cloudflare Workers:**

```typescript
// worker.ts
import app from './app';

export default {
  fetch: app.fetch,
};
```

## Business Types

Supported business types include:
- `restaurant`, `cafe`, `bar`
- `car_repair`, `car_dealer`, `car_wash`
- `gym`, `beauty_salon`, `hair_care`
- `clothing_store`, `shoe_store`, `jewelry_store`
- `dentist`, `doctor`, `veterinary_care`
- And many more...

See the full list in the `PlaceType2` type definition.

## Requirements

- Node.js 18 or higher
- Google Maps API key with Places API enabled
- TypeScript 5.2+ (for development)

## Setup Google Maps API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Places API"
4. Create credentials (API key)
5. (Optional) Restrict the API key to your domains/IP addresses

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
