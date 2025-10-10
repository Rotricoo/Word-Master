// =====================================
// DOM ELEMENTS
// Cache all DOM elements used throughout the game
// =====================================
const letters = document.querySelectorAll(".scoreboard-letter");
const loadingOverlay = document.querySelector(".loading-overlay");
const attemptCounter = document.querySelector(".attempt-counter");
const themeToggle = document.querySelector(".theme-toggle");
const levelBtn = document.querySelector(".level-btn");
const levelText = document.querySelector(".level-text");
const levelModal = document.querySelector(".level-modal");

// =====================================
// GAME CONSTANTS
// Configuration constants for game mechanics
// =====================================
const ANSWER_LENGTH = 5;
const ROUNDS = 6;

// =====================================
// GAME STATE VARIABLES
// Global variables that track game state and progress
// =====================================
let currentLevel = "easy";
let gameInProgress = false;
let discoveredLetters = {}; // Stores discovered letters {position: letter}

// =====================================
// UTILITY FUNCTIONS
// Helper functions for common operations
// =====================================

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    const letter = array[i];
    if (obj[letter]) {
      obj[letter]++;
    } else {
      obj[letter] = 1;
    }
  }
  return obj;
}

function showTemporaryMessage(message) {
  const messageEl = document.createElement("div");
  messageEl.className = "temp-message";
  messageEl.textContent = message;
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 2000);
}

// =====================================
// LOADING MANAGEMENT
// Controls the loading overlay display state
// =====================================

function setLoading(isLoading) {
  loadingOverlay.classList.toggle("show", isLoading);
}

// =====================================
// THEME MANAGEMENT
// Handles light/dark theme switching and persistence
// =====================================

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
}

// =====================================
// LEVEL MANAGEMENT
// Manages difficulty selection, modal interactions and level display
// =====================================

function updateLevelSelection(level) {
  document.querySelectorAll(".level-option").forEach((option) => {
    option.classList.remove("selected");
  });
  document.querySelector(`[data-level="${level}"]`).classList.add("selected");
}

function showLevelModal() {
  return new Promise((resolve) => {
    levelModal.style.display = "flex";

    const savedLevel = localStorage.getItem("level") || "easy";
    updateLevelSelection(savedLevel);

    const levelOptions = document.querySelectorAll(".level-option");
    levelOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const level = option.getAttribute("data-level");
        updateLevelSelection(level);
      });
    });

    const startBtn = document.querySelector(".level-start-btn");
    const startHandler = () => {
      const selectedLevel = document.querySelector(".level-option.selected")?.getAttribute("data-level") || "easy";
      currentLevel = selectedLevel;
      localStorage.setItem("level", selectedLevel);

      levelModal.style.display = "none";
      startBtn.removeEventListener("click", startHandler);

      // Clean up event listeners to prevent memory leaks
      levelOptions.forEach((option) => {
        option.replaceWith(option.cloneNode(true));
      });

      resolve(selectedLevel);
    };

    startBtn.addEventListener("click", startHandler);
  });
}

function cycleLevel() {
  if (gameInProgress) {
    if (confirm("Changing difficulty will restart the game. Continue?")) {
      gameInProgress = false;
      showLevelModal().then(() => {
        updateLevelDisplay();
        restartGame();
      });
    }
  } else {
    showLevelModal().then(() => {
      updateLevelDisplay();
    });
  }
}

function updateLevelDisplay() {
  const levelNames = {
    easy: "Easy (2 hints)",
    medium: "Medium (1 hint)",
    hard: "Hard (no hints)",
  };
  levelText.textContent = `Level: ${levelNames[currentLevel]}`;
}

// =====================================
// HINTS SYSTEM
// Applies initial hints based on difficulty level across all game rows
// =====================================

function applyHints(word, row = 0) {
  if (currentLevel === "easy") {
    letters[row * ANSWER_LENGTH + 0].innerText = word[0];
    letters[row * ANSWER_LENGTH + 1].innerText = word[1];
    letters[row * ANSWER_LENGTH + 0].classList.add("correct");
    letters[row * ANSWER_LENGTH + 1].classList.add("correct");
  } else if (currentLevel === "medium") {
    letters[row * ANSWER_LENGTH + 0].innerText = word[0];
    letters[row * ANSWER_LENGTH + 0].classList.add("correct");
  }
}

function applyHintsToAllRows(word) {
  for (let row = 0; row < ROUNDS; row++) {
    applyHints(word, row);
  }
}

// =====================================
// MODAL MANAGEMENT
// Creates and manages game result modals (win/lose screens)
// =====================================

function showModal(message, showRestart = false) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
  <div class="modal-content">
    <h2>${message}</h2>
    <div class="modal-buttons">
      ${showRestart ? '<button class="modal-restart">🔄 Play Again</button>' : ""}
      <button class="modal-close">OK</button>
    </div>
  </div>
  `;

  document.body.appendChild(modal);

  if (showRestart) {
    modal.querySelector(".modal-restart").addEventListener("click", () => {
      modal.remove();
      restartGame();
    });
  }

  modal.querySelector(".modal-close").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// =====================================
// GAME LOGIC
// Core game functions: initialization, restart, and main game loop
// =====================================

function restartGame() {
  gameInProgress = false;
  discoveredLetters = {};

  letters.forEach((letter) => {
    letter.innerText = "";
    letter.className = "scoreboard-letter";
  });

  document.querySelector(".brandName").classList.remove("winner");
  init();
}

async function init() {
  // =====================================
  // GAME SETUP
  // =====================================

  await showLevelModal();
  updateLevelDisplay();
  gameInProgress = true;

  let currentGuess = "";
  let currentRow = 0;
  let isLoading = true;
  let done = false;
  discoveredLetters = {};

  setLoading(true);

  // =====================================
  // FETCH WORD FROM API
  // =====================================

  const res = await fetch("https://words.dev-apis.com/word-of-the-day?random=1");
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
  if (currentLevel === "easy") {
    discoveredLetters[0] = word[0];
    discoveredLetters[1] = word[1];
    currentGuess = word[0] + word[1];
  } else if (currentLevel === "medium") {
    discoveredLetters[0] = word[0];
    currentGuess = word[0];
  }

  // =====================================
  // DISCOVERED LETTERS SYSTEM
  // Manages letters discovered by the player during gameplay
  // =====================================

  function applyDiscoveredLetters(row) {
    for (let pos = 0; pos < ANSWER_LENGTH; pos++) {
      if (discoveredLetters[pos]) {
        const letterElement = letters[row * ANSWER_LENGTH + pos];
        letterElement.innerText = discoveredLetters[pos];

        // Different styling for original hints vs player discoveries
        if ((currentLevel === "easy" && pos < 2) || (currentLevel === "medium" && pos < 1)) {
          letterElement.classList.add("correct");
        } else {
          letterElement.classList.add("discovered");
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

      if (discoveredLetters[targetPosition]) {
        // Skip discovered positions automatically
        currentGuess += discoveredLetters[targetPosition];

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
        currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
      }
    }

    const targetElement = letters[ANSWER_LENGTH * currentRow + currentGuess.length - 1];
    targetElement.innerText = letter;
    targetElement.classList.remove("ghost");
  }

  function backspace() {
    if (currentGuess.length <= 0) {
      return;
    }

    const lastPosition = currentGuess.length - 1;

    // Prevent deletion of discovered letters
    if (discoveredLetters[lastPosition]) {
      return;
    }

    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    const targetElement = letters[ANSWER_LENGTH * currentRow + currentGuess.length];

    if (targetElement.classList.contains("ghost")) {
      targetElement.classList.add("ghost");
    } else {
      targetElement.innerText = "";
    }
  }

  function markInvalidWord() {
    // Shake animation for invalid word
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");
      setTimeout(function () {
        letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid");
      }, 10);
    }

    showTemporaryMessage("Not a valid word!");

    // Convert non-discovered letters to ghost state
    setTimeout(() => {
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];
        letterElement.classList.remove("invalid");

        const isHintOrDiscovered =
          (currentLevel === "easy" && i < 2) || (currentLevel === "medium" && i < 1) || discoveredLetters[i];

        if (!isHintOrDiscovered) {
          letterElement.classList.add("ghost");
        }
      }

      // Reset guess with discovered letters
      currentGuess = "";
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (discoveredLetters[i]) {
          currentGuess += discoveredLetters[i];
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
      const map = makeMap(wordParts);
      let newDiscoveries = false;

      // First pass: Mark correct letters and register new discoveries
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
          const letterElement = letters[currentRow * ANSWER_LENGTH + i];

          // Register new discovery
          if (!discoveredLetters[i]) {
            discoveredLetters[i] = guessParts[i];
            newDiscoveries = true;
          }

          if (!letterElement.classList.contains("correct") || letterElement.innerText === "") {
            letterElement.classList.add("correct");
          }

          map[guessParts[i]]--;
        }
      }

      // Second pass: Mark close and wrong letters
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];

        // Skip already correct letters
        if (
          letterElement.classList.contains("correct") &&
          ((currentLevel === "easy" && i < 2) || (currentLevel === "medium" && i < 1) || discoveredLetters[i])
        ) {
          continue;
        }

        if (guessParts[i] === wordParts[i]) {
          // Already handled
        } else if (wordParts.includes(guessParts[i]) && map[guessParts[i]] > 0) {
          letterElement.classList.add("close");
          map[guessParts[i]]--;
        } else {
          letterElement.classList.add("wrong");
        }
      }

      // Update all rows with new discoveries
      if (newDiscoveries) {
        updateAllRowsWithDiscoveries();
      }

      // =====================================
      // WIN/LOSE CONDITIONS
      // =====================================

      if (currentGuess === word) {
        gameInProgress = false;
        showModal(`Congratulations!<br>You guessed the word!`, true);
        document.querySelector(".brandName").classList.add("winner");
        done = true;
        return;
      } else if (currentRow + 1 === ROUNDS) {
        gameInProgress = false;
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
        if (discoveredLetters[i]) {
          currentGuess += discoveredLetters[i];
        } else {
          break;
        }
      }

      // Clear ghost letters from previous row
      if (currentRow > 0) {
        for (let i = 0; i < ANSWER_LENGTH; i++) {
          letters[(currentRow - 1) * ANSWER_LENGTH + i].classList.remove("ghost");
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

// =====================================
// GAME INITIALIZATION
// Loads saved settings and starts the first game
// =====================================

function initGame() {
  currentLevel = localStorage.getItem("level") || "easy";
  updateLevelDisplay();
  initTheme();
}

// =====================================
// EVENT LISTENERS
// Global event listeners for UI interactions
// =====================================

themeToggle.addEventListener("click", toggleTheme);
levelBtn.addEventListener("click", cycleLevel);

// =====================================
// START GAME
// Initialize and start the game when script loads
// =====================================

initGame();
init();
