/** Synchronous domain transitions, React subscribes via useSyncExternalStore.
 * Callbacks execute once here, never inside a React state updater. */
export function createSnapshotStore<T>(initial: T) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    update(transition: (current: T) => T) {
      const next = transition(snapshot);
      if (Object.is(next, snapshot)) return;
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}
