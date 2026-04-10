// MODAL MANAGEMENT
// Creates and manages game result modals (win/lose screens)

export function showModal(message, showRestartButton = false, onRestart) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
  <div class="modal__content">
    <h2 class="modal__title">${message}</h2>
    <div class="modal__options">
      ${showRestartButton ? '<button class="modal__restart">🔄 Play Again</button>' : ""}
      <button class="modal__close">OK</button>
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

  modal.querySelector(".modal__close").addEventListener("click", () => {
    modal.remove();
  });

  document.body.appendChild(modal);

  // closes the modal when the user clicks outside the modal content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
