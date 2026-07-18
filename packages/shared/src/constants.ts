// Core game constants. Tweak these to rebalance the game without touching logic.

/** Working title of the game (see directions.md). */
export const GAME_NAME = 'School Days';

/** Well-Being level a player must reach to win. */
export const TARGET_LEVEL = 15;

/** Level every player starts at. */
export const STARTING_LEVEL = 1;

/** Number of Experience cards dealt to each player at setup. */
export const STARTING_EXPERIENCE = 4;

/**
 * Maximum cards a player may hold across both hands (Situation + Experience). When a
 * draw pushes a player over this, they must discard down — choosing what to keep.
 */
export const HAND_LIMIT = 6;

/** Player count bounds. */
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** Default equip limits (see directions.md — Strengths are unlimited). */
export const MAX_FRIENDS = 1;
export const MAX_CLUBS = 1;
