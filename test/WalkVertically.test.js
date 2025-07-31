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
    expect(Array.isArray(result)).toBe(true);
  });

  test('should process elements vertically with custom scope', async () => {
    const mockHandler = jest.fn().mockResolvedValue('handler-result');
    const mockExceptionHandler = jest.fn().mockResolvedValue('error-result');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkVertically(config);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(mockScope.querySelectorAll).toHaveBeenCalledWith('.test-class');
  });

  test('should call handler with correct parameters', async () => {
    const mockHandler = jest.fn().mockResolvedValue('test-result');
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);

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

    // Verify results array contains handler return values
    expect(result).toEqual(['test-result', 'test-result']);
  });

  test('should handle empty querySelectorAll results', async () => {
    const mockHandler = jest.fn();
    const config = {
      _scope_: mockScope,
      '.non-existent': mockHandler
    };

    const result = await walkVertically(config);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('should handle exceptions in handler', async () => {
    const mockExceptionHandler = jest.fn().mockResolvedValue('error-handled');
    const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'));

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkVertically(config);

    // Verify exception handler is called with correct error context
    expect(mockExceptionHandler).toHaveBeenCalledTimes(2);
    expect(mockExceptionHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        element: expect.any(HTMLElement),
        selector: expect.any(String),
        self: config
      })
    );

    // Verify results array contains exception handler return values
    expect(result).toEqual(['error-handled', 'error-handled']);
  }, 10000); // Extended timeout for error handling tests

  test('should filter out _scope_ from selectors', async () => {
    const mockHandler = jest.fn().mockResolvedValue('filtered-result');
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);

    // Verify that _scope_ is not passed as a selector
    expect(mockScope.querySelectorAll).toHaveBeenCalledWith('.test-class');
    expect(mockScope.querySelectorAll).not.toHaveBeenCalledWith('_scope_');
    expect(result).toEqual(['filtered-result', 'filtered-result']);
  });

  test('should handle multiple selectors in sequence', async () => {
    const mockHandler1 = jest.fn().mockResolvedValue('handler1-result');
    const mockHandler2 = jest.fn().mockResolvedValue('handler2-result');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler1,
      '.single-element': mockHandler2
    };

    const result = await walkVertically(config);

    // Verify both handlers are called with correct counts
    expect(mockHandler1).toHaveBeenCalledTimes(2);
    expect(mockHandler2).toHaveBeenCalledTimes(1);

    // Verify results array contains all handler return values in order
    expect(result).toEqual(['handler1-result', 'handler1-result', 'handler2-result']);
  });

  test('should return results array', async () => {
    const mockHandler = jest.fn().mockResolvedValue('array-result');
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);

    // Verify the function returns an array of results
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['array-result', 'array-result']);
  });

  test('should process elements sequentially (not in parallel)', async () => {
    // Track execution order to verify sequential processing
    const executionOrder = [];
    const mockHandler = jest.fn().mockImplementation(async ({ element }) => {
      executionOrder.push(element.textContent);
      // Add small delay to make order clear
      await new Promise(resolve => setTimeout(resolve, 10));
      return `processed-${element.textContent}`;
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);

    // Verify that vertical processing maintains order
    expect(executionOrder).toEqual(['Element 1', 'Element 2']);
    expect(result).toEqual(['processed-Element 1', 'processed-Element 2']);
  });

  test('should handle null elements gracefully', async () => {
    // Create scope with null and undefined elements to test robustness
    const mockScopeWithNull = {
      querySelectorAll: jest.fn(() => [null, mockElement1, undefined, mockElement2])
    };

    const mockHandler = jest.fn().mockResolvedValue('null-test-result');
    const config = {
      _scope_: mockScopeWithNull,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);

    // Verify that null and undefined elements are filtered out
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(result).toEqual(['null-test-result', 'null-test-result']);
  });

  test('should handle empty config object', async () => {
    const result = await walkVertically({});
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('should handle config with only _scope_', async () => {
    const config = { _scope_: mockScope };
    const result = await walkVertically(config);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('should handle config with only exception handler', async () => {
    const mockExceptionHandler = jest.fn();
    const config = { __exeptionHandler__: mockExceptionHandler };
    const result = await walkVertically(config);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('should handle handler that throws synchronous error', async () => {
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new Error('Synchronous error');
    });
    const mockExceptionHandler = jest.fn().mockResolvedValue('error-handled');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkVertically(config);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(mockExceptionHandler).toHaveBeenCalled();
  });

  test('should handle handler that returns non-promise value', async () => {
    const mockHandler = jest.fn().mockReturnValue('non-promise-value');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual(['non-promise-value', 'non-promise-value']);
  });

  test('should handle scope without querySelectorAll', async () => {
    const invalidScope = {};
    const mockHandler = jest.fn();

    const config = {
      _scope_: invalidScope,
      '.test-class': mockHandler
    };

    await expect(walkVertically(config)).rejects.toThrow();
  });

  test('should handle scope with querySelectorAll returning null', async () => {
    const mockScopeWithNull = {
      querySelectorAll: jest.fn(() => null)
    };
    const mockHandler = jest.fn();

    const config = {
      _scope_: mockScopeWithNull,
      '.test-class': mockHandler
    };

    await expect(walkVertically(config)).rejects.toThrow();
  });

  test('should handle scope with querySelectorAll returning undefined', async () => {
    const mockScopeWithUndefined = {
      querySelectorAll: jest.fn(() => undefined)
    };
    const mockHandler = jest.fn();

    const config = {
      _scope_: mockScopeWithUndefined,
      '.test-class': mockHandler
    };

    await expect(walkVertically(config)).rejects.toThrow();
  });

  test('should handle handler that returns undefined', async () => {
    const mockHandler = jest.fn().mockResolvedValue(undefined);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual([undefined, undefined]);
  });

  test('should handle handler that returns null', async () => {
    const mockHandler = jest.fn().mockResolvedValue(null);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual([null, null]);
  });

  test('should handle handler that returns complex object', async () => {
    const complexObject = { id: 1, name: 'test', data: [1, 2, 3] };
    const mockHandler = jest.fn().mockResolvedValue(complexObject);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual([complexObject, complexObject]);
  });

  test('should handle handler that returns array', async () => {
    const arrayResult = ['item1', 'item2', 'item3'];
    const mockHandler = jest.fn().mockResolvedValue(arrayResult);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual([arrayResult, arrayResult]);
  });

  test('should handle handler that returns function', async () => {
    const functionResult = () => 'test';
    const mockHandler = jest.fn().mockResolvedValue(functionResult);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual([functionResult, functionResult]);
  });

  test('should handle multiple selectors with different element counts', async () => {
    const mockScopeWithMultiple = {
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.many-elements') {
          return [mockElement1, mockElement2, mockElement1, mockElement2];
        }
        if (selector === '.single-element') {
          return [mockElement1];
        }
        return [];
      })
    };

    const handler1 = jest.fn().mockResolvedValue('many-result');
    const handler2 = jest.fn().mockResolvedValue('single-result');

    const config = {
      _scope_: mockScopeWithMultiple,
      '.many-elements': handler1,
      '.single-element': handler2
    };

    const result = await walkVertically(config);

    expect(handler1).toHaveBeenCalledTimes(4);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      'many-result', 'many-result', 'many-result', 'many-result',
      'single-result'
    ]);
  });

  test('should handle handler that returns promise that resolves to promise', async () => {
    const mockHandler = jest.fn().mockImplementation(() => {
      return Promise.resolve(Promise.resolve('nested-promise'));
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual(['nested-promise', 'nested-promise']);
  });

  test('should handle handler that returns promise that rejects', async () => {
    const mockHandler = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('Promise rejection'));
    });
    const mockExceptionHandler = jest.fn().mockResolvedValue('rejection-handled');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkVertically(config);
    expect(result).toEqual(['rejection-handled', 'rejection-handled']);
    expect(mockExceptionHandler).toHaveBeenCalled();
  });
}); 