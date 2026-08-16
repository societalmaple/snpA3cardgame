# **Solve It!**

An online, real-time **multiplayer web card game for 2–4 players**. This document
describes the game as implemented. Cards, names, and artwork are **placeholders**;
all card content lives in editable data files under `packages/shared/src/cards/data/`
(see [`docs/adding-cards.md`](./docs/adding-cards.md)).

## **Goal of the Game**

Be the **first player to reach Well-Being Level 15** — but the winning level must
come from **solving a Situation**, never from a Go-Up-A-Level card or a Mess-Up.

The main ways to gain levels:

* Solving Situations
* Playing "Go Up A Level" cards (these can never be the winning level)

---

## **Game Setup**

* **2–4 players** join a room, mark themselves ready, and the host starts.
* Before the first turn, every player **chooses a Character** from the pool. Each
  Character is unique, so no two players may pick the same one.
* Each player starts at **Level 1** with **4 Experience cards** dealt at random
  (Strengths, Supports, Self-Advocacy, Friends, or Clubs).
* No player starts with a Club, Strength, Friend, or Support equipped; you equip
  them from your hand during play.

**Default equip limits:** 1 Character, 1 Friend, 1 Club, up to 2 active Supports,
and unlimited Strengths.

**Hand limit:** you may hold at most **6 cards** across both hands (Situation +
Experience). If a draw or reward pushes you over, you discard down and choose what
to keep.

---

## **The Turn Structure**

Each turn has a beginning, a combat step, and a main phase.

## **1\. Beginning of your turn**

Choose **one** of these:

* **Draw a Situation** from the Situation deck, or
* **Take on a Situation** you're already holding in your hand.

### **If you draw a Situation card**

You **face it immediately** and enter combat (step 2). You do not put it in your
hand first.

### **If you draw a Mess-Up card**

It happens **immediately** (it represents an environmental or support barrier, not
a personal failure). You may usually **mitigate** it with a matching Support,
Self-Advocacy card, Strength, or Friend. If you can't (or choose not to), you take a
small **temporary penalty** on your *next* Situation — never a permanent loss.

### **If you draw a Go Up A Level card**

It goes into your **Situation hand** to play later. It can raise your level but can
never be the winning level.

## **2\. Combat (solving a Situation)**

A Situation has a **base difficulty** plus any temporary penalty carried over from an
unmitigated Mess-Up. Your **total** is your equipped **Strength + Friend + Club**
bonuses — **your Level does not count**. You win when `total ≥ modified difficulty`.

The **modified difficulty** is the base difficulty reduced by **any valid approach**
you bring:

* a **relevant Strength** that fits the Situation,
* an **active Support / Accommodation** (up to 2 equipped) that removes a barrier,
* a **Self-Advocacy card** played during combat that addresses the barriers,
* a **Friend or Club** (or your **Character** ability) that matches the barrier,
* an **environmental change** the card unlocks.

There is never a single "correct" answer; different approaches are useful in
different contexts. The screen shows your approach and the modified difficulty.

**Win** → gain the listed Levels and Experience cards. Solving via a matched
Strength, Support, or Self-Advocacy also **discovers** a new approach (an extra
Experience card). Your equipped **Strengths are consumed** when you solve a Situation
(Friends and Clubs stay).

**Lose** → suffer the Situation's **Consequences**. A discard consequence lets you
choose what to lose, including equipped cards; some consequences can be cancelled
with Self-Advocacy.

## **3\. Main phase**

Before resolving you may **equip or unequip** Strengths, Friends, Clubs, and Supports
from your hands, or **ask another player for help** (their bonuses join yours).

* If you end your turn without entering combat, you **draw one Experience card**
  instead ("gain problem-solving ability").

---

# **Asking for Help**

You may ask **one other player** to help you during combat.

If they agree:

* Their bonuses and valid approaches are combined with yours.
* The active player keeps **all Level rewards**.
* **Experience rewards are split** according to the agreement you offered.

---

# **Every Card Type**

## **Situation Cards** (20 unique)

The problems you solve. Each has:

* a base difficulty
* one or more **barriers** (noise, crowding, time pressure, unclear instructions, …)
* valid Strengths, Supports, and Self-Advocacy options
* a reward (Levels + Experience)
* consequences if you lose
* special abilities (alternate/environmental solutions, teamwork eligibility)

## **Mess-Up Cards** (5 unique)

Environmental or support barriers drawn from the Situation deck. They resolve
immediately and are usually **mitigable**; without mitigation they impose only a
small temporary penalty on your next Situation.

## **Go Up A Level Cards** (4 unique)

Raise your Well-Being Level instantly. They can **never** provide the winning level
(level gains from these are capped below the target).

## **Club Cards** (7 unique)

A supportive community. You may have **one** Club equipped at a time. Clubs come from
**Experience draws**, not the Situation deck, and provide a combat bonus plus
community effects. They are **not consumed** when you solve a Situation.

## **Experience Cards**

Experience cards come from solving Situations and from drawing in the main phase.
They are dealt from the Experience deck, which contains:

### **Strength Cards** (8 unique, Howard Gardner's Multiple Intelligences)

A modest base bonus plus a **contextual** effect; they shine when they fit the
Situation. Equipped Strengths are **used up** when you solve a Situation. You may
equip as many as you like.

### **Support / Accommodation Cards** (10 unique)

Tools and environmental changes that remove barriers (Quiet Workspace, Written
Instructions, Extra Processing Time, …). Not "power-ups": they change the conditions
so existing abilities can be used. Up to **2** may be active at once.

### **Self-Advocacy Cards** (6 unique)

One-shot cards you play while facing a Situation ("Can I Have That in Writing?", "I
Need More Processing Time", …). Asking for a support is a skill, not a failure.

### **Friend Cards** (6 unique)

A companion providing a combat bonus and support effects. You may have **one**
Friend equipped at a time. Friends are **not consumed** when you solve a Situation.

## **Character Cards** (4 unique)

Chosen during setup, one per player, and **never discarded**. They give a permanent
passive ability (e.g. Hyperfocus) that can unlock alternate solutions or bonus
power in matching Situations.

---

# **Winning the Game**

You win immediately if:

* You reach **Level 15**, **and**
* The final level comes from **solving a Situation**.

You do **not** win via:

* Go Up A Level cards (capped below the target)
* Mess-Up effects

---

# **Quick Reference**

| Card Type | Deck | What it Does |
| ----- | ----- | ----- |
| Situation | Situation | Solve it to gain Levels and Experience |
| Mess-Up | Situation | Environmental barrier; mitigate it or take a small temporary penalty |
| Go Up A Level | Situation | Gain one Level instantly (never the winning level) |
| Club | Experience | Your community; combat bonus, up to 1 equipped |
| Strength | Experience | Bonus + contextual effect; consumed when you solve a Situation |
| Support / Accommodation | Experience | Removes barriers; up to 2 equipped |
| Self-Advocacy | Experience | One-shot card played during combat |
| Friend | Experience | Companion that helps in combat; up to 1 equipped |
| Character | setup | Permanent ability for the whole game |

**The flow becomes natural quickly:** Choose a character → draw (or take on) a
Situation → equip or ask for help → solve it with a valid approach → gain levels,
Experience, and discoveries → be the first to reach Level 15 by solving a Situation.

---

# **Implementation Notes**

* The game uses a **pure, deterministic engine** (`packages/shared/src/engine/`) with
  a seeded PRNG, so games are reproducible.
* The **server is authoritative**; clients only ever see their own hands, and
  opponents are reduced to public info + hand counts.
* **Card effects are data-driven** (`Effect` descriptors interpreted by
  `engine/effects.ts`); there is no per-card code. Add or change cards by editing the
  data files only, see [`docs/adding-cards.md`](./docs/adding-cards.md).
* **Combat math** lives in `engine/bonuses.ts`: equipped Strength + Friend + Club
  bonuses vs. modified difficulty (Level never counts).
* Tunables (target level, hand limit, starting hand, player bounds) live in
  `packages/shared/src/constants.ts`.
* **Discard handling**: a draw over the hand limit triggers a `limit` discard task
  (hand cards only); a "discard N" consequence triggers a `count` task payable from
  hand *or equipped* cards. Both route through the `discard` phase.