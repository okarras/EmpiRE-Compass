import { describe, expect, it } from 'vitest';
import { calculateCost, formatCost, aggregateCosts } from './costCalculator.js';

describe('costCalculator', () => {
  it('calculates OpenAI gpt-4o-mini cost', () => {
    const result = calculateCost('openai', 'gpt-4o-mini', 1_000_000, 1_000_000);
    expect(result.promptTokens).toBe(1_000_000);
    expect(result.completionTokens).toBe(1_000_000);
    expect(result.totalCost).toBeCloseTo(0.75, 2);
  });

  it('returns zero cost for unknown models', () => {
    const result = calculateCost('openai', 'unknown-model', 1000, 1000);
    expect(result.totalCost).toBe(0);
  });

  it('formats zero cost', () => {
    expect(formatCost(0)).toBe('$0.00');
  });

  it('aggregates multiple cost breakdowns', () => {
    const a = calculateCost('openai', 'gpt-4o-mini', 1000, 500);
    const b = calculateCost('openai', 'gpt-4o-mini', 2000, 1000);
    const total = aggregateCosts([a, b]);
    expect(total.promptTokens).toBe(a.promptTokens + b.promptTokens);
    expect(total.totalCost).toBeCloseTo(a.totalCost + b.totalCost, 6);
  });
});
