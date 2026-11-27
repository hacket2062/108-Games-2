# Resume checkpoint / 關機後續作

Checkpoint date: 2026-11-27. User is shutting down and will resume later.

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
