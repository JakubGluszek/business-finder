import { BusinessResult, PlaceDetails } from "../types.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";

/**
 * Formats and logs search parameters
 * @param location - Geographic location coordinates
 * @param radius - Search radius in meters
 * @param businessTypes - Array of business types being searched
 */
export function logSearchParameters(
  location: { lat: number; lng: number },
  radius: number,
  businessTypes: readonly any[],
): void {
  console.log(chalk.blue.bold("\n🔍 Search Parameters:  "));
  console.log(chalk.blue(`Location: ${location.lat}, ${location.lng}  `));
  console.log(chalk.blue(`Radius: ${radius / 1000} km  `));
  console.log(chalk.blue(`Business Types: ${businessTypes.join(", ")}\n  `));
}

/**
 * Logs a summary of search results
 * @param businesses - Array of found businesses
 * @param elapsedTime - Time taken for the search operation
 */
export function logSearchResults(
  businesses: BusinessResult[],
  elapsedTime?: string,
): void {
  if (businesses.length === 0) {
    console.log(chalk.yellow("\nNo businesses found without proper websites."));
    return;
  }

  console.log(
    chalk.green.bold(
      `\n✅ Found ${businesses.length} businesses without proper websites:  `,
    ),
  );

  // Group businesses by type for better readability
  const groupedByType = groupBusinessesByType(businesses);

  Object.entries(groupedByType).forEach(([type, businessList]) => {
    console.log(
      chalk.cyan(`\n${formatBusinessType(type)} (${businessList.length}):  `),
    );

    businessList.forEach((business) => {
      const status = business.hasNoWebsite
        ? chalk.red("No website")
        : chalk.yellow("Social media only");

      console.log(`- ${chalk.white.bold(business.name)} (${status})  `);

      if (business.address) {
        console.log(`  ${chalk.gray("📍")} ${chalk.gray(business.address)}  `);
      }

      if (business.phone) {
        console.log(`  ${chalk.gray("📞")} ${chalk.gray(business.phone)}  `);
      }

      if (business.rating) {
        const stars = "⭐".repeat(Math.round(business.rating));
        console.log(
          `  ${chalk.gray(stars)} ${chalk.gray(`${business.rating}/5 (${business.totalRatings} reviews)`)}  `,
        );
      }

      if (business.website) {
        console.log(`  ${chalk.gray("🔗")} ${chalk.gray(business.website)}  `);
      }
    });
  });

  // Output statistics
  const noWebsiteCount = businesses.filter((b) => b.hasNoWebsite).length;
  const socialOnlyCount = businesses.filter((b) => b.hasSocialOnly).length;

  console.log(chalk.blue.bold("\n📊 Summary:  "));
  console.log(
    chalk.blue(
      `• Total businesses without proper websites: ${businesses.length}  `,
    ),
  );
  console.log(chalk.blue(`• Businesses with no website: ${noWebsiteCount}  `));
  console.log(
    chalk.blue(`• Businesses with social media only: ${socialOnlyCount}  `),
  );

  if (elapsedTime) {
    console.log(chalk.blue(`• Search completed in: ${elapsedTime}  `));
  }
}

/**
 * Formats a business type string to be more readable
 * @param type - Business type string
 * @returns Formatted business type string
 */
export function formatBusinessType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Organizes business results by type
 * @param businesses - Array of business results
 * @returns Record with business types as keys and arrays of businesses as values
 */
export function groupBusinessesByType(
  businesses: BusinessResult[],
): Record<string, BusinessResult[]> {
  return businesses.reduce<Record<string, BusinessResult[]>>(
    (acc, business) => {
      if (!acc[business.type]) {
        acc[business.type] = [];
      }
      acc[business.type].push(business);
      return acc;
    },
    {},
  );
}

/**
 * Extracts place details into a standardized format
 * @param placeDetails - Place details from Google Maps API
 * @param placeType - Type of the place
 * @param socialMediaDomains - Array of social media domains to check against
 * @returns Formatted business result object
 */
export function extractBusinessDetails(
  placeDetails: PlaceDetails,
  placeType: string,
  socialMediaDomains: readonly string[],
): BusinessResult | null {
  const {
    name,
    website,
    formatted_address,
    formatted_phone_number,
    rating,
    user_ratings_total,
  } = placeDetails;

  if (!name) return null;

  const hasWebsite = Boolean(website);
  const hasSocialMediaOnly =
    hasWebsite &&
    socialMediaDomains.some((domain) => website?.includes(domain));

  // Only include businesses with no website or just social media
  if (hasWebsite && !hasSocialMediaOnly) return null;

  return {
    name,
    type: placeType,
    hasNoWebsite: !hasWebsite,
    hasSocialOnly: hasSocialMediaOnly,
    website: website || undefined,
    address: formatted_address,
    phone: formatted_phone_number,
    rating: rating,
    totalRatings: user_ratings_total,
  };
}

/**
 * Exports search results to a Markdown file
 * @param businesses - Array of found businesses
 * @param elapsedTime - Time taken for the search operation
 * @returns Path to the generated markdown file
 */
export function exportToMarkdown(
  businesses: BusinessResult[],
  elapsedTime?: string,
): string {
  if (businesses.length === 0) {
    console.log(chalk.yellow("\nNo businesses to export."));
    return "";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.join(process.cwd(), "results");
  const outputPath = path.join(outputDir, `search-results-${timestamp}.md`);

  // Create results directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Group businesses by type
  const groupedByType = groupBusinessesByType(businesses);

  // Build markdown content
  let markdown = `# Business Search Results\n\n`;
  markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  // Add summary section
  const noWebsiteCount = businesses.filter((b) => b.hasNoWebsite).length;
  const socialOnlyCount = businesses.filter((b) => b.hasSocialOnly).length;
  
  markdown += `## 📊 Summary\n\n`;
  markdown += `- **Total businesses without proper websites**: ${businesses.length}\n`;
  markdown += `- **Businesses with no website**: ${noWebsiteCount}\n`;
  markdown += `- **Businesses with social media only**: ${socialOnlyCount}\n`;
  
  if (elapsedTime) {
    markdown += `- **Search completed in**: ${elapsedTime}\n`;
  }
  
  markdown += `\n## 🔍 Search Results\n`;

  // Add business listings grouped by type
  Object.entries(groupedByType).forEach(([type, businessList]) => {
    markdown += `\n### ${formatBusinessType(type)} (${businessList.length})\n\n`;

    businessList.forEach((business) => {
      const status = business.hasNoWebsite ? "⛔ No website" : "🔗 Social media only";
      markdown += `#### ${business.name} (${status})\n\n`;

      if (business.address) {
        markdown += `- **Address**: ${business.address}\n`;
      }

      if (business.phone) {
        markdown += `- **Phone**: ${business.phone}\n`;
      }

      if (business.rating) {
        const stars = "⭐".repeat(Math.round(business.rating));
        markdown += `- **Rating**: ${stars} ${business.rating}/5 (${business.totalRatings} reviews)\n`;
      }

      if (business.website) {
        markdown += `- **Website**: [${business.website}](${business.website})\n`;
      }
      
      markdown += `\n`;
    });
  });

  // Save to file
  fs.writeFileSync(outputPath, markdown);
  console.log(chalk.green(`\n✅ Results exported to: ${outputPath}`));
  
  return outputPath;
}

/**
 * Formats elapsed time in milliseconds to a human-readable string
 * @param startTime - Start time in milliseconds
 * @returns Formatted time string
 */
export function formatElapsedTime(startTime: number): string {
  const elapsed = Date.now() - startTime;

  if (elapsed < 1000) {
    return `${elapsed}ms`;
  }

  if (elapsed < 60000) {
    return `${(elapsed / 1000).toFixed(2)}s`;
  }

  const minutes = Math.floor(elapsed / 60000);
  const seconds = ((elapsed % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}
