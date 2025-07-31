/**
 * Integration Tests for QueryWalker
 * 
 * This test suite validates the integration between different components
 * of the QueryWalker library, testing both horizontal and vertical walking
 * patterns with real-world scenarios.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { QueryWalker } from '../src/querywalker.js';

describe('QueryWalker Integration Tests', () => {
  let mockDocument;
  let mockElement1;
  let mockElement2;
  let mockElement3;

  beforeEach(() => {
    // Create mock DOM elements that simulate real DOM structure
    mockElement1 = document.createElement('div');
    mockElement1.className = 'button';
    mockElement1.textContent = 'Click me';
    mockElement1.dataset.id = 'btn1';

    mockElement2 = document.createElement('div');
    mockElement2.className = 'button';
    mockElement2.textContent = 'Click me too';
    mockElement2.dataset.id = 'btn2';

    mockElement3 = document.createElement('span');
    mockElement3.className = 'text';
    mockElement3.textContent = 'Some text';

    // Mock document with querySelectorAll to simulate DOM queries
    mockDocument = {
      querySelectorAll: jest.fn((selector) => {
        if (selector === '.button') {
          return [mockElement1, mockElement2];
        }
        if (selector === '.text') {
          return [mockElement3];
        }
        if (selector === '.form-input') {
          return [];
        }
        return [];
      })
    };
  });

  describe('walkHorizontally Integration', () => {
    test('should process multiple elements in parallel', async () => {
      // Track processed elements to verify parallel execution
      const processedElements = [];
      const mockHandler = jest.fn().mockImplementation(async ({ element }) => {
        processedElements.push(element.dataset.id || element.textContent);
        // Simulate processing delay for parallel execution testing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      });

      const config = {
        _scope_: mockDocument,
        '.button': mockHandler
      };

      await QueryWalker.walkHorizontally(config);

      expect(mockHandler).toHaveBeenCalledTimes(2);
      expect(processedElements).toContain('btn1');
      expect(processedElements).toContain('btn2');
    });

    test('should handle multiple selectors simultaneously', async () => {
      const buttonHandler = jest.fn();
      const textHandler = jest.fn();

      const config = {
        _scope_: mockDocument,
        '.button': buttonHandler,
        '.text': textHandler
      };

      await QueryWalker.walkHorizontally(config);

      expect(buttonHandler).toHaveBeenCalledTimes(2);
      expect(textHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('walkVertically Integration', () => {
    test('should process elements sequentially', async () => {
      // Track execution order to verify sequential processing
      const executionOrder = [];
      const mockHandler = jest.fn().mockImplementation(async ({ element }) => {
        executionOrder.push(element.dataset.id || element.textContent);
        // Simulate sequential processing delay
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      const config = {
        _scope_: mockDocument,
        '.button': mockHandler
      };

      await QueryWalker.walkVertically(config);

      expect(mockHandler).toHaveBeenCalledTimes(2);
      // Verify that vertical processing maintains order
      expect(executionOrder[0]).toBe('btn1');
      expect(executionOrder[1]).toBe('btn2');
    });

    test('should process selectors in sequence', async () => {
      // Track execution order across different selectors
      const executionOrder = [];
      const buttonHandler = jest.fn().mockImplementation(async () => {
        executionOrder.push('button');
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      const textHandler = jest.fn().mockImplementation(async () => {
        executionOrder.push('text');
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      const config = {
        _scope_: mockDocument,
        '.button': buttonHandler,
        '.text': textHandler
      };

      await QueryWalker.walkVertically(config);

      // Verify that selectors are processed in sequence
      expect(executionOrder).toEqual(['button', 'button', 'text']);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle errors gracefully in walkHorizontally', async () => {
      const mockExceptionHandler = jest.fn();
      const mockHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      const config = {
        _scope_: mockDocument,
        '.button': mockHandler,
        __exeptionHandler__: mockExceptionHandler
      };

      await QueryWalker.walkHorizontally(config);

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

    test('should handle errors gracefully in walkVertically', async () => {
      const mockExceptionHandler = jest.fn();
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));

      const config = {
        _scope_: mockDocument,
        '.button': mockHandler,
        __exeptionHandler__: mockExceptionHandler
      };

      await QueryWalker.walkVertically(config);

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
  });

  describe('Real-world Usage Scenarios', () => {
    test('should simulate form validation scenario', async () => {
      // Simulate form validation use case
      const validationResults = [];
      const validateInput = jest.fn().mockImplementation(async ({ element }) => {
        const isValid = element.value && element.value.length > 0;
        validationResults.push({
          element: element.dataset.id,
          isValid
        });
      });

      const config = {
        _scope_: mockDocument,
        '.form-input': validateInput
      };

      await QueryWalker.walkHorizontally(config);

      expect(validateInput).toHaveBeenCalledTimes(0); // No form inputs in mock
      expect(validationResults).toHaveLength(0);
    });

    test('should simulate event binding scenario', async () => {
      // Simulate event binding use case
      const boundEvents = [];
      const bindClickEvent = jest.fn().mockImplementation(async ({ element }) => {
        boundEvents.push({
          element: element.dataset.id,
          event: 'click'
        });
      });

      const config = {
        _scope_: mockDocument,
        '.button': bindClickEvent
      };

      await QueryWalker.walkVertically(config);

      expect(bindClickEvent).toHaveBeenCalledTimes(2);
      expect(boundEvents).toHaveLength(2);
      expect(boundEvents[0].element).toBe('btn1');
      expect(boundEvents[1].element).toBe('btn2');
    });
  });
}); 