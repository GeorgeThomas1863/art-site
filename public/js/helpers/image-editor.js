import { showLoadStatus, hideLoadStatus } from '../util/loading.js';
import { displayPopup } from '../util/popup.js';

let cropperInstance = null;
let currentOnApply = null;
let flipHState = 1;
let flipVState = 1;

export function openImageEditor({ src, onApply }) {
  currentOnApply = onApply;
  flipHState = 1;
  flipVState = 1;

  const overlay = document.getElementById('image-editor-overlay');
  const img = document.getElementById('image-editor-img');

  function initCropper() {
    if (typeof Cropper === 'undefined') {
      displayPopup('Image editor unavailable. Please refresh and try again.', 'error');
      overlay.classList.remove('visible');
      return;
    }
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    cropperInstance = new Cropper(img, {
      viewMode: 1,
      autoCropArea: 1,
      aspectRatio: NaN,
      responsive: true,
      background: false,
    });
  }

  img.onload = initCropper;
  img.src = src;
  // If the browser cached the image, onload won't fire — trigger manually
  if (img.complete && img.naturalWidth > 0) initCropper();

  overlay.classList.add('visible');
}

export function closeImageEditor() {
  const overlay = document.getElementById('image-editor-overlay');
  overlay.classList.remove('visible');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  currentOnApply = null;
}

export async function applyImageEditor() {
  if (!cropperInstance || !currentOnApply) return;

  const editorContent = document.querySelector('#image-editor-overlay .modal-content');
  showLoadStatus(editorContent, 'Applying...');

  const canvas = cropperInstance.getCroppedCanvas();
  if (!canvas) {
    displayPopup('Could not process image. Please try again.', 'error');
    hideLoadStatus();
    return;
  }
  canvas.toBlob(async (blob) => {
    if (!blob) {
      displayPopup('Could not encode image. Please try again.', 'error');
      hideLoadStatus();
      closeImageEditor();
      return;
    }
    try {
      await currentOnApply(blob);
    } catch (err) {
      displayPopup('Failed to apply edit. Please try again.', 'error');
    } finally {
      hideLoadStatus();
      closeImageEditor();
    }
  }, 'image/jpeg', 0.92);
}

export function zoomIn()      { if (cropperInstance) cropperInstance.zoom(0.1); }
export function zoomOut()     { if (cropperInstance) cropperInstance.zoom(-0.1); }
export function rotateLeft()  { if (cropperInstance) cropperInstance.rotate(-90); }
export function rotateRight() { if (cropperInstance) cropperInstance.rotate(90); }

export function flipH() {
  if (!cropperInstance) return;
  flipHState = -flipHState;
  cropperInstance.scaleX(flipHState);
}

export function flipV() {
  if (!cropperInstance) return;
  flipVState = -flipVState;
  cropperInstance.scaleY(flipVState);
}
