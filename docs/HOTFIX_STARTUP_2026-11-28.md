# Production startup hang hotfix

Base: main `a1c46292d0b4aeb520356a9c0fdbc8189c57e1b6`; task branch `codex/fix-startup-hang`. This is separate from the unmerged security-hardening branch and preserves main's Trial Tower, Bestiary, classes and existing save/Firebase behavior.

## Root cause and fix

`questionBank.ts` generates grade-four arithmetic during module evaluation. A generated `40 - 9 × 8` gives -32. `buildNumericOptions` rejects negative distractors, then repeatedly clamps random candidates to 1. Its Set never reaches four entries, blocking the main JavaScript thread before React renders. This also affects later question generation during a run. All three new regression tests timed out against the original production source, including a deterministic reproduction and random batches.

Replace random retries with distinct ascending fallbacks; bound grade-four subtraction so its answer stays nonnegative. After repair all three tests pass, including over 4,000 questions across grades/semesters and a constant RNG. Existing 11 campaign/question/combat/progression/gamepad tests also pass (bundled via Vite SSR, then executed with Node test runner).

Add a visible HTML loading card, nonblocking external font stylesheet, missing-module/timeout recovery and a React render error boundary. Recovery reloads the page; it never deletes browser storage or resets a save. No Firebase project, authentication identity, cloud rules, game rewards or dependencies were changed.

## Validation

- Node 24.22.3: `node --test scripts/procedural-startup.test.mjs`: 3/3 pass; original source: 3/3 fail with VM execution timeout.
- `node node_modules/typescript/bin/tsc --noEmit`: pass.
- `node node_modules/vite/bin/vite.js build`: pass. Existing large chunk and Vite config-loader warnings remain.
- Existing TS tests bundled with Vite `build --ssr`, then `node --test` on both bundles: 11/11 pass. Direct tsx test execution was unavailable (`uv_os_get_passwd ENOMEM`); no application change was used to work around that environment limitation.
- `scripts/verify-startup-browser.mjs`: production build at 1440×1000 / 390×844, each loads with a stalled font request and survives 10 reloads; no uncaught errors in normal cases. Blocking entry JS shows retry UI; malformed local account data triggers render recovery without deleting either the original record or sentinel storage.
- Local screenshots/results under `.verification/` are excluded from the patch.

The original installed local dependencies were reused through a workspace junction; no fresh install/audit or complete security review was performed. This hotfix does not certify the entire application as production-ready. The existing security draft remains separate. Deploy through a focused PR against the inspected main head, check the head again before merging, and confirm the actual production Cloudflare build.
