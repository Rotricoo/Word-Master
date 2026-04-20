import { showTemporaryMessage } from "./interface.js";

// GUESS LOGIC
// Creates helper functions for board updates, typing, deletion, and invalid-word feedback.

export function createGuessLogic({ attemptCounter, letters, gameState, answerLength, rounds, getCurrentGuess, setCurrentGuess, getCurrentRow }) {
  function updateAttemptCounter() {
    attemptCounter.textContent = `Attempt: ${getCurrentRow() + 1}/${rounds}`;
  }

  function addLetter(letter) {
    let currentGuess = getCurrentGuess();
    const currentRow = getCurrentRow();

    let insertedLetter = false;
    let insertedPosition = -1;

    if (currentGuess.length < answerLength) {
      while (currentGuess.length < answerLength && gameState.discoveredLetters[currentGuess.length]) {
        currentGuess += gameState.discoveredLetters[currentGuess.length];
      }

      if (currentGuess.length < answerLength) {
        currentGuess += letter;
        insertedLetter = true;
        insertedPosition = currentGuess.length - 1;
      }
    } else {
      const lastPosition = answerLength - 1;
      if (!gameState.discoveredLetters[lastPosition]) {
        currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
        insertedLetter = true;
        insertedPosition = currentGuess.length - 1;
      }
    }

    setCurrentGuess(currentGuess);

    if (insertedLetter) {
      const targetElement = letters[answerLength * currentRow + insertedPosition];
      targetElement.innerText = letter;
      targetElement.classList.remove("scoreboard__letter--ghost");
    }
  }

  function backspace() {
    let currentGuess = getCurrentGuess();
    const currentRow = getCurrentRow();

    if (currentGuess.length <= 0) {
      return;
    }

    const lastPosition = currentGuess.length - 1;

    // Prevent deletion of discovered letters
    if (gameState.discoveredLetters[lastPosition]) {
      return;
    }

    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    setCurrentGuess(currentGuess);

    const targetElement = letters[answerLength * currentRow + currentGuess.length];
    targetElement.classList.remove("scoreboard__letter--ghost");
    targetElement.innerText = "";
  }

  function markInvalidWord() {
    const currentRow = getCurrentRow();

    // Restart the invalid animation by removing and re-adding the class.
    for (let i = 0; i < answerLength; i++) {
      letters[currentRow * answerLength + i].classList.remove("scoreboard__letter--invalid");
      setTimeout(() => {
        letters[currentRow * answerLength + i].classList.add("scoreboard__letter--invalid");
      }, 10);
    }

    showTemporaryMessage("Not a valid word!");

    // Convert non-discovered letters to ghost state and rebuild the current guess.
    setTimeout(() => {
      for (let i = 0; i < answerLength; i++) {
        const letterElement = letters[currentRow * answerLength + i];
        letterElement.classList.remove("scoreboard__letter--invalid");

        const isHintOrDiscovered =
          (gameState.currentLevel === "easy" && i < 2) || (gameState.currentLevel === "medium" && i < 1) || gameState.discoveredLetters[i];

        if (!isHintOrDiscovered) {
          letterElement.classList.add("scoreboard__letter--ghost");
        }
      }

      let rebuiltGuess = "";
      for (let i = 0; i < answerLength; i++) {
        if (gameState.discoveredLetters[i]) {
          rebuiltGuess += gameState.discoveredLetters[i];
        } else {
          break;
        }
      }

      setCurrentGuess(rebuiltGuess);
    }, 600);
  }

  return {
    updateAttemptCounter,
    addLetter,
    backspace,
    markInvalidWord,
  };
}
