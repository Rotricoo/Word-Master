import { loadingOverlay } from "./domElements.js";

// UTILITY FUNCTIONS
// Helper functions for common operations

export function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

export function createLetterCountMap(array) {
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

// LOADING MANAGEMENT
// Controls the loading overlay display state

export function setLoading(isLoading) {
  loadingOverlay.classList.toggle("loading-overlay--show", isLoading);
}
