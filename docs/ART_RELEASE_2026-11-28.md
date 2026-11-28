# Character and equipment artwork integration

Base: production main `f59e4bb7e5c183a5b0f48d89cf91a2b8ca04bba7`. Branch: `codex/release-current-art`. Artwork source: `codex/security-hardening` `4558321534d815bd87ea9af07073fce0ee8b5219`.

The startup hotfix restored the older production version. It did not include the generated character, equipment or motion atlases. This release integrates those existing assets through presentation adapters into current main; it does not replace main with the divergent security branch.

The lobby and forge show the generated hero and equipped weapon; forge route previews, inventory, equipment slots, shop and socketing use the equipment atlas. Current class branches map to the matching hero form. Chinese heroes/companions, English ships, Math towers/enemies and Science chefs render from the existing new atlases. Existing procedural art remains a fallback while images load. The fourth fox chef has no corresponding generated sprite and keeps its existing art.

Preserved modules: Trial Tower, Bestiary, hero progression, class advancement, roguelike systems, gamepad and multiplayer inputs, arithmetic startup repair, loading/retry UI and error boundary. No changes to save serialization, identity, Firebase configuration, cloud rules, competitive writes or reward calculations. Existing weapon inventory and class progression are checked in browser verification.

Local checks: TypeScript noEmit and production Vite build pass; startup regressions 3/3 pass; existing main tests 11/11 pass after Vite SSR bundling. Direct native execution cannot resolve main's non-type imports; the SSR bundles test the same application modules. Existing chunk/config-loader warnings remain.

`scripts/verify-release-art.mjs` checks every atlas against its source SHA-256, visible lobby/forge art, all four worlds' actual Canvas image draws, three reloads per desktop/phone viewport, retained Trial Tower/Bestiary, and preservation of weapon/class records. The workflow runs against a local production build; `RELEASE_TARGET_URL` selects a deployed URL for a separate post-release run. External browser requests are blocked; it does not test Google sign-in or write player cloud data.

Cloud/browser verification and actual deployment are pending at preparation time. Do not equate a loaded lobby with verification of the correct artwork version. Unrelated security branch requirements remain open; this does not claim the overall roadmap is complete.
