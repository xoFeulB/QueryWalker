/**
 * QueryWalker Module Tests
 * 
 * This test suite validates the main QueryWalker module exports and ensures
 * that both walking functions (horizontal and vertical) are properly exposed
 * and have the correct function signatures.
 */

import { describe, test, expect } from '@jest/globals';
import { QueryWalker } from '../src/querywalker.js';

describe('QueryWalker', () => {
  test('should export walkHorizontally function', () => {
    expect(QueryWalker.walkHorizontally).toBeDefined();
    expect(typeof QueryWalker.walkHorizontally).toBe('function');
  });

  test('should export walkVertically function', () => {
    expect(QueryWalker.walkVertically).toBeDefined();
    expect(typeof QueryWalker.walkVertically).toBe('function');
  });

  test('should have both walker functions as async functions', () => {
    // Verify that both exported functions are async functions
    expect(QueryWalker.walkHorizontally.constructor.name).toBe('AsyncFunction');
    expect(QueryWalker.walkVertically.constructor.name).toBe('AsyncFunction');
  });
}); 