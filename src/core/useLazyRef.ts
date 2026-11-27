import { useRef } from 'react';

/** Unlike useRef(expensiveExpression), build the run-scoped value only once. */
export function useLazyRef<T>(factory: () => T): { current: T } {
  const reference = useRef<T | null>(null);
  if (reference.current === null) reference.current = factory();
  return reference as { current: T };
}
