import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialPlayerSave, hydrateSave } from './playerSave';
import { assertPlayerSave, completeSaveData, fingerprint, resolveWrongRecordOnce } from './saveIntegrity';
import { createSnapshotStore } from './snapshotStore';
import { computeSaveCombatStats } from './combatMath';

test('each of the six equipment slots has a real combat effect', () => {
  const save = createInitialPlayerSave();
  const baseline = computeSaveCombatStats(save);
  for (const slot of ['weapon', 'helm', 'armor', 'gloves', 'boots', 'amulet'] as const) {
    const upgraded = structuredClone(save);
    upgraded.equipment[slot] = (upgraded.equipment[slot] ?? 1) + 1;
    assert.notDeepEqual(computeSaveCombatStats(upgraded), baseline, `${slot} upgrade has no effect`);
  }
});

test('default and legacy saves validate without losing inventory or daily state', () => {
  const save = createInitialPlayerSave();
  save.weapons = Array.from({ length: 20 }, (_, index) => ({ ...structuredClone(save.weapons[0]), uid: `weapon-${index}` }));
  save.equippedWeaponUid = 'weapon-19';
  save.gemBag = Array.from({ length: 80 }, (_, index) => ({ ...save.gemBag[0], uid: `gem-${index}` }));
  save.dailyQuests[0].claimed = true;
  save.dailyPlaySeconds = 2600;
  save.unlockedCards = ['test-card'];
  const restored = hydrateSave(JSON.parse(JSON.stringify(completeSaveData(save))));
  assert.deepEqual(restored, save);
  assert.equal(restored.weapons.length, 20);
  assert.equal(restored.gemBag.length, 80);
});

test('invalid nested weapon data and dangling equipped UID are rejected', () => {
  const save = createInitialPlayerSave();
  const original = JSON.stringify(save);
  const broken = structuredClone(save);
  (broken.weapons[0] as unknown as Record<string, unknown>).ascensionPath = 'invalid';
  assert.throws(() => hydrateSave(broken), /ascensionPath/);
  save.equippedWeaponUid = 'missing';
  assert.throws(() => assertPlayerSave(save), /equippedWeaponUid/);
  assert.equal(JSON.stringify(createInitialPlayerSave()), original);
});

test('corrupt arrays, invalid numbers and subject counts fail without mutation', () => {
  const save = createInitialPlayerSave();
  assert.throws(() => hydrateSave({ ...save, weapons: 'bad' } as never));
  assert.throws(() => hydrateSave({ ...save, coins: Number.NaN }));
  save.subjectStats.math.correct = 10;
  assert.throws(() => hydrateSave(save), /subjectStats.math.correct/);
});

test('wrong record resolution rewards exactly once, not for absent records', () => {
  const save = createInitialPlayerSave();
  save.wrongRecords = [{ questionId: 'q', subject: 'math', grade: 4, prompt: '1+1', correctAnswer: '2', explanation: '2', knowledgeTag: 'addition', wrongCount: 1, lastWrongAt: Date.now() }];
  const next = resolveWrongRecordOnce(save, 'q');
  assert.equal(next.coins, save.coins + 25);
  assert.strictEqual(resolveWrongRecordOnce(next, 'q'), next);
  assert.strictEqual(resolveWrongRecordOnce(save, 'absent'), save);
});

test('snapshot transitions are synchronous and batched calls see the latest resource count', () => {
  const store = createSnapshotStore({ coins: 100 });
  let runs = 0;
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  const spend = () => {
    let allowed = false;
    store.update((state) => { runs++; if (state.coins < 80) return state; allowed = true; return { coins: state.coins - 80 }; });
    return allowed;
  };
  assert.equal(spend(), true);
  assert.equal(spend(), false);
  assert.equal(store.getSnapshot().coins, 20);
  assert.equal(runs, 2);
  assert.equal(notifications, 1);
  unsubscribe();
});

test('cloud fingerprints are key-order independent but detect any changed progress', () => {
  assert.equal(fingerprint({ a: 1, b: [2, 3] }), fingerprint({ b: [2, 3], a: 1 }));
  assert.notEqual(fingerprint({ coins: 1 }), fingerprint({ coins: 2 }));
  assert.notEqual(fingerprint(null), fingerprint({}));
});

test('oversized saves stop uploading rather than silently truncating assets', () => {
  const save = createInitialPlayerSave();
  save.unlockedCards = Array.from({ length: 4000 }, (_, i) => String(i) + 'a'.repeat(300));
  assert.throws(() => completeSaveData(save), /容量上限/);
  assert.equal(save.unlockedCards.length, 4000);
});

test('new calendar day resets only daily fields, preserving balances and inventory', () => {
  const save = createInitialPlayerSave();
  save.lastPlayDate = '2020-01-01';
  save.dailyPlaySeconds = 1000;
  save.dailyQuests[0].claimed = true;
  const next = hydrateSave(save);
  assert.equal(next.dailyPlaySeconds, 0);
  assert.equal(next.dailyQuests[0].claimed, false);
  assert.equal(next.coins, save.coins);
  assert.deepEqual(next.weapons, save.weapons);
});
