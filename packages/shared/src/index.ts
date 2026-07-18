// Shared package: the pure game engine, types, card data, and network protocol
// all live here and are imported by both the server (authority) and the web client.
//
// Phase 0 only exposes a couple of constants so the scaffold has something real to
// import and test. The engine, types, and card data arrive in Phase 1.

/** Working title of the game (see directions.md). */
export const GAME_NAME = 'School Days';

/** Well-Being level a player must reach to win. */
export const TARGET_LEVEL = 5;
