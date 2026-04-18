/**
 * Unit tests for the debounce and throttle utilities.
 */

import { debounce, throttle } from '../../utils/debounce';

// Use fake timers for all tests
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('debounce', () => {
  it('should delay function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer on subsequent calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    debounced();
    jest.advanceTimersByTime(100);
    debounced(); // reset
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the original function', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced('hello', 42);
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('hello', 42);
  });
});

describe('throttle', () => {
  it('should execute immediately on first call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not execute again within the interval', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute trailing call after interval', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    throttled(); // queued as trailing

    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should allow execution after interval has passed', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 200);

    throttled();
    jest.advanceTimersByTime(200);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
