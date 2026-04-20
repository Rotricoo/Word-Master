// MODAL MANAGEMENT
// Creates and manages game result modals (win/lose screens)

export function showModal(message, showRestartButton = false, onRestart) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
  <div class="modal__content">
    <h2 class="modal__title">${message}</h2>
    <div class="modal__options">
      ${showRestartButton ? '<button class="modal__restart">Play Again</button>' : ""}
    </div>
  </div>
  `;

  if (showRestartButton) {
    modal.querySelector(".modal__restart").addEventListener("click", () => {
      modal.remove();
      if (typeof onRestart === "function") {
        onRestart();
      }
    });
  }

  document.body.appendChild(modal);
}
