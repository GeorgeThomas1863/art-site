let cropperInstance = null;
let cropResolve = null;
let currentObjectUrl = null;
let currentMimeType = "image/jpeg";

export const showCropModal = async (file) => {
  if (!file) return null;
  if (typeof window.Cropper === "undefined") return null;

  const existing = document.getElementById("crop-modal-overlay");
  if (existing) {
    _cleanup();
    existing.remove();
  }

  currentObjectUrl = URL.createObjectURL(file);
  currentMimeType = file.type || "image/jpeg";

  const { overlay, imgEl } = _buildCropModal();
  document.body.append(overlay);
  imgEl.src = currentObjectUrl;

  setTimeout(() => {
    cropperInstance = new window.Cropper(imgEl, {
      viewMode: 1,
      dragMode: "move",
      aspectRatio: NaN,
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  }, 0);

  return new Promise((resolve) => {
    cropResolve = resolve;
  });
};

export const confirmCrop = () =>
  new Promise((resolve) => {
    if (!cropperInstance) {
      cancelCrop();
      resolve();
      return;
    }
    const canvas = cropperInstance.getCroppedCanvas({
      maxWidth: 2048,
      maxHeight: 2048,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      fillColor: "#fff",
    });
    if (!canvas) {
      cancelCrop();
      resolve();
      return;
    }
    canvas.toBlob(
      (blob) => {
        _cleanup();
        document.getElementById("crop-modal-overlay")?.remove();
        if (cropResolve) {
          cropResolve(blob);
          cropResolve = null;
        }
        resolve();
      },
      currentMimeType,
      0.92
    );
  });

export const cancelCrop = () => {
  _cleanup();
  document.getElementById("crop-modal-overlay")?.remove();
  if (cropResolve) {
    cropResolve(null);
    cropResolve = null;
  }
};

export const cropRotateLeft = () => {
  if (cropperInstance) cropperInstance.rotate(-90);
};

export const cropRotateRight = () => {
  if (cropperInstance) cropperInstance.rotate(90);
};

export const cropZoomIn = () => {
  if (cropperInstance) cropperInstance.zoom(0.1);
};

export const cropZoomOut = () => {
  if (cropperInstance) cropperInstance.zoom(-0.1);
};

export const cropReset = () => {
  if (cropperInstance) cropperInstance.reset();
};

const _cleanup = () => {
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
};

const _buildCropModal = () => {
  const overlay = document.createElement("div");
  overlay.id = "crop-modal-overlay";
  overlay.className = "crop-modal-overlay";

  const container = document.createElement("div");
  container.className = "crop-modal-container";

  // Header
  const header = document.createElement("div");
  header.className = "crop-modal-header";

  const title = document.createElement("span");
  title.className = "crop-modal-title";
  title.textContent = "Crop Image";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "crop-modal-close-btn";
  closeBtn.setAttribute("data-label", "crop-cancel");
  closeBtn.textContent = "×";

  header.append(title, closeBtn);

  // Body (cropper lives here)
  const body = document.createElement("div");
  body.className = "crop-modal-body";

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "crop-modal-image-wrapper";

  const imgEl = document.createElement("img");
  imgEl.id = "crop-modal-img";
  imgEl.className = "crop-modal-img";

  imageWrapper.append(imgEl);
  body.append(imageWrapper);

  // Controls toolbar
  const controls = document.createElement("div");
  controls.className = "crop-modal-controls";

  const rotateGroup = document.createElement("div");
  rotateGroup.className = "crop-controls-group";

  const rotateLeftBtn = document.createElement("button");
  rotateLeftBtn.type = "button";
  rotateLeftBtn.className = "crop-ctrl-btn";
  rotateLeftBtn.setAttribute("data-label", "crop-rotate-left");
  rotateLeftBtn.title = "Rotate Left";
  rotateLeftBtn.textContent = "↺";

  const rotateRightBtn = document.createElement("button");
  rotateRightBtn.type = "button";
  rotateRightBtn.className = "crop-ctrl-btn";
  rotateRightBtn.setAttribute("data-label", "crop-rotate-right");
  rotateRightBtn.title = "Rotate Right";
  rotateRightBtn.textContent = "↻";

  rotateGroup.append(rotateLeftBtn, rotateRightBtn);

  const zoomGroup = document.createElement("div");
  zoomGroup.className = "crop-controls-group";

  const zoomInBtn = document.createElement("button");
  zoomInBtn.type = "button";
  zoomInBtn.className = "crop-ctrl-btn";
  zoomInBtn.setAttribute("data-label", "crop-zoom-in");
  zoomInBtn.title = "Zoom In";
  zoomInBtn.textContent = "+";

  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.type = "button";
  zoomOutBtn.className = "crop-ctrl-btn";
  zoomOutBtn.setAttribute("data-label", "crop-zoom-out");
  zoomOutBtn.title = "Zoom Out";
  zoomOutBtn.textContent = "−";

  zoomGroup.append(zoomInBtn, zoomOutBtn);

  const resetGroup = document.createElement("div");
  resetGroup.className = "crop-controls-group";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "crop-ctrl-btn";
  resetBtn.setAttribute("data-label", "crop-reset");
  resetBtn.title = "Reset";
  resetBtn.textContent = "⟳";

  resetGroup.append(resetBtn);

  controls.append(rotateGroup, zoomGroup, resetGroup);

  // Actions row
  const actions = document.createElement("div");
  actions.className = "crop-modal-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-admin-cancel";
  cancelBtn.setAttribute("data-label", "crop-cancel");
  cancelBtn.textContent = "Cancel";

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn btn-admin-submit";
  confirmBtn.setAttribute("data-label", "crop-confirm");
  confirmBtn.textContent = "Apply Crop";

  actions.append(cancelBtn, confirmBtn);

  container.append(header, body, controls, actions);
  overlay.append(container);

  return { overlay, imgEl };
};
