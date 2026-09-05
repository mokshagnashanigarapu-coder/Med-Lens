import { RangeStatus } from './types';
import { APP_CONFIG } from './config';

export interface ParsedRangeResult {
  status: RangeStatus;
  numericValue?: number;
  rangeMin?: number;
  rangeMax?: number;
}

/**
 * Deterministically evaluates a lab value string against a source reference range string.
 * This runs 100% in application TypeScript code without relying on LLM guesses.
 */
export function evaluateReferenceRange(valueStr: string, rangeStr: string): ParsedRangeResult {
  const trimmedValue = valueStr.trim();
  const trimmedRange = rangeStr.trim();

  // Step 1: Check for missing or empty reference range
  if (!trimmedRange || trimmedRange.toLowerCase() === 'n/a' || trimmedRange.toLowerCase() === 'none' || trimmedRange.toLowerCase() === 'not provided') {
    const numVal = parseNumericValue(trimmedValue);
    return {
      status: 'NOT_PROVIDED',
      numericValue: numVal,
    };
  }

  // Step 2: Check if value is qualitative/non-numeric (e.g. "Negative", "Positive", "See comments")
  const numericValue = parseNumericValue(trimmedValue);
  if (numericValue === undefined) {
    return {
      status: 'NON_NUMERIC',
    };
  }

  // Step 3: Parse Reference Range Patterns

  // Pattern A: Inequality range: "< 5.0", "<= 5", "> 10", ">= 10"
  const inequalityMatch = trimmedRange.match(/^(<|<=|>|>=)\s*([0-9]+(?:\.[0-9]+)?)$/);
  if (inequalityMatch) {
    const operator = inequalityMatch[1];
    const threshold = parseFloat(inequalityMatch[2]);

    if (operator === '<') {
      return {
        status: numericValue < threshold ? 'NORMAL' : 'HIGH',
        numericValue,
        rangeMax: threshold,
      };
    }
    if (operator === '<=') {
      return {
        status: numericValue <= threshold ? 'NORMAL' : 'HIGH',
        numericValue,
        rangeMax: threshold,
      };
    }
    if (operator === '>') {
      return {
        status: numericValue > threshold ? 'NORMAL' : 'LOW',
        numericValue,
        rangeMin: threshold,
      };
    }
    if (operator === '>=') {
      return {
        status: numericValue >= threshold ? 'NORMAL' : 'LOW',
        numericValue,
        rangeMin: threshold,
      };
    }
  }

  // Pattern B: Range min - max: "4.0 - 11.0", "13.5 - 17.5", "10-20"
  const rangeMatch = trimmedRange.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:-|to|–)\s*([0-9]+(?:\.[0-9]+)?)$/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);

    let status: RangeStatus = 'NORMAL';
    if (numericValue < min) {
      status = 'LOW';
    } else if (numericValue > max) {
      status = 'HIGH';
    }

    return {
      status,
      numericValue,
      rangeMin: min,
      rangeMax: max,
    };
  }

  // Fallback for complex/unparsable ranges
  return {
    status: 'UNKNOWN',
    numericValue,
  };
}

/**
 * Helper to safely extract numeric value from string (e.g. "12.5", "12.5 mg/dL")
 */
function parseNumericValue(valStr: string): number | undefined {
  const match = valStr.match(/^([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    return undefined;
  }
  const parsed = parseFloat(match[1]);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Ensures source location is never hallucinated.
 */
export function sanitizeSourceLocation(location?: string): string {
  if (!location || !location.trim() || location.toLowerCase().includes('unknown')) {
    return APP_CONFIG.defaultSourceLocationFallback;
  }
  return location.trim();
}
