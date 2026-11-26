# Firestore Security Specification — 智光守護者：108 學園大冒險

## 1. Data Invariants
1. **User Save Isolation**: `/users/{userId}` documents can only be read, created, updated, or deleted by the verified authenticated user whose `request.auth.uid == userId`. No `list` access is granted so accounts cannot be scraped.
2. **PvP Room Creation & Ownership**: `/pvpRooms/{roomId}` can only be created in `status == 'waiting'` with `hostUid == request.auth.uid`, empty `guestUid == ''`, empty `winnerUid == ''`, and server timestamps `createdAt == request.time && updatedAt == request.time`.
3. **PvP Room State Machine & Terminal Locking**:
   - Join transition (`waiting` → `playing`) only permits a non-host authenticated user to set `guestUid = request.auth.uid` and guest loadout fields.
   - Combat sync transitions (`playing` → `playing | finished`) only permit `hostUid` or `guestUid` to update combat HP/score/combo/status/winnerUid/updatedAt.
   - Once `status == 'finished'`, all subsequent updates are strictly denied.
4. **Master Gate on Subcollection**: `/pvpRooms/{roomId}/events/{eventId}` verifies the parent room exists, `status == 'playing'`, and `request.auth.uid` is either `hostUid` or `guestUid`, and requires `senderUid == request.auth.uid`. Events are immutable (no update/delete).

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Cross-User Save Read**: User B attempts `get /users/{userA}`.
2. **Shadow Field Injection on User Save**: User A writes `/users/{userA}` with extra key `isAdmin: true`.
3. **UID Spoofing on User Save**: User A creates `/users/{userA}` with `uid: 'userB'`.
4. **Timestamp Forgery**: User A writes `/users/{userA}` with client timestamp `updatedAt: 1700000000` instead of `request.time`.
5. **Unverified Email Write**: Authenticated user with `email_verified: false` writes `/users/{uid}`.
6. **Oversized Document ID Poisoning**: Attacker writes `/pvpRooms/${'A'.repeat(200)}` or non-alphanumeric ID `room/../hack`.
7. **Self-Join PvP Room**: Host tries to join their own waiting room (`guestUid == hostUid`).
8. **State Shortcutting on Room Create**: Attacker creates `/pvpRooms/ABCD12` directly in `status: 'finished'` with `winnerUid: attackerUid`.
9. **Terminal State Mutation**: Participant updates `winnerUid` or `hostScore` after `status == 'finished'`.
10. **Host Identity Hijack**: Guest attempts to modify `hostUid` or `questionSeed` during a match update.
11. **Spectator Event Injection**: Non-participant User C attempts to create an attack event in `/pvpRooms/{roomId}/events/{eventId}`.
12. **Event Spoofing / Tampering**: Guest creates an event with `senderUid: hostUid` or attempts to update/delete an existing event.
