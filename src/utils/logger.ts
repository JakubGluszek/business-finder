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
 * Extracts place details into a standardized format.
 * If socialMediaDomainsOrMode is "all", it includes all businesses.
 * Otherwise, it filters for businesses with no website or only social media presence.
 * @param placeId - Place ID
 * @param placeDetails - Place details from Google Maps API
 * @param placeType - Type of the place
 * @param socialMediaDomainsOrMode - Array of social media domains to check against, or "all"
 * @returns Formatted business result object or null if filtered out
 */
export function extractBusinessDetails(
  placeId: string,
  placeDetails: PlaceDetails,
  placeType: string,
  socialMediaDomainsOrMode: readonly string[] | "all",
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
  let hasSocialMediaOnly = false;

  if (socialMediaDomainsOrMode !== "all") {
    hasSocialMediaOnly =
      hasWebsite &&
      socialMediaDomainsOrMode.some((domain) => website?.includes(domain));

    // Only include businesses with no website or just social media
    if (hasWebsite && !hasSocialMediaOnly) return null;
  }
  // If mode is "all", we don't filter based on website status, so we proceed.

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
    place_id: placeId,
  };
}

/**
 * Exports search results to a Markdown file
 * @param businesses - Array of found businesses
 * @param elapsedTime - Time taken for the search operation
 * @param mode - The search mode ('no-website' or 'all') to include in the filename
 * @returns Path to the generated markdown file
 */
export function exportToMarkdown(
  businesses: BusinessResult[],
  elapsedTime?: string,
  mode?: string,
): string {
  if (businesses.length === 0) {
    console.log(chalk.yellow("\nNo businesses to export."));
    return "";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const modeString = mode ? `-${mode}` : "";
  const outputDir = path.join(process.cwd(), "results");
  const outputPath = path.join(outputDir, `search-results${modeString}-${timestamp}.md`);

  // Create results directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Group businesses by type
  const groupedByType = groupBusinessesByType(businesses);

  // Build markdown content
  let markdownContent = `# Search Results (Mode: ${mode || 'default'})\n\n`;
  markdownContent += `*Generated on: ${new Date().toLocaleString()}*\n`;
  
  // Add summary section
  const noWebsiteCount = businesses.filter((b) => b.hasNoWebsite).length;
  const socialOnlyCount = businesses.filter((b) => b.hasSocialOnly).length;
  
  markdownContent += `## 📊 Summary\n\n`;
  markdownContent += `- **Total businesses without proper websites**: ${businesses.length}\n`;
  markdownContent += `- **Businesses with no website**: ${noWebsiteCount}\n`;
  markdownContent += `- **Businesses with social media only**: ${socialOnlyCount}\n`;
  
  if (elapsedTime) {
    markdownContent += `- **Search completed in**: ${elapsedTime}\n`;
  }
  
  markdownContent += `\n## 🔍 Search Results\n`;

  // Add business listings grouped by type
  Object.entries(groupedByType).forEach(([type, businessList]) => {
    markdownContent += `\n### ${formatBusinessType(type)} (${businessList.length})\n\n`;

    businessList.forEach((business) => {
      const status = business.hasNoWebsite
        ? "No website"
        : business.hasSocialOnly
        ? "Social media only"
        : business.website
        ? "Has website"
        : "Website status unknown";

      markdownContent += `#### ${business.name} (${status})\n\n`;

      if (business.address) {
        markdownContent += `- **Address**: ${business.address}\n`;
      }

      if (business.phone) {
        markdownContent += `- **Phone**: ${business.phone}\n`;
      }

      if (business.rating) {
        const stars = "⭐".repeat(Math.round(business.rating));
        markdownContent += `- **Rating**: ${stars} ${business.rating}/5 (${business.totalRatings} reviews)\n`;
      }

      if (business.website) {
        markdownContent += `- **Website**: [${business.website}](${business.website})\n`;
      }
      
      markdownContent += `\n`;
    });
  });

  // Save to file
  fs.writeFileSync(outputPath, markdownContent);
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

/**
 * Logs all found businesses to the console (for 'all' mode)
 * @param businesses - Array of found businesses
 * @param elapsedTime - Time taken for the search operation
 */
export function logAllBusinesses(
  businesses: BusinessResult[],
  elapsedTime?: string,
): void {
  if (businesses.length === 0) {
    console.log(chalk.yellow("\nNo businesses found."));
    return;
  }

  console.log(
    chalk.green.bold(
      `\n✅ Found ${businesses.length} businesses in total:  `,
    ),
  );

  const groupedByType = groupBusinessesByType(businesses);

  Object.entries(groupedByType).forEach(([type, businessList]) => {
    console.log(
      chalk.cyan(`\n${formatBusinessType(type)} (${businessList.length}):  `),
    );

    businessList.forEach((business) => {
      let status = chalk.gray("Website status unknown");
      if (business.hasNoWebsite) {
        status = chalk.red("No website");
      } else if (business.hasSocialOnly) {
        status = chalk.yellow("Social media only");
      } else if (business.website) {
        status = chalk.green("Has website");
      }

      console.log(`- ${chalk.white.bold(business.name)} (${status})`);
      if (business.address) {
        console.log(`  ${chalk.gray("📍")} ${chalk.gray(business.address)}`);
      }
      if (business.phone) {
        console.log(`  ${chalk.gray("📞")} ${chalk.gray(business.phone)}`);
      }
      if (business.rating) {
        const stars = "⭐".repeat(Math.round(business.rating));
        console.log(
          `  ${chalk.gray(stars)} ${chalk.gray(`${business.rating}/5 (${business.totalRatings} reviews)`)}`,
        );
      }
      // In 'all' mode, we always show the website if available
      if (business.website) {
        console.log(`  ${chalk.gray("🔗")} ${chalk.gray(business.website)}`);
      }
    });
  });

  if (elapsedTime) {
    console.log(chalk.blue(`\n• Search completed in: ${elapsedTime}`));
  }
}
