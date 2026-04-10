// Importing from another js files
import { themeToggle, levelBtn } from "./domElements.js";
import { initTheme, toggleTheme } from "./theme.js";
import { updateLevel, updateLevelDisplay, cycleLevel } from "./level.js";
import { init } from "./game.js";

// GAME INITIALIZATION
// Loads saved settings and starts the first game

function initGame() {
  updateLevel();
  updateLevelDisplay();
  initTheme();
}

// EVENT LISTENERS
// Global event listeners for UI interactions

themeToggle.addEventListener("click", toggleTheme);
levelBtn.addEventListener("click", cycleLevel);

// START GAME
// Initialize and start the game when script loads

initGame();
init();
