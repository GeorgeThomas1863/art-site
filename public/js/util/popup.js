const adminElement = document.getElementById("admin-element");
const productsElement = document.getElementById("products-element");
const cartElement = document.getElementById("cart-element");
const contactElement = document.getElementById("contact-element");
const eventsElement = document.getElementById("events-element");

export const getTargetElement = async () => {
  if (adminElement) return adminElement;
  if (productsElement) return productsElement;
  if (cartElement) return cartElement;
  if (contactElement) return contactElement;
  if (eventsElement) return eventsElement;

  return null;
};

export const displayPopup = async (message, type = "success") => {
  if (!message) return null;

  const targetElement = await getTargetElement();
  if (!targetElement) return null;

  // Remove any existing popup
  const existingPopup = document.getElementById("popup-notification");
  if (existingPopup) existingPopup.remove();

  // Create popup container
  const popup = document.createElement("div");
  popup.id = "popup-notification";
  popup.className = `popup-notification popup-${type}`;

  // Create icon
  const icon = document.createElement("span");
  icon.className = "popup-icon";
  if (type === "success") {
    icon.innerHTML = "✓";
  } else {
    icon.innerHTML = "✕";
  }

  // Create message
  const messageText = document.createElement("span");
  messageText.className = "popup-message";
  messageText.textContent = message;

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.id = "popup-close-button";
  closeBtn.className = "popup-close";
  closeBtn.innerHTML = "×";
  closeBtn.setAttribute("data-label", "popup-close");

  // Append elements
  popup.append(icon, messageText, closeBtn);
  targetElement.append(popup);

  popup.style.display = "flex";

  // Auto-remove after 5 seconds
  setTimeout(() => {
    popup.style.display = "none";
  }, 5000);
};

export const closePopup = async () => {
  const popup = document.getElementById("popup-notification");
  if (!popup) return null;

  popup.style.display = "none";
  setTimeout(() => {
    popup.remove();
  }, 300);
};

//---------------------------

export const displayConfirmDialog = async (message) => {
  const adminElement = document.getElementById("admin-element");
  if (!adminElement) return null;

  // Remove any existing dialogs
  const existingDialog = document.getElementById("confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = await buildConfirmDialog(message);
  adminElement.append(dialog);
  dialog.style.display = "flex";

  // Return a promise that will be resolved by the click handler
  return new Promise((resolve) => {
    // Store the resolve function so clickHandler can access it
    window.confirmDialogResolve = resolve;
  });
};

export const closeConfirmDialog = async (result) => {
  const dialog = document.getElementById("confirm-dialog");
  if (!dialog) return null;

  dialog.remove();

  // Resolve the promise if it exists
  if (window.confirmDialogResolve) {
    window.confirmDialogResolve(result);
    window.confirmDialogResolve = null;
  }
};

export const buildConfirmDialog = async (message) => {
  // Create dialog container
  const dialog = document.createElement("div");
  dialog.id = "confirm-dialog";
  dialog.className = "confirm-dialog";

  // Create dialog content wrapper
  const dialogContent = document.createElement("div");
  dialogContent.className = "confirm-dialog-content";

  // Create message
  const messageText = document.createElement("p");
  messageText.className = "confirm-message";
  messageText.textContent = message;

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "confirm-button-container";

  // Create Yes button
  const yesBtn = document.createElement("button");
  yesBtn.className = "confirm-btn confirm-btn-yes";
  yesBtn.textContent = "Yes";
  yesBtn.setAttribute("data-label", "confirm-yes");

  // Create No button
  const noBtn = document.createElement("button");
  noBtn.className = "confirm-btn confirm-btn-no";
  noBtn.textContent = "No";
  noBtn.setAttribute("data-label", "confirm-no");

  // Append elements
  buttonContainer.append(yesBtn, noBtn);
  dialogContent.append(messageText, buttonContainer);
  dialog.append(dialogContent);

  // Auto-focus the No button when dialog appears
  setTimeout(() => noBtn.focus(), 0);

  return dialog;
};
