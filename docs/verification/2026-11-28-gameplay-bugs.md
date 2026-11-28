# 2026-11-28 答題停滯與四科 BUG 檢查

Branch `codex/security-hardening`, base `824bb47a80d5dc457f382bed6a97362955cf04b1`.

## Findings and repairs

1. **Math feedback has an unclear resume path.** The enemy simulation deliberately freezes while a wrong-answer explanation is open; the only resume control was a small X. Added a full-width 48px “繼續防守” button, or “返回佈陣，準備開戰” before wave one. First-answer completion now explicitly directs the child to “開始第一波”; the safe manual-start rule remains. The shared explanation component now has an explicit continue action and scrolls on short screens.
2. **English mobile targets can be unreachable.** Drone and letter spawning used `Math.max(800, canvasWidth)`, placing answers outside a 320/390px screen. The old direction-flip rule could repeatedly flip an already-outside target without returning it to bounds. Spawn spacing now uses the actual width; movement clamps and turns targets inward. Spelling targets also fit short landscape height above the player ship.
3. **Science pause accepted temperature input.** The global Space listener could invoke temperature locking while the pause overlay was open. Ingredient, temperature and pH handlers now reject actions while paused or finished. This prevents hidden step changes during pause.

## Evidence and scope

- `scripts/verify-gameplay.mjs` exercises the real App/Auth/GameState/engine stack in isolated local accounts at **1440×1000 and 390×844**. Math: correct/wrong answers, explanation dismissal, actual zombie movement or next spawn, surviving Canvas loop, restart and exit. Science: wrong ingredient explanation, correct ingredient/temperature/pH sequence, Space while paused leaves the temperature step unchanged, serving twice in the same event still advances to another order/settlement. English: all four rendered answer labels are inside both viewports. Chinese: actual auto-path encounter, wrong and correct slash answer recovery on desktop. No uncaught errors.
- This did **not** reproduce an uncaught Math crash: in the tested flows, correct answers resume and wrong answers resume when the explanation is dismissed. The user's exact stuck screen/device has not yet been supplied. Do not claim a confirmed universal fix for every possible freeze.
- `scripts/verify-learning-ui.mjs`: truthful zero-answer results, actual accuracy, recent-mistake navigation, practice reward/progress isolation and one-time review reward passed.
- `scripts/verify-browser.mjs`: four-world entry/tutorial/pause/restart/exit, local-account isolation and no horizontal overflow at **1440×1000, 390×844, 320×740, 844×390** passed during this batch. Final targeted gameplay checks cover changed engine behavior; this is not every level or every combat outcome.
- New pure layout regressions cover 320/390/844/1440px widths, 4/6/10 targets, centered single targets and spelling height at 390/740/844/1000px.
- Final Node 24.22.3 validation: **53 tests**, TypeScript and Vite build pass; large JS chunk warning remains. Defense reading-protection/evolution/mission integration also rerun.

No Firebase rules/project/UID changes or save migration. External network calls are blocked by local browser fixtures. Firebase Emulator, all possible end-to-end victories/defeats, teacher review and low-end real-device performance remain outside this verification. No new art was generated in this bug-fix batch: the user's feedback on round body proportions and insufficient animation smoothness remains outstanding. GitHub sync and preview check follow validation; main stays unmerged.
