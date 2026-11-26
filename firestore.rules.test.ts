import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Static & Structural Verification of Firestore Security Rules against the Dirty Dozen specification.
 * Verifies every critical Eight Pillars security gate exists in firestore.rules.
 */
test('firestore.rules enforces all Eight Pillars and Dirty Dozen guards', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  // Pillar 1 & Global Safety Net
  assert.match(rules, /rules_version\s*=\s*'2';/);
  assert.match(rules, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/);

  // Pillar 2: Standalone validation blueprints used on create and update
  assert.match(rules, /function\s+isValidUserSave\(data\)/);
  assert.match(rules, /function\s+isValidPvPRoom\(data\)/);
  assert.match(rules, /function\s+isValidPvPEvent\(data\)/);

  // Pillar 3: Path variable ID poisoning guard
  assert.match(rules, /function\s+isValidId\(id\)/);
  assert.match(rules, /isValidId\(userId\)/);
  assert.match(rules, /isValidId\(roomId\)/);
  assert.match(rules, /isValidId\(eventId\)/);

  // Pillar 4 & Action-based updates with affectedKeys().hasOnly()
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(/);

  // Pillar 6: Verified email enforcement & strict owner-only /users/{userId}
  assert.match(rules, /request\.auth\.token\.email_verified\s*==\s*true/);
  assert.match(rules, /allow\s+list:\s*if\s+false;/);

  // Terminal State Locking: finished PvP rooms cannot be mutated
  assert.match(rules, /existing\(\)\.status\s*==\s*'waiting'/);
  assert.match(rules, /existing\(\)\.status\s*==\s*'playing'/);

  // Temporal Integrity: server timestamps enforced
  assert.match(rules, /incoming\(\)\.createdAt\s*==\s*request\.time/);
  assert.match(rules, /incoming\(\)\.updatedAt\s*==\s*request\.time/);

  // Master Gate on subcollection events
  assert.match(rules, /get\(\/databases\/\$\(database\)\/documents\/pvpRooms\/\$\(roomId\)\)/);
});
