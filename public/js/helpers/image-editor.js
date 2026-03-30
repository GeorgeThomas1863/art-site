import { showLoadStatus, hideLoadStatus } from '../util/loading.js';
import { displayPopup } from '../util/popup.js';

let cropperInstance = null;
let currentOnApply = null;
let currentOnRevert = null;
let currentOriginalSrc = null;
let flipHState = 1;
let flipVState = 1;

function initCropper() {
  if (typeof Cropper === 'undefined') {
    displayPopup('Image editor unavailable. Please refresh and try again.', 'error');
    const overlay = document.getElementById('image-editor-overlay');
    if (overlay) overlay.classList.remove('visible');
    return;
  }
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  const img = document.getElementById('image-editor-img');
  cropperInstance = new Cropper(img, {
    viewMode: 1,
    autoCropArea: 1,
    aspectRatio: NaN,
    responsive: true,
    background: false,
  });
}

function buildEditorOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'image-editor-overlay';

  const wrapper = document.createElement('div');
  wrapper.className = 'modal-wrapper';

  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('h3');
  title.className = 'modal-title';
  title.textContent = 'Edit Image';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('data-label', 'image-editor-cancel');
  header.appendChild(title);
  header.appendChild(closeBtn);

  const canvasArea = document.createElement('div');
  canvasArea.className = 'image-editor-canvas-area';
  const img = document.createElement('img');
  img.id = 'image-editor-img';
  img.alt = 'Image to edit';
  canvasArea.appendChild(img);

  const toolbar = document.createElement('div');
  toolbar.className = 'image-editor-toolbar';

  const toolbarButtons = [
    { label: 'image-editor-zoom-in',      text: '🔍+' },
    { label: 'image-editor-zoom-out',     text: '🔍−' },
    { label: 'image-editor-rotate-left',  text: '↺' },
    { label: 'image-editor-rotate-right', text: '↻' },
    { label: 'image-editor-flip-h',       text: '⇔' },
    { label: 'image-editor-flip-v',       text: '↕' },
  ];

  for (let i = 0; i < toolbarButtons.length; i++) {
    const btn = toolbarButtons[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'image-editor-btn';
    b.setAttribute('data-label', btn.label);
    b.textContent = btn.text;
    toolbar.appendChild(b);
  }

  const divider = document.createElement('span');
  divider.className = 'image-editor-toolbar-divider';

  const revertBtn = document.createElement('button');
  revertBtn.type = 'button';
  revertBtn.className = 'revert-image-btn hidden';
  revertBtn.setAttribute('data-label', 'image-editor-revert');
  revertBtn.textContent = '↩ Revert To Original';

  toolbar.appendChild(divider);
  toolbar.appendChild(revertBtn);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-admin-cancel';
  cancelBtn.setAttribute('data-label', 'image-editor-cancel');
  cancelBtn.textContent = 'Cancel';
  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'btn-admin-submit';
  applyBtn.setAttribute('data-label', 'image-editor-apply');
  applyBtn.textContent = 'Apply';
  actions.appendChild(cancelBtn);
  actions.appendChild(applyBtn);

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.appendChild(toolbar);
  content.appendChild(canvasArea);
  content.appendChild(actions);

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  overlay.appendChild(wrapper);
  return overlay;
}

export function openImageEditor({ src, onApply, originalSrc, onRevert }) {
  currentOnApply = onApply;
  currentOnRevert = onRevert || null;
  currentOriginalSrc = originalSrc || null;
  flipHState = 1;
  flipVState = 1;

  // Remove any stale instance from a previous open
  const existing = document.getElementById('image-editor-overlay');
  if (existing) existing.remove();

  // Create fresh overlay and append inside the currently-visible admin modal
  const overlay = buildEditorOverlay();
  const activeModal = document.querySelector('.modal-overlay.visible');
  const parent = activeModal || document.getElementById('admin-element');
  parent.appendChild(overlay);

  const img = document.getElementById('image-editor-img');

  const revertBtn = overlay.querySelector('.revert-image-btn');
  if (revertBtn) {
    if (originalSrc && originalSrc !== src) {
      revertBtn.classList.remove('hidden');
    } else {
      revertBtn.classList.add('hidden');
    }
  }

  img.onload = null;
  img.src = '';
  img.onload = initCropper;
  img.src = src;

  overlay.classList.add('visible');
}

export function closeImageEditor() {
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  currentOnApply = null;
  currentOnRevert = null;
  currentOriginalSrc = null;
  const overlay = document.getElementById('image-editor-overlay');
  if (overlay) overlay.remove();
}

export async function revertImageEditor() {
  if (!currentOnRevert || !currentOriginalSrc) return;

  const editorContent = document.querySelector('#image-editor-overlay .modal-content');
  showLoadStatus(editorContent, 'Reverting...');

  try {
    await currentOnRevert();
  } catch (err) {
    displayPopup('Failed to revert image. Please try again.', 'error');
    hideLoadStatus();
    return;
  }

  flipHState = 1;
  flipVState = 1;

  const img = document.getElementById('image-editor-img');
  img.onload = null;
  img.onerror = null;
  img.src = '';
  img.onload = () => {
    img.onerror = null;
    initCropper();
    hideLoadStatus();
  };
  img.onerror = () => {
    img.onerror = null;
    displayPopup('Failed to load original image. Please try again.', 'error');
    hideLoadStatus();
  };
  img.src = currentOriginalSrc;

  const revertBtn = document.querySelector('#image-editor-overlay .revert-image-btn');
  if (revertBtn) revertBtn.classList.add('hidden');

  currentOnRevert = null;
  currentOriginalSrc = null;
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
