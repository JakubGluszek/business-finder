# Business Finder

A TypeScript application to find businesses without proper websites using the Google Maps API. This tool helps identify potential clients for web development services.

## Features

- Search for businesses by type within a specified radius
- Identify businesses with:

  - No website at all
  - Only social media presence

- Detailed place information including:

  - Name and address
  - Phone number
  - Ratings and reviews
  - Website information

- Colorful console output for easy reading
- Configurable search parameters

## Setup

1. Clone this repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with your Google Maps API key:

   ```
   GOOGLE_API_KEY=your_api_key_here
   EXPORT_RESULTS=false
   ```

4. Build the TypeScript code:

   ```bash
   pnpm run build
   ```

## Usage

Run the application:

```bash
pnpm start
```

### Advanced Usage

You can modify the search parameters in `src/index.ts` to customize:

- Geographic location
- Search radius
- Business types to target
- Social media domains to check

## Project Structure

- `src/index.ts` - Main application entry point
- `src/const.ts` - Constants and configuration values
- `src/types/index.ts` - TypeScript type definitions
- `src/services/googleMapsService.ts` - Google Maps API service
- `src/utils/logger.ts` - Logging and formatting utilities

## Development

Run in development mode with live reload:

```bash
pnpm run dev
```

## Requirements

- Node.js 18 or higher
- Google Maps API key with Places API enabled

## License

MIT
