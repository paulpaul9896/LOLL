# Security Spec for Wild Rift Companion

## Data Invariants
1. `matches` must have valid players, result, and a `savedBy` email matching the requester.
2. `friends` must have a name, roles array, and favoriteChampions array.
3. `appConfig/settings` must only contain `geminiKey` and `updatedAt`.
4. Anyone who is a verified signed-in user can view matches and friends (shared squad context).

## Dirty Dozen Payloads
1. Create Match with missing timestamp.
2. Create Match with missing players array.
3. Create Match with an invalid result string.
4. Update Match with a ghost field (`isAdmin: true`).
5. Update Match modifying the `savedBy` field.
6. Create Friend with missing name.
7. Create Friend with invalid type for roles (string instead of list).
8. Create Match with over 5 players.
9. Query list Matches without being signed in.
10. Update appConfig with unrelated ghost fields.
11. Send excessive ID string length (>128).
12. Attempt to create an AppConfig doc outside `settings`.

The rules will strictly limit schema structure to prevent these payloads.
