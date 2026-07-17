# **School Days(please change this name i just cant think of anything else)**

## **Goal of the Game**

Your objective is to be the **first player to reach Well-Being Level 5**.

The main ways to gain levels are:

* Solving situations  
* Playing "Increase Well-Being level" cards  
* Certain card effects

---

# **Game Setup**

Each player receives:

* 4 Experience cards  
* 1 random character (we could outline traits here) card

Everyone starts:

* Level 1  
* No Clubs  
* No Strengths  
* No Friends

Before the game begins, you may play:

* One Club  
* Rank 1 Strengths  
* One Friend

Everything else stays in your hand.

---

# **The Turn Structure**

Every turn has four parts.

## **1\. Face a situation**

Draw one situation card face-up.

Several things can happen.

### **If it's a “bad situation”**

Go solve it immediately.

---

### **If it's a “mess-up”**

The mess-up happens immediately.

Examples:

* Lose Level(s)  
* Lose Strengths   
* Discard cards

---

### **If it's anything else**

Put it into your hand.

Then choose either:

* Solve a problem  
* Gain problem-solving ability

---

## **2\. Solve a problem (Optional)**

Instead of ending your turn, you may play a situation from your hand and solve it.

Players often do this if they're strong enough.

---

## **3\. Gain Problem-solving ability**

If you didn't have to solve a situation this turn,

Draw one experience card face-down.

---

# **Problem-solving**

Problem solving is:

* Player Level  
* Strength bonuses  
* Club bonuses  
* Friend bonuses  
  vs.  
* Situation Level  
* Situation Enhancers (what’s different/what do you need to know about the situation)

Example:

Your Level: 5

Strength 1: \+3

Strength 2: \+4

Friend: \+2

Total \= 14

Situation \= Level 11

You win.

---

If your total is equal to or lower than the situation,

You lose unless you improve your strength before the turn ends.

---

# **Asking for Help**

You may ask **one player** to help.

If they agree:

Both players combine their strengths/skills.

Usually, you'll promise experience cards as payment.

Example:

Situation rewards 4 experience cards.

You promise your helper 2\.

If you win:

You still gain all Levels.

Only Experience is shared.

---

# **If You Lose**

You couldn’t solve the situation.

You will suffer the situation's Consequences.

Examples:

* Lose Levels  
* Lose Experience card(s)

---

# **Every Card Type**

---

# **Situation Cards**

Door cards start combat and contain most of the game's special abilities.

---

## **Situations (maybe 20 unique)**

These are problems you solve.

Each situation has:

* (Difficulty) Level  
* Experience card/contentness reward  
* Level/well-being reward  
* Consequences if you lose  
* Special abilities

---

## **Mess-up Cards (maybe like 4-5 unique)**

Examples:

* Lose an Item  
* Lose an Experience card  
* Lose Levels  
  * (of course it will actually be themed to fit the game but these are what they can do)

If drawn face-up,

They happen immediately.

If held in your hand,

---

## **Club Cards (5-10 unique)**

You may normally have:

One Club.

Clubs provide:

* Special abilities  
* Restrictions  
* Bonuses

You may discard a Club at any time.

---

## **Go Up A Level Cards (3-4 unique)**

Exactly what they sound like.

Gain one level instantly.

Usually cannot win the game unless the card says otherwise.

---

# **Experience Cards**

Experience come from solving situations.

---

## **Strengths (8 (from Gardner’s Theory)** **\- 20 if we can find more)**

Strengths provide permanent bonuses.

Examples:

(stuff from Gardner’s Theory of Multiple Intelligences)

They usually give:

\+1

\+3

\+5

etc.

---

## **Friends (6 unique)**

Normally,

You may have one friend

Friends:

* Provide bonuses  
* Sometimes have special skills  
* Some cards let you have multiple friends.

---

# **Character Cards (4 unique)**

Every player has one.

These are never discarded.

They give a permanent passive ability.

Each Character also has a male and female side.

Examples include small bonuses such as interactions with card types.

---

# **Winning the Game**

You win immediately if:

* You reach Level 5  
* The final level comes from solving a situation

Not from:

* Most Go Up A Level cards  
* Most mess-up effects

---

# **Quick Reference**

| Card Type | What it Does |
| ----- | ----- |
| Situation | Solve it to gain Levels and more Experience cards |
| Mess-up | Hurts a player immediately or when played |
| Club | Your community (with a special ability in-game) |
| Go Up A Level | Gain one Level instantly |
| Strengths | (usually) Permanent bonus |
| Friend | Companion that helps in combat |
| Character | Permanent character ability for the whole game |

Once you've played a round or two, the flow becomes very natural: **Face a situation → Solve or find a situation to solve → Gain problem-solving ability → Gain strengths → Be the first to solve a situation at Level 4 and reach Level 5\.**

**Coding Plan:**

Build the structure for a responsive, online, web-based multiplayer card game for 2–4 players. Integrate it into the existing website without changing unrelated pages or assets. Do not inspect, process, or use any mascot images.

Use placeholder cards and placeholder artwork only. The actual card images, names, descriptions, bonuses, rewards, and effects will be added later. Store all card definitions in editable JSON or TypeScript data files so cards can be replaced or modified without rewriting the game engine.

Create placeholders for:

* 20 unique Situation cards  
* 4–5 unique Mess-Up cards  
* 7 unique Club cards  
* 3–4 unique Go Up a Level cards  
* 8 unique Strength cards, representing Howard Gardner’s eight Multiple Intelligences  
* 6 unique Friend cards  
* 4 unique Character cards

Core rules:

* Each player starts at Well-Being Level 1\.  
* The first player to reach Level 5 wins, but the final level must normally come from successfully solving a Situation.  
* Each player starts with 4 Experience cards and 1 random Character.  
* Before the game begins, a player may activate one Club, one Friend, and any Rank 1 Strength cards.  
* Default limits are 1 Character, 1 Friend, 1 Club, and unlimited Strengths.  
* On each turn, the player chooses either to draw from the Situation deck or solve a Situation already in their hand.  
* When drawing, Situation cards go into the player’s hand. Mess-Up cards resolve immediately and are discarded.  
* To solve a Situation, calculate:

`Player Level + Strength bonuses + Friend bonus + Club bonus`

* The player succeeds only if the total is greater than the Situation difficulty.  
* On success, award the listed Experience cards and Well-Being Levels.  
* On failure, apply the Situation’s consequences.  
* A player may ask one other player for help. Their totals are combined. The active player receives all Level rewards, while Experience rewards are split according to a selected agreement.  
* Go Up a Level cards increase Well-Being Level but normally cannot provide the winning level.  
* Automatically manage turn order, rewards, consequences, active bonuses, victory detection, discard piles, and deck reshuffling.

Create separate Situation and Experience decks with matching discard piles. Build the game using a centralized, authoritative game state suitable for online multiplayer. Include a lobby or room structure, player joining, ready status, turn synchronization, reconnect handling, and validation so players cannot perform illegal actions or edit another player’s private state.

Keep game logic separate from the interface. Implement card effects through reusable, data-driven effect definitions rather than hardcoded card-specific functions wherever possible.

The interface should include:

* Lobby and player setup  
* Current player and turn indicator  
* Player level, character, club, friend, strengths, bonuses, and hand size  
* Private Situation and Experience hands for the local player  
* Draw, Solve, Play Card, Ask for Help, Accept/Decline Help, and End Turn controls  
* Current Situation display  
* Ability-versus-difficulty calculation  
* Reward, consequence, and game-event messages  
* Placeholder card graphics with labels showing card type and placeholder number

Use a clear folder structure for UI components, game engine logic, multiplayer/networking, state management, card data, types, and placeholder assets. Add comments or documentation explaining exactly where future developers should insert the final card images and edit each card’s statistics, text, abilities, rewards, and consequences.

