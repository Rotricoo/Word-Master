// =====================================
// DOM ELEMENTS
// =====================================
const letters = document.querySelectorAll(".scoreboard-letter");
const loadingOverlay = document.querySelector(".loading-overlay");
const attemptCounter = document.querySelector(".attempt-counter");
const themeToggle = document.querySelector(".theme-toggle");
const levelBtn = document.querySelector(".level-btn");
const levelText = document.querySelector(".level-text");
const keys = document.querySelectorAll(".key");
const levelModal = document.querySelector(".level-modal");

// =====================================
// GAME CONSTANTS
// =====================================
const ANSWER_LENGTH = 5;
const ROUNDS = 6;

// =====================================
// GAME STATE VARIABLES
// =====================================
let currentLevel = "easy";
let usedLetters = new Set();
let gameInProgress = false;

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Check if character is a valid letter
 * @param {string} letter - Character to validate
 * @returns {boolean} True if letter is valid
 */
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

/**
 * Create frequency map from array
 * @param {Array} array - Array to map
 * @returns {Object} Frequency map
 */
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

/**
 * Show temporary message to user
 * @param {string} message - Message to display
 */
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
// =====================================

/**
 * Toggle loading overlay
 * @param {boolean} isLoading - Whether to show loading
 */
function setLoading(isLoading) {
  loadingOverlay.classList.toggle("show", isLoading);
}

// =====================================
// THEME MANAGEMENT
// =====================================

/**
 * Initialize theme from localStorage
 */
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
}

// =====================================
// LEVEL MANAGEMENT
// =====================================

/**
 * Update level selection visual state
 * @param {string} level - Selected level
 */
function updateLevelSelection(level) {
  document.querySelectorAll(".level-option").forEach((option) => {
    option.classList.remove("selected");
  });
  document.querySelector(`[data-level="${level}"]`).classList.add("selected");
}

/**
 * Show level selection modal and return promise with selected level
 * @returns {Promise<string>} Selected difficulty level
 */
function showLevelModal() {
  return new Promise((resolve) => {
    levelModal.style.display = "flex";

    // Highlight saved level
    const savedLevel = localStorage.getItem("level") || "easy";
    updateLevelSelection(savedLevel);

    // Level option click handlers
    const levelOptions = document.querySelectorAll(".level-option");
    levelOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const level = option.getAttribute("data-level");
        updateLevelSelection(level);
      });
    });

    // Start button handler
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

/**
 * Handle level cycling from header button
 */
function cycleLevel() {
  if (gameInProgress) {
    // Confirm restart if game is in progress
    if (confirm("Changing difficulty will restart the game. Continue?")) {
      gameInProgress = false;
      showLevelModal().then(() => {
        updateLevelDisplay();
        restartGame();
      });
    }
  } else {
    // Allow level change if no game in progress
    showLevelModal().then(() => {
      updateLevelDisplay();
    });
  }
}

/**
 * Update level display text
 */
function updateLevelDisplay() {
  const levelNames = {
    easy: "Easy (2 hints)",
    medium: "Medium (1 hint)",
    hard: "Hard (no hints)",
  };
  levelText.textContent = `Level: ${levelNames[currentLevel]}`;
}

// =====================================
// KEYBOARD MANAGEMENT
// =====================================

/**
 * Update virtual keyboard key appearance based on letter status
 * @param {string} letter - Letter to update
 * @param {string} status - Status class (correct, close, wrong, used)
 */
function updateKeyboard(letter, status) {
  const key = document.querySelector(`[data-key="${letter}"]`);
  if (key && !key.classList.contains("correct")) {
    key.classList.remove("used", "wrong", "close");
    if (status) key.classList.add(status);
  }
}

/**
 * Reset virtual keyboard to initial state
 */
function resetKeyboard() {
  keys.forEach((key) => {
    key.classList.remove("correct", "close", "wrong", "used");
  });
  usedLetters.clear();
}

// =====================================
// HINTS SYSTEM
// =====================================

/**
 * Apply hints for specific row based on difficulty level
 * @param {string} word - Target word
 * @param {number} row - Row index (0-5)
 */
function applyHints(word, row = 0) {
  if (currentLevel === "easy") {
    // Show first 2 letters
    letters[row * ANSWER_LENGTH + 0].innerText = word[0];
    letters[row * ANSWER_LENGTH + 1].innerText = word[1];
    letters[row * ANSWER_LENGTH + 0].classList.add("correct");
    letters[row * ANSWER_LENGTH + 1].classList.add("correct");
  } else if (currentLevel === "medium") {
    // Show first letter only
    letters[row * ANSWER_LENGTH + 0].innerText = word[0];
    letters[row * ANSWER_LENGTH + 0].classList.add("correct");
  }
  // Hard mode: no hints
}

/**
 * Apply hints to all rows (for consistent UI across attempts)
 * @param {string} word - Target word
 */
function applyHintsToAllRows(word) {
  for (let row = 0; row < ROUNDS; row++) {
    applyHints(word, row);
  }
}

// =====================================
// MODAL MANAGEMENT
// =====================================

/**
 * Show game result modal
 * @param {string} message - Message to display
 * @param {boolean} showRestart - Whether to show restart button
 */
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

  // Restart button handler
  if (showRestart) {
    modal.querySelector(".modal-restart").addEventListener("click", () => {
      modal.remove();
      restartGame();
    });
  }

  // Close button handler
  modal.querySelector(".modal-close").addEventListener("click", () => {
    modal.remove();
  });

  // Click outside to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// =====================================
// GAME LOGIC
// =====================================

/**
 * Restart game and reset all state
 */
function restartGame() {
  gameInProgress = false;

  // Clear all letters and reset classes
  letters.forEach((letter) => {
    letter.innerText = "";
    letter.className = "scoreboard-letter";
  });

  // Remove winner styling
  document.querySelector(".brandName").classList.remove("winner");

  // Start new game
  init();
}

/**
 * Main game initialization function
 */
async function init() {
  // =====================================
  // GAME SETUP
  // =====================================

  // Show level selection modal
  await showLevelModal();
  updateLevelDisplay();
  gameInProgress = true;

  // Initialize game variables
  let currentGuess = "";
  let currentRow = 0;
  let isLoading = true;
  let done = false;

  // Reset game state
  resetKeyboard();
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

  // Set initial guess based on hints
  if (currentLevel === "easy") {
    currentGuess = word[0] + word[1]; // First 2 letters
  } else if (currentLevel === "medium") {
    currentGuess = word[0]; // First letter only
  }
  // Hard mode: currentGuess remains empty

  // =====================================
  // GAME STATE FUNCTIONS
  // =====================================

  /**
   * Update attempt counter display
   */
  function updateAttemptCounter() {
    attemptCounter.textContent = `Tentative: ${currentRow + 1}/${ROUNDS}`;
  }

  updateAttemptCounter();

  /**
   * Add letter to current guess
   * @param {string} letter - Letter to add
   */
  function addLetter(letter) {
    if (currentGuess.length < ANSWER_LENGTH) {
      currentGuess += letter;
    } else {
      // Replace last letter if at max length
      currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
    }

    const targetElement = letters[ANSWER_LENGTH * currentRow + currentGuess.length - 1];
    targetElement.innerText = letter;
    targetElement.classList.remove("ghost");

    // Update keyboard state
    usedLetters.add(letter);
    updateKeyboard(letter, "used");
  }

  /**
   * Remove last letter from current guess
   */
  function backspace() {
    // Prevent deleting hint letters
    const minLength = currentLevel === "easy" ? 2 : currentLevel === "medium" ? 1 : 0;

    if (currentGuess.length <= minLength) {
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

  /**
   * Mark current row as invalid word with animation
   */
  function markInvalidWord() {
    // Add shake animation
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");
      setTimeout(function () {
        letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid");
      }, 10);
    }

    showTemporaryMessage("Not a valid word!");

    // After animation, convert to ghost letters (except hints)
    setTimeout(() => {
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];
        letterElement.classList.remove("invalid");

        // Preserve hints, only ghost non-hint letters
        const isHint = (currentLevel === "easy" && i < 2) || (currentLevel === "medium" && i < 1);

        if (!isHint) {
          letterElement.classList.add("ghost");
        }
      }

      // Reset currentGuess with hints
      if (currentLevel === "easy") {
        currentGuess = word[0] + word[1];
      } else if (currentLevel === "medium") {
        currentGuess = word[0];
      } else {
        currentGuess = "";
      }
    }, 600);
  }

  /**
   * Submit current guess and check against target word
   */
  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      return;
    }

    isLoading = true;
    setLoading(true);

    try {
      // =====================================
      // VALIDATE WORD WITH API
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
      // APPLY WORDLE COLOR LOGIC
      // =====================================

      const guessParts = currentGuess.split("");
      const map = makeMap(wordParts);

      // First pass: Mark correct letters (green)
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
          const letterElement = letters[currentRow * ANSWER_LENGTH + i];

          // Only add correct class if not already a hint
          if (!letterElement.classList.contains("correct") || letterElement.innerText === "") {
            letterElement.classList.add("correct");
          }

          updateKeyboard(guessParts[i], "correct");
          map[guessParts[i]]--;
        }
      }

      // Second pass: Mark close and wrong letters (yellow/red)
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        const letterElement = letters[currentRow * ANSWER_LENGTH + i];

        // Skip hint letters
        if (
          letterElement.classList.contains("correct") &&
          ((currentLevel === "easy" && i < 2) || (currentLevel === "medium" && i < 1))
        ) {
          continue;
        }

        if (guessParts[i] === wordParts[i]) {
          // Already handled in first pass
        } else if (wordParts.includes(guessParts[i]) && map[guessParts[i]] > 0) {
          letterElement.classList.add("close");
          updateKeyboard(guessParts[i], "close");
          map[guessParts[i]]--;
        } else {
          letterElement.classList.add("wrong");
          updateKeyboard(guessParts[i], "wrong");
        }
      }

      // =====================================
      // CHECK WIN/LOSE CONDITIONS
      // =====================================

      if (currentGuess === word) {
        gameInProgress = false;
        showModal(`🎉 Congratulations!<br>You guessed the word!`, true);
        document.querySelector(".brandName").classList.add("winner");
        done = true;
        return;
      } else if (currentRow + 1 === ROUNDS) {
        gameInProgress = false;
        showModal(`😞 Game over!<br>The word was <strong>${word}</strong>`, true);
        done = true;
        return;
      }

      // =====================================
      // PREPARE NEXT ROW
      // =====================================

      currentRow++;
      updateAttemptCounter();

      // Reset currentGuess for next row (including hints)
      if (currentLevel === "easy") {
        currentGuess = word[0] + word[1];
      } else if (currentLevel === "medium") {
        currentGuess = word[0];
      } else {
        currentGuess = "";
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
  // =====================================

  /**
   * Handle keyboard input (physical or virtual)
   * @param {string} key - Key pressed
   */
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

  // Physical keyboard event listener
  document.addEventListener("keydown", function (event) {
    handleInput(event.key);
  });

  // Virtual keyboard event listeners
  keys.forEach((key) => {
    key.addEventListener("click", () => {
      const keyValue = key.getAttribute("data-key");
      handleInput(keyValue);
    });
  });
}

// =====================================
// GAME INITIALIZATION
// =====================================

/**
 * Initialize game settings and start first game
 */
function initGame() {
  // Load saved settings
  currentLevel = localStorage.getItem("level") || "easy";
  updateLevelDisplay();
  initTheme();
}

// =====================================
// EVENT LISTENERS
// =====================================

themeToggle.addEventListener("click", toggleTheme);
levelBtn.addEventListener("click", cycleLevel);

// =====================================
// START GAME
// =====================================

initGame();
init();
