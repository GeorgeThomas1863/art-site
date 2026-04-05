import { sendToBack, sendToBackFile } from "../util/api-front.js";
import { openImageEditor } from './image-editor.js';

// SLOT-BASED UPLOAD FUNCTIONS (for multi-image products)

export const runSlotUploadClick = async (uploadBtn) => {
  if (!uploadBtn) return null;
  const slot = uploadBtn.closest(".pic-slot");
  if (!slot) return null;
  const fileInput = slot.querySelector(".pic-file-input");
  if (!fileInput) return null;
  fileInput.click();
};

export const runSlotUploadPic = async (fileInput) => {
  if (!fileInput) return null;
  const pic = fileInput.files[0];
  if (!pic) return null;

  const slot = fileInput.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const uploadStatus = slot.querySelector(".upload-status");
  const currentImage = slot.querySelector(".current-image");
  const currentVideo = slot.querySelector(".current-video");
  const imagePlaceholder = slot.querySelector(".image-placeholder");
  const deleteImageBtn = slot.querySelector(".delete-image-btn");

  if (!uploadBtn || !uploadStatus) return null;

  const entityType = uploadBtn.entityType || "products";
  const uploadRoute = entityType === "events" ? "/upload-event-pic-route" : "/upload-product-pic-route";

  uploadBtn.uploadData = null;
  uploadStatus.textContent = "Uploading...";
  uploadStatus.classList.remove("hidden");
  uploadBtn.disabled = true;

  const formData = new FormData();
  formData.append("image", pic);

  const data = await sendToBackFile({ route: uploadRoute, formData: formData });

  if (data === "FAIL") {
    uploadStatus.textContent = "✗ Upload failed";
    uploadStatus.style.color = "red";
    uploadBtn.uploadData = null;
    uploadBtn.disabled = false;
    return null;
  }

  uploadStatus.textContent = `✓ ${pic.name}`;
  uploadStatus.style.color = "green";
  uploadBtn.textContent = "Change File";
  uploadBtn.disabled = false;
  data.originalFilename = data.filename;
  uploadBtn.uploadData = data;

  if (data.mediaType === "video") {
    if (currentVideo && data.filename) {
      currentVideo.src = `/images/${entityType}/${data.filename}`;
      currentVideo.classList.remove("hidden");
      if (currentImage) currentImage.classList.add("hidden");
      if (imagePlaceholder) imagePlaceholder.classList.add("hidden");
      if (deleteImageBtn) deleteImageBtn.classList.remove("hidden");
    }
  } else {
    if (currentImage && data && data.filename) {
      currentImage.src = `/images/${entityType}/${data.filename}`;
      currentImage.classList.remove("hidden");
      if (currentVideo) currentVideo.classList.add("hidden");
      if (imagePlaceholder) imagePlaceholder.classList.add("hidden");
      if (deleteImageBtn) deleteImageBtn.classList.remove("hidden");
    }
    const editBtn = slot.querySelector('.edit-image-btn');
    if (editBtn) editBtn.classList.remove('hidden');
  }

  return data;
};

export const runDeleteSlotImage = async (deleteBtn) => {
  if (!deleteBtn) return null;

  const slot = deleteBtn.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const uploadStatus = slot.querySelector(".upload-status");
  const currentImage = slot.querySelector(".current-image");
  const currentVideo = slot.querySelector(".current-video");
  const imagePlaceholder = slot.querySelector(".image-placeholder");
  const fileInput = slot.querySelector(".pic-file-input");

  const entityType = uploadBtn?.entityType || "products";
  const filename = uploadBtn?.uploadData?.filename;
  const originalFilename = uploadBtn?.uploadData?.originalFilename;

  if (filename) {
    await sendToBack({ route: "/delete-pic-route", filename, entityType });
  }
  if (originalFilename && originalFilename !== filename) {
    await sendToBack({ route: "/delete-pic-route", filename: originalFilename, entityType });
  }

  if (uploadBtn) {
    uploadBtn.uploadData = null;
    uploadBtn.textContent = "Choose File";
  }
  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.classList.add("hidden");
  }
  if (currentImage) {
    currentImage.src = "";
    currentImage.classList.add("hidden");
  }
  if (currentVideo) {
    currentVideo.src = "";
    currentVideo.classList.add("hidden");
  }
  if (imagePlaceholder) imagePlaceholder.classList.remove("hidden");
  deleteBtn.classList.add("hidden");
  if (fileInput) fileInput.value = "";

  const editBtn = slot.querySelector(".edit-image-btn");
  if (editBtn) editBtn.classList.add("hidden");
};

export const runEditSlotImage = async (editBtn) => {
  if (!editBtn) return null;
  const slot = editBtn.closest('.pic-slot');
  if (!slot) return null;
  const uploadBtn = slot.querySelector('.upload-btn');
  const previewImg = slot.querySelector('.current-image');
  if (!uploadBtn || !previewImg) return null;
  const src = previewImg.src;
  if (!src || !uploadBtn.uploadData) return;
  const oldFilename = uploadBtn.uploadData.filename;
  const originalFilename = uploadBtn.uploadData.originalFilename || oldFilename;
  const entityType = uploadBtn.entityType || "products";
  const uploadRoute = entityType === "events" ? "/upload-event-pic-route" : "/upload-product-pic-route";

  const hasEdits = originalFilename !== oldFilename;

  const rawExt = (oldFilename.split('.').pop() || 'jpg').toLowerCase();
  const mimeType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[rawExt] || 'image/jpeg';
  const blobExt = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  openImageEditor({
    src,
    mimeType,
    onApply: async (blob) => {
      const currentFilename = uploadBtn.uploadData.filename;
      const formData = new FormData();
      formData.append('image', blob, `edited-image.${blobExt}`);

      const data = await sendToBackFile({ route: uploadRoute, formData: formData });

      if (!data || data === 'FAIL') throw new Error('Upload failed');

      // Only delete if current file is not the original (never delete the original)
      if (currentFilename && currentFilename !== originalFilename) {
        await sendToBack({ route: '/delete-pic-route', filename: currentFilename, entityType });
      }

      uploadBtn.uploadData = { ...data, originalFilename };
      previewImg.src = '/images/' + entityType + '/' + data.filename;
    },
    originalSrc: hasEdits ? `/images/${entityType}/${originalFilename}` : undefined,
    onRevert: hasEdits ? async () => {
      await sendToBack({ route: '/delete-pic-route', filename: oldFilename, entityType });
      uploadBtn.uploadData = { ...uploadBtn.uploadData, filename: originalFilename };
      previewImg.src = `/images/${entityType}/${originalFilename}`;
    } : undefined,
  });
};


