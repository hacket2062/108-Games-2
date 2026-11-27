import { useEffect, useRef } from 'react';
import { SessionScheduler } from './sessionScheduler';

export function useSessionScheduler(paused = false) {
  const scheduler = useRef<SessionScheduler | null>(null);
  if (!scheduler.current) scheduler.current = new SessionScheduler();
  const current = scheduler.current;
  useEffect(() => {
    current.activate();
    return () => current.dispose();
  }, [current]);
  useEffect(() => { current.setPaused(paused); }, [current, paused]);
  return current;
}
