import { ANSWER_LENGTH, ROUNDS } from "./constants.js";
import { letters, attemptCounter } from "./domElements.js";
import { showModal } from "./modal.js";
import { isLetter, createLetterCountMap, setLoading } from "./utilities.js";
import { showTemporaryMessage } from "./interface.js";
import { gameState } from "./state.js";
import { showLevelModal, updateLevelDisplay } from "./level.js";
import { applyHintsToAllRows } from "./hints.js";

// GAME LOGIC
// Core game functions: initialization, restart, and main game loop
// =====================================

export function restartGame() {
  gameState.gameInProgress = false;
  gameState.discoveredLetters = {};

  letters.forEach((letter) => {
    letter.innerText = "";
    letter.className = "scoreboard__letter";
  });

  document.querySelector(".header").classList.remove("header--winner");
  init();
}

export async function init() {
  // =====================================
  // GAME SETUP
  // =====================================

  await showLevelModal();
  updateLevelDisplay();
  gameState.gameInProgress = true;

  let currentGuess = "";
  let currentRow = 0;
  let isLoading = true;
  let done = false;
  gameState.discoveredLetters = {};

  setLoading(true);

  // FETCH WORD FROM API

  const res = await fetch(
    "https://words.dev-apis.com/word-of-the-day?random=1",
  );
  const resObj = await res.json();
  const word = resObj.word.toUpperCase();
  const wordParts = word.split("");

  setLoading(false);
  isLoading = false;

  // =====================================
  // APPLY DIFFICULTY HINTS
  // =====================================

  applyHintsToAllRows(word);

  // Register hints as discovered letters
  if (gameState.currentLevel === "easy") {
    gameState.discoveredLetters[0] = word[0];
    gameState.discoveredLetters[1] = word[1];
    currentGuess = word[0] + word[1];
  } else if (gameState.currentLevel === "medium") {
    gameState.discoveredLetters[0] = word[0];
    currentGuess = word[0];
  }

  // DISCOVERED LETTERS SYSTEM
  // Manages letters discovered by the player during gameplay

  function applyDiscoveredLetters(row) {
    for (let position = 0; position < ANSWER_LENGTH; position++) {
      if (gameState.discoveredLetters[position]) {
        const letterElement = letters[row * ANSWER_LENGTH + position];
        letterElement.innerText = gameState.discoveredLetters[position];

        // Different styling for original hints vs player discoveries
        if (
          (gameState.currentLevel === "easy" && position < 2) ||
          (gameState.currentLevel === "medium" && position < 1)
        ) {
          letterElement.classList.add("scoreboard__letter--correct");
        } else {
          letterElement.classList.add("scoreboard__letter--discovered");
        }
      }
    }
  }

  function updateAllRowsWithDiscoveries() {
    for (let row = 0; row < ROUNDS; row++) {
      applyDiscoveredLetters(row);
    }
  }

  // =====================================
  // GAME STATE FUNCTIONS
  // Functions that handle player input and game state updates
  // =====================================

  function updateAttemptCounter() {
    attemptCounter.textContent = `Attempt: ${currentRow + 1}/${ROUNDS}`;
  }

  updateAttemptCounter();

  function addLetter(letter) {
    if (currentGuess.length < ANSWER_LENGTH) {
      const targetPosition = currentGuess.length;

      if (gameState.discoveredLetters[targetPosition]) {
        // Skip discovered positions automatically
        currentGuess += gameState.discoveredLetters[targetPosition];

        if (currentGuess.length < ANSWER_LENGTH) {
          addLetter(letter);
        }
        return;
      }

      currentGuess += letter;
    } else {
      // Replace last letter only if position isn't discovered
      const lastPosition = ANSWER_LENGTH - 1;
      if (!discoveredLetters[lastPosition]) {
        // como coloco o gameState. sendo que ele nao permite por conta do !
        currentGuess =
          currentGuess.substring(0, currentGuess.length - 1) + letter;
      }
    }

    const targetElement =
      letters[ANSWER_LENGTH * currentRow + currentGuess.length - 1];
    targetElement.innerText = letter;
    targetElement.classList.remove("scoreboard__letter--ghost");
  }

  function backspace() {
    if (currentGuess.length <= 0) {
      return;
    }

    const lastPosition = currentGuess.length - 1;

    // Prevent deletion of discovered letters
    if (gameState.discoveredLetters[lastPosition]) {
      return;
    }

    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    const targetElement =
      letters[ANSWER_LENGTH * currentRow + currentGuess.length];

    if (targetElement.classList.contains("scoreboard__letter--ghost")) {
      targetElement.classList.add("scoreboard__letter--ghost");
    } else {
      targetElement.innerText = "";
    }
  }

  function markInvalidWord() {
    // Shake animation for invalid word
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove(
        "scoreboard__letter--invalid",
      );
      setTimeout(function () {
        letters[currentRow * ANSWER_LENGTH + i].classList.add(
          "scoreboard__letter--invalid",
        );
      }, 10);
    }

    showTemporaryMessage("Not a valid word!");

    // Convert non-discovered letters to ghost state
    setTimeout(() => {
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];
        letterElement.classList.remove("scoreboard__letter--invalid");

        const isHintOrDiscovered =
          (currentLevel === "easy" && i < 2) ||
          (currentLevel === "medium" && i < 1) ||
          gameState.discoveredLetters[i];

        if (!isHintOrDiscovered) {
          letterElement.classList.add("scoreboard__letter--ghost");
        }
      }

      // Reset guess with discovered letters
      currentGuess = "";
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (gameState.discoveredLetters[i]) {
          currentGuess += gameState.discoveredLetters[i];
        } else {
          break;
        }
      }
    }, 600);
  }

  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      return;
    }

    isLoading = true;
    setLoading(true);

    try {
      // =====================================
      // WORD VALIDATION
      // =====================================

      const res = await fetch("https://words.dev-apis.com/validate-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: currentGuess }),
      });

      const resObj = await res.json();
      const validWord = resObj.validWord;

      isLoading = false;
      setLoading(false);

      if (!validWord) {
        markInvalidWord();
        return;
      }

      // =====================================
      // WORDLE COLOR LOGIC & LETTER DISCOVERY
      // =====================================

      const guessParts = currentGuess.split("");
      const map = createLetterCountMap(wordParts);
      let newDiscoveries = false;

      // First pass: Mark correct letters and register new discoveries
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
          const letterElement = letters[currentRow * ANSWER_LENGTH + i];

          // Register new discovery
          if (!discoveredLetters[i]) {
            // mesma coisa como colocar o gameState. quando tem !
            gameState.discoveredLetters[i] = guessParts[i];
            newDiscoveries = true;
          }

          if (
            !letterElement.classList.contains("scoreboard__letter--correct") ||
            letterElement.innerText === ""
          ) {
            letterElement.classList.add("scoreboard__letter--correct");
          }

          map[guessParts[i]]--;
        }
      }

      // Second pass: Mark close and wrong letters
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];

        // Skip already correct letters
        if (
          letterElement.classList.contains("scoreboard__letter--correct") &&
          ((gameState.currentLevel === "easy" && i < 2) ||
            (gameState.currentLevel === "medium" && i < 1) ||
            gameState.discoveredLetters[i])
        ) {
          continue;
        }

        if (guessParts[i] === wordParts[i]) {
          // Already handled
        } else if (
          wordParts.includes(guessParts[i]) &&
          map[guessParts[i]] > 0
        ) {
          letterElement.classList.add("scoreboard__letter--close");
          map[guessParts[i]]--;
        } else {
          letterElement.classList.add("scoreboard__letter--wrong");
        }
      }

      // Update all rows with new discoveries
      if (newDiscoveries) {
        updateAllRowsWithDiscoveries();
      }

      // WIN/LOSE CONDITIONS
      // showModal importado do modal.js (la ja esta o export)

      if (currentGuess === word) {
        gameState.gameInProgress = false;
        showModal(`Congratulations!<br>You guessed the word!`, true);
        document.querySelector(".header").classList.add("header--winner");
        done = true;
        return;
      } else if (currentRow + 1 === ROUNDS) {
        gameState.gameInProgress = false;
        showModal(`Game over!<br>The word was <strong>${word}</strong>`, true);
        done = true;
        return;
      }

      // =====================================
      // PREPARE NEXT ROW
      // =====================================

      currentRow++;
      updateAttemptCounter();

      // Reset guess with all discovered letters
      currentGuess = "";
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (gameState.discoveredLetters[i]) {
          currentGuess += gameState.discoveredLetters[i];
        } else {
          break;
        }
      }

      // Clear ghost letters from previous row
      if (currentRow > 0) {
        for (let i = 0; i < ANSWER_LENGTH; i++) {
          letters[(currentRow - 1) * ANSWER_LENGTH + i].classList.remove(
            "scoreboard__letter--ghost",
          );
        }
      }
    } catch (error) {
      console.error("Error validating word:", error);
      isLoading = false;
      setLoading(false);
    }
  }

  // =====================================
  // INPUT HANDLING
  // Processes keyboard input and routes to appropriate game functions
  // =====================================

  function handleInput(key) {
    if (done || isLoading) {
      return;
    }

    if (key === "Enter") {
      commit();
    } else if (key === "Backspace") {
      backspace();
    } else if (isLetter(key)) {
      addLetter(key.toUpperCase());
    }
  }

  document.addEventListener("keydown", function (event) {
    handleInput(event.key);
  });
}
