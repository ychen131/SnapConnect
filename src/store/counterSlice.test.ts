/**
 * @file counterSlice.test.ts
 * @description Unit tests for the counter slice.
 */
import counterReducer, { increment } from './counterSlice';

describe('counterSlice', () => {
  it('should return the initial state', () => {
    expect(counterReducer(undefined, { type: 'unknown' })).toEqual({ value: 0 });
  });

  it('should handle increment', () => {
    const initialState = { value: 0 };
    const nextState = counterReducer(initialState, increment());
    expect(nextState.value).toBe(1);
  });
});
