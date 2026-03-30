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
  uploadBtn.textContent = "Change Image";
  uploadBtn.disabled = false;
  data.originalFilename = data.filename;
  uploadBtn.uploadData = data;

  if (currentImage && data && data.filename) {
    currentImage.src = `/images/${entityType}/${data.filename}`;
    currentImage.classList.remove("hidden");
    if (imagePlaceholder) imagePlaceholder.classList.add("hidden");
    if (deleteImageBtn) deleteImageBtn.classList.remove("hidden");
  }

  const editBtn = slot.querySelector('.edit-image-btn');
  if (editBtn) editBtn.classList.remove('hidden');

  return data;
};

export const runDeleteSlotImage = async (deleteBtn) => {
  if (!deleteBtn) return null;

  const slot = deleteBtn.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const uploadStatus = slot.querySelector(".upload-status");
  const currentImage = slot.querySelector(".current-image");
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
    uploadBtn.textContent = "Choose Image";
  }
  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.classList.add("hidden");
  }
  if (currentImage) {
    currentImage.src = "";
    currentImage.classList.add("hidden");
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

  openImageEditor({
    src,
    onApply: async (blob) => {
      const currentFilename = uploadBtn.uploadData.filename;
      const formData = new FormData();
      formData.append('image', blob, 'edited-image.png');

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

export const runEditUploadImage = async (editBtn) => {
  if (!editBtn) return null;
  const area = editBtn.closest('.image-upload-area');
  if (!area) return null;
  const uploadBtn = area.querySelector('.upload-btn');
  const previewImg = area.querySelector('.current-image');
  if (!uploadBtn || !previewImg) return null;
  const src = previewImg.src;
  if (!src || !uploadBtn.uploadData) return;
  const oldFilename = uploadBtn.uploadData.filename;
  const originalFilename = uploadBtn.uploadData.originalFilename || oldFilename;
  const entityType = uploadBtn.entityType;

  const hasEdits = originalFilename !== oldFilename;

  openImageEditor({
    src,
    onApply: async (blob) => {
      const currentFilename = uploadBtn.uploadData.filename;
      const route = entityType === 'products' ? '/upload-product-pic-route' : '/upload-event-pic-route';
      const formData = new FormData();
      formData.append('image', blob, 'edited-image.png');

      const data = await sendToBackFile({ route: route, formData: formData });

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

//PIC
export const runUploadClick = async (clickedElement) => {
  if (!clickedElement) return null;

  const mode = clickedElement.id.includes("edit") ? "edit" : "add";
  const entityType = clickedElement.entityType;
  const picInputId = mode === "add" ? "upload-pic-input" : "edit-upload-pic-input";
  const picInput = document.getElementById(picInputId);
  if (!picInput) return null;
  picInput.entityType = entityType;

  picInput.click();
};

export const runUploadPic = async (pic, mode = "add", entityType = "products") => {
  if (!pic) return null;

  const uploadStatusId = mode === "add" ? "upload-status" : "edit-upload-status";
  const uploadButtonId = mode === "add" ? "upload-button" : "edit-upload-button";
  const currentImageId = mode === "add" ? "current-image" : "edit-current-image";
  const currentImagePreviewId = mode === "add" ? "current-image-preview" : "edit-current-image-preview";

  const uploadStatus = document.getElementById(uploadStatusId);
  const uploadButton = document.getElementById(uploadButtonId);

  if (!uploadStatus || !uploadButton) return null;

  uploadButton.uploadData = null;
  uploadStatus.textContent = "Uploading...";
  uploadStatus.style.display = "inline";
  uploadButton.disabled = true;

  const route = entityType === "products" ? "/upload-product-pic-route" : "/upload-event-pic-route";

  const formData = new FormData();
  formData.append("image", pic);

  const data = await sendToBackFile({ route: route, formData: formData });

  // console.log("DATA");
  // console.log(data);

  if (data === "FAIL") {
    uploadStatus.textContent = "✗ Upload failed";
    uploadStatus.style.color = "red";
    uploadButton.uploadData = null;
    uploadButton.disabled = false;
    return null;
  }

  uploadStatus.textContent = `✓ ${pic.name}`;
  uploadStatus.style.color = "green";
  uploadButton.textContent = "Change Image";
  uploadButton.disabled = false;
  data.originalFilename = data.filename;
  uploadButton.uploadData = data;

  const editBtn = uploadButton.parentElement.querySelector('.edit-image-btn');
  if (editBtn) editBtn.classList.remove('hidden');

  // Show the image preview
  const currentImage = document.getElementById(currentImageId);
  const currentImagePreview = document.getElementById(currentImagePreviewId);

  // console.log("CURRENT IMAGE");
  // console.log(currentImage);
  // console.log("CURRENT IMAGE PREVIEW");
  // console.log(currentImagePreview);

  if (currentImage && currentImagePreview && data && data.filename) {
    currentImage.src = `/images/${entityType}/${data.filename}`;
    currentImage.style.display = "block";
    currentImagePreview.style.display = "flex";

    // Hide placeholder and show delete button
    const placeholder = currentImagePreview.querySelector(".image-placeholder");
    if (placeholder) placeholder.style.display = "none";

    const deleteBtn = currentImagePreview.querySelector(".delete-image-btn");
    if (deleteBtn) deleteBtn.style.display = "block";
  }

  return data;
};

//----------------------

export const runDeleteUploadImage = async (clickedElement) => {
  if (!clickedElement) return null;

  const mode = clickedElement.id.includes("edit") ? "edit" : "add";

  const uploadStatusId = mode === "add" ? "upload-status" : "edit-upload-status";
  const uploadButtonId = mode === "add" ? "upload-button" : "edit-upload-button";
  const currentImageId = mode === "add" ? "current-image" : "edit-current-image";
  const currentImagePreviewId = mode === "add" ? "current-image-preview" : "edit-current-image-preview";
  const picInputId = mode === "add" ? "upload-pic-input" : "edit-upload-pic-input";

  const uploadStatus = document.getElementById(uploadStatusId);
  const uploadButton = document.getElementById(uploadButtonId);
  const currentImage = document.getElementById(currentImageId);
  const currentImagePreview = document.getElementById(currentImagePreviewId);
  const picInput = document.getElementById(picInputId);

  if (!uploadStatus || !uploadButton || !currentImage || !currentImagePreview || !picInput) return null;

  const entityType = uploadButton.entityType || "products";
  const filename = uploadButton.uploadData?.filename;
  const originalFilename = uploadButton.uploadData?.originalFilename;

  if (filename) {
    await sendToBack({ route: "/delete-pic-route", filename, entityType });
  }
  if (originalFilename && originalFilename !== filename) {
    await sendToBack({ route: "/delete-pic-route", filename: originalFilename, entityType });
  }

  uploadButton.uploadData = null;
  uploadButton.textContent = mode === "add" ? "Choose Image" : "Change Image";
  uploadStatus.textContent = "";
  uploadStatus.style.display = "none";
  currentImage.src = "";
  currentImage.style.display = "none";
  currentImagePreview.style.display = "none";
  picInput.value = "";

  const placeholder = currentImagePreview.querySelector(".image-placeholder");
  if (placeholder) placeholder.style.display = "flex";

  const deleteBtn = currentImagePreview.querySelector(".delete-image-btn");
  if (deleteBtn) deleteBtn.style.display = "none";
};

