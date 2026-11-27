# Resume checkpoint / 關機後續作

Checkpoint date: 2026-11-27. Resumed for Node/dependency validation and a child-friendly adventure hub upgrade.

## Latest checkpoint (read this first)

- **Second experience batch, base `abe1bf1`:** added per-subject preflight instructions before engine mount, help in pause/map screens, consistent free-practice selection, practice/campaign progress separation, truthful no-answer feedback and review/practice result actions. Current evidence: `docs/verification/2026-11-27-experience.md`; 29 native tests, typecheck/build and four viewport browser checks pass; real provider fixture confirms practice Boss cannot write campaign progress/chest weapons/crystals/quest.
- User successfully pushed `abe1bf1`. GitHub App repository selection/read-write permissions were then verified in UI, and connector branch-ref writes succeeded. Use connected GitHub Git-data tools with expected-head checking if the shell remains unable to reach GitHub; never force-push or overwrite a newer remote head.
- Gemini app exists, but the latest native-app access approval timed out. Review request was not sent. `docs/GEMINI_REVIEW_REQUEST.md` contains the prepared brief, explicitly not Gemini's response. Continue independent work and incorporate actual feedback when user provides it or grants a working route.
- Earlier shutdown/push-blocker notes below are historical; dependency installation/post-fix audit remains unresolved. No production deployment is authorized.

- Branch/base remain below; current work started at local commit `83ff37c`. This batch has now been committed locally. A user-authorized push was attempted: Git could not connect to github.com:443, and the connected GitHub create-branch tool returned HTTP 403 `Resource not accessible by integration`. No upload or production deployment succeeded. From the user's normal authenticated PowerShell, run `git push -u origin codex/security-hardening`; do not force-push. Keep any eventual PR in draft while dependency installation/audit and P1 release checks remain open.
- Read `docs/verification/2026-11-27-local-validation.md` and the latest section in `docs/IMPLEMENTATION_STATUS.md` for current evidence. Older notes below describe the shutdown state.
- Node **24.22.3** works via the Codex-bundled executable below. `tsc --noEmit`, **25 tests / 0 failed**, and Vite **8.4.0** production build now pass. TypeScript index errors fixed with literal tuples; no `any` bypass.
- `scripts/verify-local.ps1 -NodePath <node-executable>` checks the version and each exit code. Project requires **Node >=24.12.0** because of installed Firestore. The Windows system default Node has not been changed.
- Adopt **npm + package-lock.json**. Removed the stale `bun.lock`; do not regenerate it or run concurrent installers.
- User supplied `dependency-audit.json`: **4 high**, one transitive gRPC chain. Root override now pins **@grpc/grpc-js 1.13.6**, based on official advisories. **Still awaiting user-run `npm install` and replacement audit report** because the managed shell cannot access npm or reach registry.npmjs.org. Do not claim remediation complete while installed gRPC is still 1.9.16. Do not use audit fix --force (it suggested downgrading Firebase to 9.14.0).
- New hub includes original vector world postcards, next unlocked stage quick-start, real progress bars and a readable companion area. Fixed save-status layer visibility and old multiplayer promises. Five engines load on demand; main JS fell from ~1,340.35 kB to ~1,194.05 kB (gzip ~411.97 → ~373.13 kB); chunk warning remains.
- Four engines' pause-menu restart now starts a new run of the same stage instead of leaving. Old run is invalidated. Exit label now says return to chapter map.
- Chrome **production-build** checks passed at **1440×1000 / 390×844 / 320×740 / 844×390**: four world maps and engines, quick start, pause/resume/restart/exit, local student grade isolation, no horizontal overflow or uncaught JS errors. Screenshots and JSON are in `.verification/` (ignored); runner in `scripts/verify-browser.mjs`. External requests were blocked: these do not validate Firebase or online flows.
- Gemini review was not executed; no available Gemini CLI/text-review connector was found. User welcomes its review if a usable route becomes available, but do not claim one occurred.
- Next required step: finish dependency installation in the user's normal PowerShell; inspect new lockfile and audit, then rerun local verification/browser checks if dependency changes warrant it. Preserve the initial audit in `docs/verification/dependency-audit-before.json`.
- After this batch, continue cloud-conflict/rapid-serving/mistake reward browser tests and real Emulator authorization/dual-client tests. Existing P1 backend/rules and flagship roadmap remain open.

## Location and branch

- Repository: `D:\108課綱遊戲\108-Games-2`
- Remote: `https://github.com/hacket2062/108-Games-2.git`
- Branch: `codex/security-hardening`
- Original base: `faf9aefc137f6ccfab5cfa7d3e341689d6c5eec2`
- Do not use the earlier ZIP directory `108-Games-2-main` as the active source.

## Scope and authorization

- User wants all requirements in `docs/Google_AI_Studio_全面修復_PROMPT.md` implemented progressively, including security, learning features, multiplayer, visuals and Boss stories.
- Preserve Firebase project `games-2-c3050`, Google sign-in, user UIDs and player data.
- User explicitly authorizes syncing code to GitHub for shared development with Google AI Studio. No production deploy or production data changes have been authorized.
- Read `AGENTS.md` and `docs/IMPLEMENTATION_STATUS.md` before editing.

## Current implementation

The first batch includes player save validation/full serialization, load barriers and cloud conflict protection, synchronous state transitions, account/session isolation, duplicate reward/serving prevention, session timer cleanup, equipment effects, chest config corrections, parent PIN bypass removal, optional analytics off, and a guarded AI-only practice arena.

**This batch is work in progress, not a production-ready release.** The old Firestore PvP write rules are NOT yet hardened/deployed. New frontend entry guards do not repair the old server rules. The authoritative match backend and most flagship features remain open; see the detailed status table.

## Last verified checks

- Node 24 native runner executed 21 tests: all passed. Includes the legacy rules text smoke test; it does NOT verify real Firestore permissions.
- Command: `node --import ./scripts/register-typescript.mjs --test src/core/combatMath.test.ts src/core/campaignAndQuestions.test.ts src/core/saveIntegrity.test.ts src/core/sessionScheduler.test.ts firestore.rules.test.ts`
- Some later React/Auth/privacy/UI changes have not been type-checked or browser-tested yet.
- `git diff --check` previously identified one extra blank line at EOF in `src/core/firebase.ts`; normalize it when resuming if still present.

## Dependency installation at shutdown

- Initial `npm install` failed: Vite 8.4.0's optional esbuild peer did not accept the root esbuild 0.25 constraint.
- No direct project usage of esbuild was found. Removed the unnecessary direct esbuild entry from `package.json`; did not use force or legacy-peer-deps.
- User started `npm install` again in their own PowerShell. Latest npm debug log was `C:\Users\SD007\AppData\Local\npm-cache\_logs\2026-11-27T04_02_51_597Z-debug-0.log`.
- Downloads were progressing with HTTP 200, individual packages taking up to about 63 seconds. Do not infer the install was stalled just because terminal output was quiet.
- `node_modules` was being created; no completed `package-lock.json` was observed yet. Shutdown may leave a partial install. Resume with one `npm install`, then verify exit status; do not start parallel installs or delete player data.
- Do not use partially installed dependencies to claim build/typecheck success.
- The Codex shell could not reach the npm registry or github.com; the user's normal PowerShell could. Do not bypass managed network restrictions.

## GitHub sync blocker

- Connected GitHub tools can read the repository and show repository-level push permission, but `create_branch` returned HTTP 403 `Resource not accessible by integration`.
- No remote repair branch or PR was successfully created. Do not claim modifications were uploaded.
- Local Git clone succeeded when the user ran it. After the checkpoint and checks, the user may need to run `git push -u origin codex/security-hardening` from their own authenticated PowerShell, or use GitHub Desktop.
- Do not force-push or overwrite main. Prefer draft PR until release checks pass.

## First actions after reboot

1. Confirm location, `git status`, current branch and latest local checkpoint commit. Preserve any new changes made by the user or AI Studio.
2. Run/finish `npm install` in the repository. Inspect only relevant current errors if it fails. Adopt a clear lockfile policy once installation succeeds; old `bun.lock` is currently not updated for the manifest changes.
3. Run `npm run typecheck`, `npm test` and `npm run build`. Fix all real errors before adding more features.
4. Add browser tests for save conflicts/account switching, rapid serving, wrong notebook and exit/pause/retry; unit tests do not validate these TSX flows.
5. Verify cloud save transactions with Emulator/dual clients; add authoritative PvP backend and secure rules before enabling real matches.
6. Push the branch once a write-capable Git route is available, clearly marking incomplete checks, then continue the 60-requirement roadmap.

## Available toolchain

- Git: `C:\Program Files\Git\cmd\git.exe`
- A working Node executable was available at `C:\Program Files\WindowsApps\OpenAI.Codex_26.1120.6357.0_x64__2p2nqsd0c76g0\app\resources\cua_node\bin\node.exe` (v24.22.3). App update may change the path; rediscover rather than assume.
- The `C:\nvm4w\nodejs` symlink target was inaccessible in the managed shell, though the user's interactive npm worked.

## Communication

User values concrete progress, honest test evidence and preserving children's learning progress. Clearly distinguish written code, passed tests, unverified changes, local commits, remote pushes and production deployment. Never say the entire prompt is implemented or the game is safe to launch when only the first batch is done.
