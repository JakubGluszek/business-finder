# @business-finder/core

A TypeScript library for finding businesses without proper websites using the Google Maps API. Perfect for identifying potential clients for web development services or market research.

## Features

- 🔍 Search for businesses by type within a specified radius
- 🌐 Identify businesses with no website or only social media presence
- 📍 Get detailed place information including ratings, reviews, and contact details
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

## API Reference

### BusinessFinder Class

The main class for finding businesses.

```typescript
const finder = new BusinessFinder(apiKey: string, options?: Partial<SearchOptions>);
```

#### Methods

- `findBusinessesWithoutWebsites(overrides?: Partial<SearchOptions>): Promise<BusinessResult[]>`
- `findAllBusinesses(overrides?: Partial<SearchOptions>): Promise<BusinessResult[]>`
- `updateConfig(updates: Partial<SearchOptions>): void`
- `getConfig(): Required<SearchOptions>`

### Standalone Functions

```typescript
import { findBusinessesWithoutWebsites, findAllBusinesses } from '@business-finder/core';

// Find businesses without websites
const businesses = await findBusinessesWithoutWebsites('YOUR_API_KEY', {
  location: { lat: 40.7128, lng: -74.0060 },
  radius: 10000,
  businessTypes: ['restaurant']
});

// Find all businesses
const allBusinesses = await findAllBusinesses('YOUR_API_KEY', options);
```

### Configuration Options

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
}
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

## Advanced Usage

### React Example

```typescript
import React, { useState } from 'react';
import { BusinessFinder, BusinessResult } from '@business-finder/core';

function BusinessSearch() {
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const searchBusinesses = async () => {
    setLoading(true);
    try {
      const finder = new BusinessFinder(process.env.REACT_APP_GOOGLE_MAPS_API_KEY!, {
        location: { lat: 40.7128, lng: -74.0060 }, // NYC
        radius: 15000,
        businessTypes: ['restaurant', 'cafe']
      });
      
      const results = await finder.findBusinessesWithoutWebsites();
      setBusinesses(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={searchBusinesses} disabled={loading}>
        {loading ? 'Searching...' : 'Search Businesses'}
      </button>
      
      {businesses.map(business => (
        <div key={business.place_id}>
          <h3>{business.name}</h3>
          <p>{business.address}</p>
          <p>Rating: {business.rating}/5 ({business.totalRatings} reviews)</p>
        </div>
      ))}
    </div>
  );
}
```

### Custom Configuration

```typescript
const finder = new BusinessFinder('YOUR_API_KEY', {
  location: { lat: 52.5200, lng: 13.4050 }, // Berlin
  radius: 25000, // 25km
  businessTypes: ['restaurant', 'cafe', 'bar', 'night_club'],
  socialMediaDomains: ['facebook.com', 'instagram.com', 'twitter.com'],
  batchSize: 10, // Process 10 places at once
  batchDelay: 300 // Wait 300ms between batches
});

// Search with temporary overrides
const results = await finder.findBusinessesWithoutWebsites({
  radius: 10000, // Override to 10km for this search
  businessTypes: ['gym', 'beauty_salon'] // Override business types
});
```

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
