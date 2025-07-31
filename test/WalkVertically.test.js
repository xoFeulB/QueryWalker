/**
 * WalkVertically Unit Tests
 * 
 * This test suite validates the vertical walking functionality of QueryWalker.
 * Vertical walking processes elements sequentially, ensuring ordered execution
 * of handlers across elements and selectors.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { walkVertically } from '../src/Walker/WalkVertically.js';

describe('walkVertically', () => {
  let mockScope;
  let mockElement1;
  let mockElement2;

  beforeEach(() => {
    // Create mock DOM elements for testing
    mockElement1 = document.createElement('div');
    mockElement1.className = 'test-class';
    mockElement1.textContent = 'Element 1';

    mockElement2 = document.createElement('span');
    mockElement2.className = 'test-class';
    mockElement2.textContent = 'Element 2';

    // Mock scope with querySelectorAll to simulate DOM queries
    mockScope = {
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.test-class') {
          return [mockElement1, mockElement2];
        }
        if (selector === '.single-element') {
          return [mockElement1];
        }
        return [];
      })
    };
  });

  test('should be an async function', () => {
    expect(walkVertically.constructor.name).toBe('AsyncFunction');
  });

  test('should accept default parameters', async () => {
    const result = await walkVertically();
    expect(result).toBeDefined();
    // In jsdom environment, window object is set, so null check is modified
    expect(result._scope_).toBeDefined();
  });

  test('should process elements vertically with custom scope', async () => {
    const mockHandler = jest.fn();
    const mockExceptionHandler = jest.fn();

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkVertically(config);

    expect(result).toBe(config);
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(mockScope.querySelectorAll).toHaveBeenCalledWith('.test-class');
  });

  test('should call handler with correct parameters', async () => {
    const mockHandler = jest.fn();
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    await walkVertically(config);

    // Verify handler is called with correct parameters for each element
    expect(mockHandler).toHaveBeenCalledWith({
      element: mockElement1,
      selector: expect.any(String),
      self: config
    });

    expect(mockHandler).toHaveBeenCalledWith({
      element: mockElement2,
      selector: expect.any(String),
      self: config
    });
  });

  test('should handle empty querySelectorAll results', async () => {
    const mockHandler = jest.fn();
    const config = {
      _scope_: mockScope,
      '.non-existent': mockHandler
    };

    const result = await walkVertically(config);

    expect(result).toBe(config);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('should handle exceptions in handler', async () => {
    const mockExceptionHandler = jest.fn();
    const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'));

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    await walkVertically(config);

    // Verify exception handler is called with correct error context
    expect(mockExceptionHandler).toHaveBeenCalled();
    expect(mockExceptionHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        element: expect.any(HTMLElement),
        selector: expect.any(String),
        self: config
      })
    );
  }, 10000); // Extended timeout for error handling tests

  test('should filter out _scope_ from selectors', async () => {
    const mockHandler = jest.fn();
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    await walkVertically(config);

    // Verify that _scope_ is not passed as a selector
    expect(mockScope.querySelectorAll).toHaveBeenCalledWith('.test-class');
    expect(mockScope.querySelectorAll).not.toHaveBeenCalledWith('_scope_');
  });

  test('should handle multiple selectors in sequence', async () => {
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler1,
      '.single-element': mockHandler2
    };

    await walkVertically(config);

    // Verify both handlers are called with correct counts
    expect(mockHandler1).toHaveBeenCalledTimes(2);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
  });

  test('should return the original object', async () => {
    const config = {
      _scope_: mockScope,
      '.test-class': jest.fn()
    };

    const result = await walkVertically(config);

    // Verify the function returns the original config object
    expect(result).toBe(config);
  });

  test('should process elements sequentially (not in parallel)', async () => {
    // Track execution order to verify sequential processing
    const executionOrder = [];
    const mockHandler = jest.fn().mockImplementation(async ({ element }) => {
      executionOrder.push(element.textContent);
      // Add small delay to make order clear
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    await walkVertically(config);

    // Verify that vertical processing maintains order
    expect(executionOrder).toEqual(['Element 1', 'Element 2']);
  });

  test('should handle null elements gracefully', async () => {
    // Create scope with null and undefined elements to test robustness
    const mockScopeWithNull = {
      querySelectorAll: jest.fn(() => [null, mockElement1, undefined, mockElement2])
    };

    const mockHandler = jest.fn();
    const config = {
      _scope_: mockScopeWithNull,
      '.test-class': mockHandler
    };

    await walkVertically(config);

    // Verify that null and undefined elements are filtered out
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
}); 