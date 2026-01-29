/**
 * Text Parser Utility
 * 
 * Extracts URLs and contextual information from pasted text,
 * typically from social media posts, newsletters, or notes.
 */

/**
 * Represents a URL extracted from text with its surrounding context
 */
export interface ParsedItem {
  url: string;
  parsedTitle?: string;
  parsedDescription?: string;
  order: number;
}

/**
 * URL regex pattern that matches http:// and https:// URLs
 * Handles query params, fragments, and various TLDs
 */
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;

/**
 * Extract all URLs from text
 * 
 * @param text - The input text to extract URLs from
 * @returns Array of unique URLs in order of appearance
 */
export function extractUrls(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = text.match(URL_REGEX);
  if (!matches) {
    return [];
  }

  // Clean URLs (remove trailing punctuation that might have been captured)
  const cleanedUrls = matches.map((url) => {
    // Remove trailing punctuation that's likely not part of the URL
    return url.replace(/[.,;:!?)]+$/, '');
  });

  // Dedupe while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const url of cleanedUrls) {
    const normalized = url.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(url); // Keep original casing
    }
  }

  return unique;
}

/**
 * Clean a line of text by removing common prefixes
 * (numbers, arrows, bullets, etc.)
 */
function cleanLine(line: string): string {
  return line
    // Remove leading numbers with separators (1., 1), 1 →, etc.)
    .replace(/^\s*\d+\s*[.)→\-:]\s*/, '')
    // Remove bullet points
    .replace(/^\s*[•●○■□►▸→\-*]\s*/, '')
    // Remove emoji bullets
    .replace(/^\s*[\u{1F300}-\u{1F9FF}]\s*/u, '')
    // Trim whitespace
    .trim();
}

/**
 * Determine if a line looks like a title
 * (typically shorter, may contain arrows, is first meaningful line)
 */
function looksLikeTitle(line: string): boolean {
  const cleaned = cleanLine(line);
  // Titles are typically short (under 100 chars) and not empty
  return cleaned.length > 0 && cleaned.length < 100;
}

/**
 * Parse text to extract URLs with their surrounding context
 * 
 * This function splits the text by URLs and analyzes the text
 * preceding each URL to extract a title and description.
 * 
 * @param text - The input text containing URLs with context
 * @returns Array of ParsedItem objects with URLs and context
 */
export function parseTextWithContext(text: string): ParsedItem[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const urls = extractUrls(text);
  if (urls.length === 0) {
    return [];
  }

  const results: ParsedItem[] = [];
  let remainingText = text;
  let order = 0;

  for (const url of urls) {
    const urlIndex = remainingText.indexOf(url);
    if (urlIndex === -1) {
      // URL was deduplicated, skip it
      continue;
    }

    // Get text before this URL
    const textBefore = remainingText.substring(0, urlIndex);
    
    // Split into lines and filter empty ones
    const lines = textBefore
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let parsedTitle: string | undefined;
    let parsedDescription: string | undefined;

    if (lines.length > 0) {
      // Find the title line (typically the first meaningful line)
      // Look for lines with arrows or that are relatively short
      const titleCandidateIndex = lines.findIndex((line) => 
        line.includes('→') || line.includes('➤') || line.includes(':')
      );
      
      const titleIndex = titleCandidateIndex >= 0 ? titleCandidateIndex : 0;
      const titleLine = lines[titleIndex];
      
      if (looksLikeTitle(titleLine)) {
        parsedTitle = cleanLine(titleLine);
        
        // Description is the remaining lines (excluding title)
        const descLines = [
          ...lines.slice(0, titleIndex),
          ...lines.slice(titleIndex + 1),
        ];
        
        if (descLines.length > 0) {
          parsedDescription = descLines.map(cleanLine).filter(Boolean).join(' ');
        }
      } else {
        // All lines become description if no clear title
        parsedDescription = lines.map(cleanLine).filter(Boolean).join(' ');
      }
    }

    results.push({
      url,
      parsedTitle: parsedTitle || undefined,
      parsedDescription: parsedDescription || undefined,
      order,
    });

    // Move past this URL for the next iteration
    remainingText = remainingText.substring(urlIndex + url.length);
    order++;
  }

  return results;
}

/**
 * Validate that parsed results are within acceptable limits
 */
export function validateParseResults(items: ParsedItem[], maxItems: number = 50): {
  valid: boolean;
  items: ParsedItem[];
  warning?: string;
} {
  if (items.length === 0) {
    return { valid: true, items: [] };
  }

  if (items.length <= maxItems) {
    return { valid: true, items };
  }

  return {
    valid: true,
    items: items.slice(0, maxItems),
    warning: `Found ${items.length} links, but only the first ${maxItems} will be imported.`,
  };
}
