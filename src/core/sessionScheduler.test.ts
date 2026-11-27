import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionScheduler } from './sessionScheduler';

test('disposed and cancelled sessions cannot execute delayed gameplay actions', async () => {
  const session = new SessionScheduler();
  let actions = 0;
  session.schedule(() => actions++, 10);
  session.dispose();
  session.schedule(() => actions++, 0);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(actions, 0);
});

test('pause retains a pending action and resumes it once', async () => {
  const session = new SessionScheduler();
  let actions = 0;
  session.setPaused(true);
  session.schedule(() => actions++, 10);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(actions, 0);
  session.setPaused(false);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(actions, 1);
  session.dispose();
});
