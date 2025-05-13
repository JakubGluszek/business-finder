# Google Maps Business Search

A Node.js application that uses the Google Maps API to find businesses without proper websites.

## Features

- Search for businesses within a specified radius
- Filter businesses by type (restaurant, store, cafe, etc.)
- Identify businesses that:
  - Have no website
  - Only use social media (Facebook, Instagram) as their website

## Prerequisites

- Node.js
- pnpm
- Google Maps API key

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/google-maps-business-search.git
cd google-maps-business-search
```

2. Install dependencies:
```
pnpm install
```

3. Create a `.env` file in the root directory and add your Google Maps API key:
```
GOOGLE_API_KEY=your_api_key_here
```

## Usage

Modify the parameters in `src/index.ts` to customize your search:

```typescript
// Define the search parameters
const location = { lat: 52.2297, lng: 21.0122 }; // Warsaw, Poland
const radius = 5000; // 5km radius
const businessType = "restaurant"; // Change to 'store', 'cafe', etc. as needed
```

Run the application:
```
pnpm start
```

The output will display a list of businesses that don't have proper websites.

## License

MIT 