const adminElement = document.getElementById("admin-element");

export const displayPopup = async (message, type = "success") => {
  if (!adminElement) return null;

  console.log("DISPLAY POPUP");
  console.log(message);
  console.log(type);

  // Remove any existing popup
  const existingPopup = document.getElementById("popup-notification");
  if (existingPopup) {
    existingPopup.remove();
  }

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

  // Add click handler for close button
  //   closeBtn.onclick = () => {
  //     popup.classList.add("popup-fade-out");
  //     setTimeout(() => {
  //       popup.remove();
  //     }, 300);
  //   };

  // Append elements
  popup.append(icon, messageText, closeBtn);
  adminElement.append(popup);

  popup.style.display = "flex";

  // Auto-remove after 10 seconds
  setTimeout(() => {
    popup.style.display = "none";
  }, 10000);
};

export const closePopup = async () => {
  const popup = document.getElementById("popup-notification");
  if (!popup) return null;

  popup.style.display = "none";
  setTimeout(() => {
    popup.remove();
  }, 300);
};
