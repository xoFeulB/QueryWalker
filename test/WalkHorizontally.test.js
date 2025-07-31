/**
 * WalkHorizontally Unit Tests
 * 
 * This test suite validates the horizontal walking functionality of QueryWalker.
 * Horizontal walking processes elements in parallel, allowing for concurrent
 * execution of handlers across multiple elements and selectors.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { walkHorizontally } from '../src/Walker/WalkHorizontally.js';

describe('walkHorizontally', () => {
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
    expect(walkHorizontally.constructor.name).toBe('AsyncFunction');
  });

  test('should accept default parameters', async () => {
    const result = await walkHorizontally();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  test('should process elements horizontally with custom scope', async () => {
    const mockHandler = jest.fn().mockResolvedValue('processed');
    const mockExceptionHandler = jest.fn();

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkHorizontally(config);

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

    await walkHorizontally(config);

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

    const result = await walkHorizontally(config);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('should handle exceptions in handler', async () => {
    const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'));
    const mockExceptionHandler = jest.fn().mockResolvedValue('error-handled');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkHorizontally(config);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['error-handled', 'error-handled']);
    expect(mockExceptionHandler).toHaveBeenCalled();
    expect(mockExceptionHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        element: expect.any(HTMLElement),
        selector: expect.any(String),
        self: config
      })
    );
  }, 15000); // Extended timeout for error handling tests

  test('should filter out _scope_ from selectors', async () => {
    const mockHandler = jest.fn().mockResolvedValue('filtered-result');
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    await walkHorizontally(config);

    // Verify that _scope_ is not passed as a selector
    expect(mockScope.querySelectorAll).toHaveBeenCalledWith('.test-class');
    expect(mockScope.querySelectorAll).not.toHaveBeenCalledWith('_scope_');
  });

  test('should handle multiple selectors', async () => {
    const mockHandler1 = jest.fn().mockResolvedValue('handler1-result');
    const mockHandler2 = jest.fn().mockResolvedValue('handler2-result');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler1,
      '.single-element': mockHandler2
    };

    await walkHorizontally(config);

    // Verify both handlers are called with correct counts
    expect(mockHandler1).toHaveBeenCalledTimes(2);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
  });

  test('should return results array', async () => {
    const mockHandler = jest.fn().mockResolvedValue('array-result');
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);

    // Verify the function returns an array of results
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['array-result', 'array-result']);
  });

  test('should handle async handlers', async () => {
    const mockHandler = jest.fn().mockImplementation(async (params) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return params.selector;
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);

    expect(Array.isArray(result)).toBe(true);
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  test('should handle reject in handler', async () => {
    const mockHandler = jest.fn().mockRejectedValue(new Error('Handler rejected'));
    const mockExceptionHandler = jest.fn().mockResolvedValue('error-handled');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkHorizontally(config);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['error-handled', 'error-handled']);
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  test('should handle empty config object', async () => {
    const result = await walkHorizontally({});
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('should handle config with only _scope_', async () => {
    const config = { _scope_: mockScope };
    const result = await walkHorizontally(config);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('should handle config with only exception handler', async () => {
    const mockExceptionHandler = jest.fn();
    const config = { __exeptionHandler__: mockExceptionHandler };

    // _scope_が未定義の場合、エラーが発生する
    await expect(walkHorizontally(config)).rejects.toThrow();
  });

  test('should handle multiple elements with different processing times', async () => {
    const processingTimes = [];
    const mockHandler = jest.fn().mockImplementation(async (params) => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
      processingTimes.push(Date.now() - startTime);
      return 'processed';
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const startTime = Date.now();
    await walkHorizontally(config);
    const totalTime = Date.now() - startTime;

    expect(mockHandler).toHaveBeenCalledTimes(2);
    // Parallel execution should be faster than sequential
    expect(totalTime).toBeLessThan(processingTimes.reduce((a, b) => a + b, 0));
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

    const result = await walkHorizontally(config);
    expect(Array.isArray(result)).toBe(true);
    expect(mockExceptionHandler).toHaveBeenCalled();
  });

  test('should handle handler that returns a promise', async () => {
    const mockHandler = jest.fn().mockResolvedValue('promise-result');

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);
    expect(Array.isArray(result)).toBe(true);
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  test('should handle scope without querySelectorAll', async () => {
    const invalidScope = {};
    const mockHandler = jest.fn();

    const config = {
      _scope_: invalidScope,
      '.test-class': mockHandler
    };

    await expect(walkHorizontally(config)).rejects.toThrow();
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

    await expect(walkHorizontally(config)).rejects.toThrow();
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

    await expect(walkHorizontally(config)).rejects.toThrow();
  });

  test('should handle handler that returns undefined', async () => {
    const mockHandler = jest.fn().mockResolvedValue(undefined);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);
    expect(result).toEqual([undefined, undefined]);
  });

  test('should handle handler that returns null', async () => {
    const mockHandler = jest.fn().mockResolvedValue(null);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);
    expect(result).toEqual([null, null]);
  });

  test('should handle handler that returns complex object', async () => {
    const complexObject = { id: 1, name: 'test', data: [1, 2, 3] };
    const mockHandler = jest.fn().mockResolvedValue(complexObject);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);
    expect(result).toEqual([complexObject, complexObject]);
  });

  test('should handle handler that returns array', async () => {
    const arrayResult = ['item1', 'item2', 'item3'];
    const mockHandler = jest.fn().mockResolvedValue(arrayResult);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);
    expect(result).toEqual([arrayResult, arrayResult]);
  });

  test('should handle handler that returns function', async () => {
    const functionResult = () => 'test';
    const mockHandler = jest.fn().mockResolvedValue(functionResult);

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);
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

    const result = await walkHorizontally(config);

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

    const result = await walkHorizontally(config);
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

    const result = await walkHorizontally(config);
    expect(result).toEqual(['rejection-handled', 'rejection-handled']);
    expect(mockExceptionHandler).toHaveBeenCalled();
  });
}); 