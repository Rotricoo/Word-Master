# JavaScript Architecture – Word Master

**Last Updated:** 10 April

> Note: This documentation reflects the state of the project at the time of writing. The architecture may have evolved after subsequent changes.

---

## constants.js

**Purpose:**  
Stores fixed values used throughout the game.

**Exports:**

- `ANSWER_LENGTH`
- `ROUNDS`

**Imports:**

- None

**Used By:**

- `hints.js`
- `game.js`

**Details:**  
Constants are fixed values that do not change during gameplay and are reused across multiple modules.

---

## domElements.js

**Purpose:**  
Centralizes all references to DOM elements.

**Exports:**

- `themeToggle`
- `levelBtn`
- `levelIndicatorText`
- `letters`
- `attemptCounter`
- `loadingOverlay`
- `levelModal`

**Imports:**

- None

**Used By:**

- `theme.js`
- `utilities.js`
- `level.js`
- `game.js`
- `main.js`

---

## state.js

**Purpose:**  
Stores the current game state in a single object.

**Exports:**

- `gameState`
  - `gameState.currentLevel`
  - `gameState.gameInProgress`
  - `gameState.discoveredLetters`

**Imports:**

- None

**Used By:**

- `level.js`
- `game.js`
- `main.js`

**Details:**  
The `gameState` object centralizes key game data such as difficulty level, progress status, and discovered letters.

---

## utilities.js

**Purpose:**  
Provides reusable helper functions.

**Exports:**

- `isLetter()`
- `makeMap()`
- `showTemporaryMessage()`
- `setLoading()`

**Imports:**

- `loadingOverlay` from `domElements.js`

**Used By:**

- `game.js`

**Details:**

- `isLetter()` → Validates if user input is a letter
- `makeMap()` → Converts an array into an object counting occurrences
- `showTemporaryMessage()` → Displays temporary UI feedback (e.g., invalid word)
- `setLoading()` → Controls the loading overlay visibility

---

## theme.js

**Purpose:**  
Manages light/dark theme and persists user preference.

**Exports:**

- `initTheme()`
- `toggleTheme()`

**Imports:**

- `themeToggle` from `domElements.js`

**Used By:**

- `main.js`

---

## level.js

**Purpose:**  
Handles difficulty selection, level modal, and UI updates.

**Exports:**

- `showLevelModal()`
- `cycleLevel()`
- `updateLevelDisplay()`

**Imports:**

- `levelModal` from `domElements.js`
- `levelIndicatorText` from `domElements.js`
- `gameState` from `state.js`
- `restartGame()` from `game.js`

**Used By:**

- `main.js`
- `game.js`

---

## modal.js

**Purpose:**  
Creates and controls the end-game modal.

**Exports:**

- `showModal()`

**Imports:**

- `restartGame()` from `game.js`

**Used By:**

- `game.js`

---

## game.js

**Purpose:**  
Core game logic and main gameplay flow.

**Responsibilities:**

- Initialize and restart the game
- Fetch words from API
- Handle user input
- Validate guesses
- Apply game rules
- Manage win/lose conditions
- Control timer and game flow

**Exports:**

- `init()`
- `restartGame()`

**Imports:**

- `constants.js`
- `domElements.js`
- `modal.js`
- `utilities.js`
- `state.js`
- `level.js`

**Used By:**

- `main.js`
- `modal.js`

---

## main.js

**Purpose:**  
Entry point of the application.

**Responsibilities:**

- Initialize the game
- Initialize theme
- Handle level selection interactions

**Exports:**

- None

**Imports:**

- `initTheme()` and `toggleTheme()` from `theme.js`
- `cycleLevel()` from `level.js`
- `init()` from `game.js`
- DOM elements from `domElements.js`
