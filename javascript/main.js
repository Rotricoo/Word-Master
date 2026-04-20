import { themeToggle, levelBtn } from "./domElements.js";
import { initTheme, toggleTheme } from "./theme.js";
import { updateLevel, updateLevelDisplay, cycleLevel, showLevelModal } from "./level.js";
import { init } from "./game.js";

// GAME INITIALIZATION
// Loads saved settings and starts the first game

async function initGame() {
  initTheme();
  await showLevelModal();
  updateLevel();
  updateLevelDisplay();
  init();
}

// Global event listeners for UI interactions

themeToggle.addEventListener("click", toggleTheme);
levelBtn.addEventListener("click", cycleLevel);

// Initialize and start the game when script loads

initGame();
