# Shared development rules for Codex and Google AI Studio

- Preserve Firebase project `games-2-c3050`, existing Google sign-in and user UIDs. Never reset player data to make migrations easier.
- Read `docs/IMPLEMENTATION_STATUS.md` and `docs/Google_AI_Studio_全面修復_PROMPT.md` before editing. Update the status with actual evidence, not intentions.
- Work on a task branch (`codex/...` or `ai-studio/...`). Start from the intended current base; inspect uncommitted changes and do not overwrite another agent's work.
- Do not force-push shared branches. Integrate through pull requests; keep incomplete/security-sensitive work in draft. Pushing code does not authorize production deployment, changing cloud data, or enabling paid services.
- Never place secrets or Firebase Admin credentials in browser code, VITE variables, logs, commits or screenshots.
- Personal practice saves remain untrusted. Do not feed them into authoritative competitive ratings or use a client feature flag to re-enable the old PvP write protocol.
- Native pure-logic tests: Node 24+, `npm test`. These tests are not a TypeScript check, production build, browser E2E or Firebase Emulator validation.
- Also run `npm run typecheck` and `npm run build` after dependencies are installed. State explicitly which checks could not run and why.
- Rules changes require real Emulator allow/deny tests before release. Regex/text-presence tests alone do not prove authorization or query compatibility.
- For each handoff record branch/base, touched modules, completed requirements, outstanding requirements, exact test results and migration/deployment implications.
- The 60 requirements in the full prompt are the overall roadmap, not a claim that any individual PR completes them all. Do not label a release production-ready while P1 issues or required checks remain open.
