import { levelModal, levelIndicatorText } from "./domElements.js";
import { gameState } from "./state.js";
import { restartGame } from "./game.js";

// LEVEL MANAGEMENT
// Handles difficulty selection, saved level loading, modal behavior, and level label updates.

function updateLevelSelection(level) {
  levelModal.querySelectorAll(".level-modal__option--selected").forEach((option) => {
    option.classList.remove("level-modal__option--selected");
  });

  const selectedOption = levelModal.querySelector(`[data-level="${level}"]`);
  if (selectedOption) {
    selectedOption.classList.add("level-modal__option--selected");
  }
}

// Stores the resolve function for the currently open difficulty modal.
let resolveLevelModal;

// Sets up modal listeners once so they do not get recreated every time the modal opens.
function setupLevelModalListeners() {
  const levelOptions = levelModal.querySelectorAll(".level-modal__option");
  levelOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const level = option.getAttribute("data-level");
      updateLevelSelection(level);
    });
  });

  const startBtn = levelModal.querySelector(".level-modal__start-button");
  startBtn.addEventListener("click", () => {
    const selectedLevel = levelModal.querySelector(".level-modal__option--selected")?.getAttribute("data-level") || "easy";

    gameState.currentLevel = selectedLevel;
    localStorage.setItem("level", selectedLevel);
    levelModal.style.display = "none";

    if (resolveLevelModal) {
      resolveLevelModal(selectedLevel);
      resolveLevelModal = null;
    }
  });
}

setupLevelModalListeners();

// Opens the difficulty modal, restores the saved selection, and returns a promise
// that resolves when the user confirms the selected difficulty.

export function showLevelModal() {
  levelModal.style.display = "flex";

  const savedLevel = localStorage.getItem("level") || "easy";
  updateLevelSelection(savedLevel);

  return new Promise((resolve) => {
    resolveLevelModal = resolve;
  });
}

export function cycleLevel() {
  if (!gameState.gameInProgress) {
    showLevelModal().then(() => {
      updateLevelDisplay();
    });
    return;
  }

  const confirmed = confirm("Changing difficulty will restart the game. Continue?");
  if (!confirmed) {
    return;
  }

  gameState.gameInProgress = false;
  showLevelModal().then(() => {
    updateLevelDisplay();
    restartGame();
  });
}

// Loads the saved difficulty from localStorage and syncs it with the game state.
export function updateLevel() {
  gameState.currentLevel = localStorage.getItem("level") || "easy";
}

// Updates the level indicator text shown in the interface.

export function updateLevelDisplay() {
  const levelLabels = {
    easy: "Easy (2 hints)",
    medium: "Medium (1 hint)",
    hard: "Hard (no hints)",
  };

  const currentLevelLabel = levelLabels[gameState.currentLevel];

  levelIndicatorText.textContent = `Level: ${currentLevelLabel}`;
}
