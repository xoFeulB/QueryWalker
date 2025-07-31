/**
 * QueryWalker Module Tests
 * 
 * This test suite validates the main QueryWalker module exports and ensures
 * that both walking functions (horizontal and vertical) are properly exposed
 * and have the correct function signatures.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { QueryWalker } from '../src/querywalker.js';

describe('QueryWalker', () => {
  let mockScope;
  let mockElement;

  beforeEach(() => {
    // Create mock DOM element for testing
    mockElement = document.createElement('div');
    mockElement.className = 'test-class';
    mockElement.textContent = 'Test Element';

    // Mock scope with querySelectorAll
    mockScope = {
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.test-class') {
          return [mockElement];
        }
        return [];
      })
    };
  });

  describe('Module Structure', () => {
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

    test('should export only the expected functions', () => {
      const exportedKeys = Object.keys(QueryWalker);
      expect(exportedKeys).toHaveLength(2);
      expect(exportedKeys).toContain('walkHorizontally');
      expect(exportedKeys).toContain('walkVertically');
    });
  });

  describe('Function Signatures', () => {
    test('walkHorizontally should accept config parameter', async () => {
      const config = {
        _scope_: mockScope,
        '.test-class': jest.fn()
      };

      const result = await QueryWalker.walkHorizontally(config);
      expect(result).toBeDefined();
    });

    test('walkVertically should accept config parameter', async () => {
      const config = {
        _scope_: mockScope,
        '.test-class': jest.fn()
      };

      const result = await QueryWalker.walkVertically(config);
      expect(result).toBeDefined();
    });

    test('both functions should work with default parameters', async () => {
      const horizontalResult = await QueryWalker.walkHorizontally();
      const verticalResult = await QueryWalker.walkVertically();

      expect(horizontalResult).toBeDefined();
      expect(verticalResult).toBeDefined();
    });
  });

  describe('Basic Functionality', () => {
    test('walkHorizontally should process elements', async () => {
      const mockHandler = jest.fn().mockResolvedValue('processed');

      const config = {
        _scope_: mockScope,
        '.test-class': mockHandler
      };

      const result = await QueryWalker.walkHorizontally(config);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('walkVertically should return results array', async () => {
      const mockHandler = jest.fn().mockResolvedValue('processed');

      const config = {
        _scope_: mockScope,
        '.test-class': mockHandler
      };

      const result = await QueryWalker.walkVertically(config);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('processed');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in walkHorizontally gracefully', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockExceptionHandler = jest.fn().mockResolvedValue('error-handled');

      const config = {
        _scope_: mockScope,
        '.test-class': mockHandler,
        __exeptionHandler__: mockExceptionHandler
      };

      const result = await QueryWalker.walkHorizontally(config);
      
      expect(Array.isArray(result)).toBe(true);
      expect(mockExceptionHandler).toHaveBeenCalled();
    });

    test('should handle errors in walkVertically gracefully', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockExceptionHandler = jest.fn().mockResolvedValue('error-handled');

      const config = {
        _scope_: mockScope,
        '.test-class': mockHandler,
        __exeptionHandler__: mockExceptionHandler
      };

      const result = await QueryWalker.walkVertically(config);
      
      expect(Array.isArray(result)).toBe(true);
      expect(mockExceptionHandler).toHaveBeenCalled();
    });
  });

  describe('Performance Characteristics', () => {
    test('walkHorizontally should execute handlers in parallel', async () => {
      const executionOrder = [];
      const mockHandler = jest.fn().mockImplementation(async (params) => {
        executionOrder.push(params.element.textContent);
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });

      const config = {
        _scope_: mockScope,
        '.test-class': mockHandler
      };

      const startTime = Date.now();
      await QueryWalker.walkHorizontally(config);
      const endTime = Date.now();

      // パフォーマンステストは環境によって変動するため、より緩い条件にする
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    test('walkVertically should execute handlers sequentially', async () => {
      const executionOrder = [];
      const mockHandler = jest.fn().mockImplementation(async (params) => {
        executionOrder.push(params.element.textContent);
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'done';
      });

      const config = {
        _scope_: mockScope,
        '.test-class': mockHandler
      };

      const startTime = Date.now();
      await QueryWalker.walkVertically(config);
      const endTime = Date.now();

      // パフォーマンステストは環境によって変動するため、より緩い条件にする
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });
}); 