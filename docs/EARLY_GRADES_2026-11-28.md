# Grades 1–2 and readable Science workbench

Branch: `codex/early-grades`. Base: production main `02d44d8fa1c6852662f11c44cd5694186d18027f` (deployed ghost fix).

User correctly identified missing grades 1–2. Add both selectors, grade-specific chapter topics and 260 initial low-grade question records: each grade has 32 Chinese (phonetics, short reading, basic parts, typo), 32 optional English initiation (listening and short spelling), 40 arithmetic and 26 life observation questions. Arithmetic refreshes per stage within 10/20 (grade 1 upper/lower) or 100 (grade 2); early grades no longer fall back to the other semester's bank. This is an initial content set, not a claim of exhaustive curriculum coverage or teacher review.

For early grades, the Science world is labeled life observation and English optional initiation. Life tasks skip advanced temperature/pH mini-games and require a real selected answer followed by confirmation. No automatic guardian answer bypass. Add 45-second initial life budget. Preserve all older grade content, saved inventories, user IDs, Firebase configuration and all existing progress keys. New stage keys include g1/g2 and do not replace g3–g6 progress.

Science controls now show the active step at full width, complete wrapping labels, readable choice buttons and an expandable next-order preview. Duplicate serve actions are synchronously locked. This also addresses the user's unreadable Science screenshot. Source: https://www.naer.edu.tw/upload/1/19/doc/361983921.pdf (low-grade life curriculum and English timetable).

Local verification: TypeScript noEmit, Vite production build, 17 tests passed. The wider unpublished follow-up branch also passes 34 pure tests; its weapon grip/fusion, level towers, boss/ranged and adaptive timer work is preserved in `108-Games-2-ghost-fix` and is NOT part of this focused release. Thematic shop expansion, English hangar and tower economy/fusion are still outstanding there. Do not mark those released.

Cloud verification pending: fresh npm ci, typecheck, tests, build, four viewport browser checks for all worlds, grade selection persistence and actual life-answer completion. Production deployment and post-release checks must be recorded after success. Existing Vite config-loader and bundle-size warnings remain; no rules changes or cloud user data writes.
