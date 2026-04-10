import { ANSWER_LENGTH, ROUNDS } from "./constants.js";
import { letters } from "./domElements.js";
import { gameState } from "./state.js";

// HINTS SYSTEM
// Applies initial hints based on difficulty level across all game rows

function applyHints(word, row = 0) {
  if (gameState.currentLevel === "easy") {
    letters[row * ANSWER_LENGTH + 0].innerText = word[0];
    letters[row * ANSWER_LENGTH + 1].innerText = word[1];
    letters[row * ANSWER_LENGTH + 0].classList.add("scoreboard__letter--correct");
    letters[row * ANSWER_LENGTH + 1].classList.add("scoreboard__letter--correct");
  } else if (gameState.currentLevel === "medium") {
    letters[row * ANSWER_LENGTH + 0].innerText = word[0];
    letters[row * ANSWER_LENGTH + 0].classList.add("scoreboard__letter--correct");
  }
}

export function applyHintsToAllRows(word) {
  for (let row = 0; row < ROUNDS; row++) {
    applyHints(word, row);
  }
}
