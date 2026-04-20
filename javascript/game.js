import { ANSWER_LENGTH, ROUNDS } from "./constants.js";
import { letters, attemptCounter, giveUp, timerElement } from "./domElements.js";
import { showModal } from "./modal.js";
import { isLetter, createLetterCountMap, setLoading } from "./utilities.js";
import { gameState } from "./state.js";
import { applyHintsToAllRows } from "./hints.js";
import { createGuessLogic } from "./guessLogic.js";

// GAME LOGIC
// Core game functions: initialization, restart, and main game loop

let currentRowGlobal = 0;

export async function init() {
  // GAME SETUP
  hideGiveUpButton();
  gameState.gameInProgress = true;

  let currentGuess = "";
  let currentRow = 0;
  let isLoading = true;
  let done = false;
  gameState.discoveredLetters = {};

  currentRowGlobal = currentRow;

  const { updateAttemptCounter, addLetter, backspace, markInvalidWord } = createGuessLogic({
    attemptCounter,
    letters,
    gameState,
    answerLength: ANSWER_LENGTH,
    rounds: ROUNDS,
    getCurrentGuess: () => currentGuess,
    setCurrentGuess: (value) => {
      currentGuess = value;
    },
    getCurrentRow: () => currentRow,
  });

  setLoading(true);

  // Upating the counter
  updateAttemptCounter();

  // FETCH WORD FROM API
  const response = await fetch("https://words.dev-apis.com/word-of-the-day?random=1");
  const wordResponseData = await response.json();
  const word = wordResponseData.word.toUpperCase();
  const wordParts = word.split("");

  setLoading(false);
  isLoading = false;

  // APPLY DIFFICULTY HINTS

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
        if ((gameState.currentLevel === "easy" && position < 2) || (gameState.currentLevel === "medium" && position < 1)) {
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

  startTimer();

  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      return;
    }

    isLoading = true; // 	internal loading state
    setLoading(true); // show the loading overlay

    try {
      // WORD VALIDATION
      const validationResponse = await fetch("https://words.dev-apis.com/validate-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: currentGuess }),
      });

      const validationResponseData = await validationResponse.json();
      const wordIsValid = validationResponseData.validWord;

      isLoading = false;
      setLoading(false);

      if (!wordIsValid) {
        markInvalidWord();
        return;
      }

      // WORDLE COLOR LOGIC & LETTER DISCOVERY

      const guessParts = currentGuess.split("");
      const letterCountMap = createLetterCountMap(wordParts);
      let newDiscoveries = false;

      // First pass: Mark correct letters and register new discoveries
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
          const letterElement = letters[currentRow * ANSWER_LENGTH + i];

          // Register new discovery
          if (!gameState.discoveredLetters[i]) {
            gameState.discoveredLetters[i] = guessParts[i];
            newDiscoveries = true;
          }

          if (!letterElement.classList.contains("scoreboard__letter--correct") || letterElement.innerText === "") {
            letterElement.classList.add("scoreboard__letter--correct");
          }

          letterCountMap[guessParts[i]]--;
        }
      }

      // Second pass: Mark close and wrong letters
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];

        // Skip already correct letters
        if (
          letterElement.classList.contains("scoreboard__letter--correct") &&
          ((gameState.currentLevel === "easy" && i < 2) || (gameState.currentLevel === "medium" && i < 1) || gameState.discoveredLetters[i])
        ) {
          continue;
        }

        if (guessParts[i] === wordParts[i]) {
          // Already handled
        } else if (wordParts.includes(guessParts[i]) && letterCountMap[guessParts[i]] > 0) {
          letterElement.classList.add("scoreboard__letter--close");
          letterCountMap[guessParts[i]]--;
        } else {
          letterElement.classList.add("scoreboard__letter--wrong");
        }
      }

      // Update all rows with new discoveries
      if (newDiscoveries) {
        updateAllRowsWithDiscoveries();
      }

      // WIN/LOSE CONDITIONS

      if (currentGuess === word) {
        stopTimer();
        gameState.gameInProgress = false;
        showModal(`Congratulations!<br>You devoured that word!`, true, restartGame);
        document.querySelector(".header").classList.add("header--winner");
        done = true;
        return;
      } else if (currentRow + 1 === ROUNDS) {
        stopTimer();
        gameState.gameInProgress = false;
        showModal(`Well… that was tragic!<br>The word was <strong>${word}</strong>`, true, restartGame);
        done = true;
        return;
      }

      // PREPARE NEXT ROW

      currentRow++;
      currentRowGlobal = currentRow;
      updateAttemptCounter();
      checkGiveUpCondition(currentRow);

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
          letters[(currentRow - 1) * ANSWER_LENGTH + i].classList.remove("scoreboard__letter--ghost");
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

  currentInputHandler = handleInput;
  currentHandlerGiveUp = handleGiveUp;

  function handleGiveUp() {
    const confirmedGiveUp = confirm("Are you certain you want to give up already?");
    if (confirmedGiveUp) {
      stopTimer();
      gameState.gameInProgress = false;
      done = true;
      showModal(`That is a dramatic exit... You lasted ${elapsedSeconds} seconds!<br><br> The word was <strong>${word}</strong>`, true, restartGame);
    }
  }

  // Init end
}

let currentInputHandler = null;
let currentHandlerGiveUp = null;

document.addEventListener("keydown", function (event) {
  if (typeof currentInputHandler === "function") {
    currentInputHandler(event.key);
  }
});

export function restartGame() {
  stopTimer();
  gameState.gameInProgress = false;
  gameState.discoveredLetters = {};

  letters.forEach((letter) => {
    letter.innerText = "";
    letter.className = "scoreboard__letter";
  });

  document.querySelector(".header").classList.remove("header--winner");
  init();
}

let elapsedSeconds = 0;

let timerInterval;

function updateTimerScreen() {
  const minutesTimer = Math.floor(elapsedSeconds / 60);
  const secondsTimer = elapsedSeconds % 60;

  const formattedMinutesTimer = String(minutesTimer).padStart(2, "0");
  const formattedSecondsTimer = String(secondsTimer).padStart(2, "0");

  timerElement.textContent = `${formattedMinutesTimer}:${formattedSecondsTimer}`;
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = null;

  elapsedSeconds = 0;
  updateTimerScreen();

  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerScreen();
    checkGiveUpCondition(currentRowGlobal);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = null;
}

function showGiveUpButton() {
  giveUp.classList.add("give-up-button--visible");
}

function hideGiveUpButton() {
  giveUp.classList.remove("give-up-button--visible");
}

function checkGiveUpCondition(currentRowGlobal) {
  if (currentRowGlobal >= 2 || elapsedSeconds >= 120) {
    showGiveUpButton();
  }
}

// Give Up button
giveUp.addEventListener("click", function () {
  if (typeof currentHandlerGiveUp === "function") {
    currentHandlerGiveUp();
  }
});
