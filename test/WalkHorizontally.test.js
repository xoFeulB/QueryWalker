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
    // In jsdom environment, window object is set, so null check is modified
    expect(result._scope_).toBeDefined();
  });

  test('should process elements horizontally with custom scope', async () => {
    const mockHandler = jest.fn().mockImplementation((params, resolve, reject) => {
      resolve(params.selector);
    });
    const mockExceptionHandler = jest.fn();

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    const result = await walkHorizontally(config);

    expect(result).toBe(config);
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(mockScope.querySelectorAll).toHaveBeenCalledWith('.test-class');
  });

  test('should call handler with correct parameters including resolve and reject', async () => {
    const mockHandler = jest.fn().mockImplementation((params, resolve, reject) => {
      expect(params).toEqual({
        element: expect.any(HTMLElement),
        selector: expect.any(String),
        self: expect.any(Object)
      });
      expect(typeof resolve).toBe('function');
      expect(typeof reject).toBe('function');
      resolve(params.selector);
    });
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
    }, expect.any(Function), expect.any(Function));

    expect(mockHandler).toHaveBeenCalledWith({
      element: mockElement2,
      selector: expect.any(String),
      self: config
    }, expect.any(Function), expect.any(Function));
  });

  test('should handle empty querySelectorAll results', async () => {
    const mockHandler = jest.fn().mockImplementation((params, resolve, reject) => {
      resolve(params.selector);
    });
    const config = {
      _scope_: mockScope,
      '.non-existent': mockHandler
    };

    const result = await walkHorizontally(config);

    expect(result).toBe(config);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('should handle exceptions in handler', async () => {
    const mockExceptionHandler = jest.fn();
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    await walkHorizontally(config);

    // Verify exception handler is called with correct error context
    expect(mockExceptionHandler).toHaveBeenCalled();
    expect(mockExceptionHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        element: expect.any(HTMLElement),
        selector: expect.any(String),
        self: config
      }),
      expect.any(Function), // resolve
      expect.any(Function)  // reject
    );
  }, 15000); // Extended timeout for error handling tests

  test('should filter out _scope_ from selectors', async () => {
    const mockHandler = jest.fn().mockImplementation((params, resolve, reject) => {
      resolve(params.selector);
    });
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
    const mockHandler1 = jest.fn().mockImplementation((params, resolve, reject) => {
      resolve(params.selector);
    });
    const mockHandler2 = jest.fn().mockImplementation((params, resolve, reject) => {
      resolve(params.selector);
    });

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

  test('should return the original object', async () => {
    const mockHandler = jest.fn().mockImplementation((params, resolve, reject) => {
      resolve(params.selector);
    });
    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);

    // Verify the function returns the original config object
    expect(result).toBe(config);
  });

  test('should handle async handlers with resolve and reject', async () => {
    const mockHandler = jest.fn().mockImplementation(async (params, resolve, reject) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      resolve(params.selector);
    });

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler
    };

    const result = await walkHorizontally(config);

    expect(result).toBe(config);
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  test('should handle reject in handler', async () => {
    const mockHandler = jest.fn().mockImplementation((params, resolve, reject) => {
      // rejectを呼び出すとエラーが発生する
      reject(new Error('Handler rejected'));
    });
    const mockExceptionHandler = jest.fn();

    const config = {
      _scope_: mockScope,
      '.test-class': mockHandler,
      __exeptionHandler__: mockExceptionHandler
    };

    // rejectが呼ばれるとエラーが発生するため、例外をキャッチする必要がある
    await expect(walkHorizontally(config)).rejects.toThrow('Handler rejected');
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
}); 