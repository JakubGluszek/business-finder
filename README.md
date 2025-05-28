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

Run the application using the CLI:

```bash
node dist/index.js <command> [options]
```

Or, during development:

```bash
tsx src/index.ts <command> [options]
# or using ts-node-esm if you aliased it or have it in your path
# ts-node-esm src/index.ts <command> [options]
```

**Note:** Ensure your `.env` file is set up with `GOOGLE_API_KEY` or provide it via the `--apiKey` option.

### Commands and Options

*   **`--mode <mode>` (or `-m <mode>`)**: Specifies the search mode.
    *   `no-website` (default): Finds businesses with no website or only a social media presence.
    *   `all`: Finds all businesses matching the criteria, regardless of website status.
*   **`--lat <latitude>`**: Latitude for the search center (e.g., `49.8220544`). Defaults to Bielsko-Biała, Poland.
*   **`--lng <longitude>`**: Longitude for the search center (e.g., `19.0319995`). Defaults to Bielsko-Biała, Poland.
*   **`--radius <meters>` (or `-r <meters>`)**: Search radius in meters (e.g., `20000` for 20km). Defaults to 20000.
*   **`--businessTypes <types>` (or `-t <types>`)**: Comma-separated list of business types (e.g., `car_repair,restaurant`). Defaults to `restaurant`.
*   **`--apiKey <key>`**: Your Google Maps API key. Overrides the key in the `.env` file.
*   **`--socialMediaDomains <domains>`**: Comma-separated list of social media domains (e.g., `facebook.com,instagram.com`) for the `no-website` mode. Defaults to a predefined list.
*   **`--batchSize <number>`**: Number of place details to fetch concurrently. Defaults to 5.
*   **`--batchDelay <milliseconds>`**: Delay between batches of place detail requests. Defaults to 200ms.
*   **`--export` (or `-e`)**: Export results to a Markdown file in the `results/` directory. Defaults to `false` (or the value of `EXPORT_RESULTS` in `.env`).
*   **`--help` (or `-h`)**: Show help information.

### Examples

1.  **Find restaurants and cafes without websites in a 5km radius around a specific location:**
    ```bash
    node dist/index.js --lat 50.0647 --lng 19.9450 --radius 5000 --businessTypes "restaurant,cafe" --mode no-website
    ```

2.  **Find all car repair shops within a 20km radius of Bielsko-Biała (using defaults) and export results:**
    ```bash
    node dist/index.js --businessTypes "car_repair" --mode all --export
    ```

3.  **Using development environment to find all gyms with a custom API key:**
    ```bash
    tsx src/index.ts -t gym -m all --apiKey YOUR_GOOGLE_API_KEY_HERE
    ```

### Modifying Default Search Parameters

While most parameters are now configurable via CLI options, some base defaults (like the default location if none is provided, or the list of social media domains) are still in `src/index.ts` in the `DEFAULT_CONFIG` object. You can modify these there if needed.

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
# or, for more direct control if you prefer tsx:
# tsx watch src/index.ts -- --your-cli-options-here
```

## Requirements

- Node.js 18 or higher
- Google Maps API key with Places API enabled

## License

MIT
