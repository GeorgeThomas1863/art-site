// Show loading overlay
export const showLoadStatus = async (targetElement, customText = "Loading...") => {
  if (!targetElement) return null;
  let loadingOverlay = document.getElementById("loading-overlay");

  if (loadingOverlay) loadingOverlay.remove();

  loadingOverlay = await buildLoadingOverlay(customText);
  targetElement.style.position = "relative";
  targetElement.append(loadingOverlay);

  loadingOverlay.classList.add("active");
  return true;
};

// Hide loading overlay
export const hideLoadStatus = async () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (!loadingOverlay) return;

  loadingOverlay.classList.remove("active");

  //remove from dom
  setTimeout(() => {
    if (loadingOverlay.parentElement) {
      loadingOverlay.remove();
    }
  }, 300); // Wait for any CSS transitions

  return true;
};

export const buildLoadingOverlay = async (customText = "Loading...") => {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.className = "loading-overlay";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  const loadingText = document.createElement("div");
  loadingText.className = "loading-text";
  loadingText.textContent = customText;

  loadingOverlay.append(spinner, loadingText);

  return loadingOverlay;
};
