/**
 * Property Display Controller
 *
 * Handles parsing and processing of AI property display commands.
 * Supports two formats:
 * 1. <show_properties>...</show_properties> - ID-based format
 * 2. <!--HOMY_PROPERTIES [...] HOMY_PROPERTIES--> - Full property objects
 */

import { AIInsights, WebSocketPropertyDisplayCommand } from './types';

/**
 * Parse <show_properties> command from Claude output
 * @param claudeOutput Raw output from Claude
 * @returns Parsed WebSocketPropertyDisplayCommand or null if not found/invalid
 */
export function parsePropertyCommand(claudeOutput: string): WebSocketPropertyDisplayCommand | null {
  // Try <show_properties> format first
  const showPropsMatch = claudeOutput.match(/<show_properties>([\s\S]*?)<\/show_properties>/);
  if (showPropsMatch) {
    return parseShowPropertiesFormat(showPropsMatch[1]);
  }

  // Try <!--HOMY_PROPERTIES format
  const homyMatch = claudeOutput.match(/<!--HOMY_PROPERTIES\s*([\s\S]*?)\s*HOMY_PROPERTIES-->/);
  if (homyMatch) {
    return parseHomyPropertiesFormat(homyMatch[1]);
  }

  return null;
}

/**
 * Parse the <show_properties> JSON format (ID-based)
 */
function parseShowPropertiesFormat(jsonStr: string): WebSocketPropertyDisplayCommand | null {
  try {
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed.properties)) {
      console.warn('[PropertyDisplayController] Invalid command: properties must be an array');
      return null;
    }

    // Convert to AIInsights format
    const insights: AIInsights | null = parsed.insights ? {
      best_neighborhood: parsed.insights.best_district || 'Yerevan',
      description: parsed.insights.reason || 'Подобрано AI на основе ваших критериев',
      analyzed_count: parsed.insights.total_found || parsed.properties.length,
      suitable_count: parsed.insights.shown || parsed.properties.length,
      recommended_count: Math.min(parsed.properties.length, 5),
      neighborhood_count: 1,
    } : null;

    return {
      properties: parsed.properties,
      top_choice: parsed.top_choice || null,
      criteria_extracted: parsed.criteria_extracted || [],
      insights,
    };
  } catch (error) {
    console.error('[PropertyDisplayController] Failed to parse show_properties:', error);
    return null;
  }
}

/**
 * Parse the <!--HOMY_PROPERTIES format (full property objects)
 */
function parseHomyPropertiesFormat(jsonStr: string): WebSocketPropertyDisplayCommand | null {
  try {
    const parsed = JSON.parse(jsonStr.trim());

    // This format contains full property objects, extract IDs
    if (!Array.isArray(parsed)) {
      console.warn('[PropertyDisplayController] HOMY_PROPERTIES must be an array');
      return null;
    }

    const propertyIds = parsed.map((p: any) => p.id).filter(Boolean);

    // Find top choice (first one)
    const topChoice = propertyIds.length > 0 ? propertyIds[0] : null;

    // Extract criteria from recommendation_reasons
    const allReasons = parsed.flatMap((p: any) => p.recommendation_reasons || []);
    const uniqueReasons = [...new Set(allReasons)].slice(0, 5) as string[];

    // Try to determine best district from properties
    const addresses = parsed.map((p: any) => p.address).filter(Boolean);
    const districts = addresses.map((addr: string) => {
      const parts = addr.split(',');
      return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
    });
    const bestNeighborhood = districts.length > 0 ? districts[0] : 'Yerevan';

    // Count unique neighborhoods
    const uniqueNeighborhoods = new Set(districts);

    console.log(`[PropertyDisplayController] Parsed HOMY_PROPERTIES: ${propertyIds.length} properties`);

    const insights: AIInsights = {
      best_neighborhood: bestNeighborhood,
      description: 'Подобрано AI на основе ваших критериев',
      analyzed_count: propertyIds.length * 10, // Estimate
      suitable_count: propertyIds.length,
      recommended_count: Math.min(propertyIds.length, 5),
      neighborhood_count: uniqueNeighborhoods.size || 1,
    };

    return {
      properties: propertyIds,
      top_choice: topChoice,
      criteria_extracted: uniqueReasons,
      insights,
    };
  } catch (error) {
    console.error('[PropertyDisplayController] Failed to parse HOMY_PROPERTIES:', error);
    return null;
  }
}

/**
 * Strip property commands from Claude output
 * This leaves only the user-facing text message
 * @param claudeOutput Raw output from Claude
 * @returns Clean output without property commands
 */
export function stripPropertyCommand(claudeOutput: string): string {
  return claudeOutput
    .replace(/<show_properties>[\s\S]*?<\/show_properties>/g, '')
    .replace(/<!--HOMY_PROPERTIES[\s\S]*?HOMY_PROPERTIES-->/g, '')
    .trim();
}

/**
 * Check if Claude output contains property display command
 * @param claudeOutput Raw output from Claude
 * @returns true if contains property command tags
 */
export function hasPropertyCommand(claudeOutput: string): boolean {
  return /<show_properties>[\s\S]*?<\/show_properties>/.test(claudeOutput) ||
         /<!--HOMY_PROPERTIES[\s\S]*?HOMY_PROPERTIES-->/.test(claudeOutput);
}

/**
 * Extract all property commands from output (in case of multiple)
 * @param claudeOutput Raw output from Claude
 * @returns Array of WebSocketPropertyDisplayCommand objects
 */
export function parseAllPropertyCommands(claudeOutput: string): WebSocketPropertyDisplayCommand[] {
  const commands: WebSocketPropertyDisplayCommand[] = [];

  // Find all <show_properties> commands
  const showPropsRegex = /<show_properties>([\s\S]*?)<\/show_properties>/g;
  let match;
  while ((match = showPropsRegex.exec(claudeOutput)) !== null) {
    const cmd = parseShowPropertiesFormat(match[1]);
    if (cmd) commands.push(cmd);
  }

  // Find all <!--HOMY_PROPERTIES commands
  const homyRegex = /<!--HOMY_PROPERTIES\s*([\s\S]*?)\s*HOMY_PROPERTIES-->/g;
  while ((match = homyRegex.exec(claudeOutput)) !== null) {
    const cmd = parseHomyPropertiesFormat(match[1]);
    if (cmd) commands.push(cmd);
  }

  return commands;
}
