export function showTemporaryMessage(message) {
  const messageEl = document.createElement("div");
  messageEl.className = "temporary-message";
  messageEl.textContent = message;
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 2000);
}
