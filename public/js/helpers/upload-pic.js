import { sendToBack, sendToBackFile } from "../util/api-front.js";

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

  // console.log("RUN UPLOAD PIC");
  // console.log("PIC");
  // console.log(pic);
  // console.log("MODE");
  // console.log(mode);
  // console.log("ENTITY TYPE");
  // console.log(entityType);

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

  console.log("DATA");
  console.log(data);

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
  uploadButton.uploadData = data;

  // Show the image preview
  const currentImage = document.getElementById(currentImageId);
  const currentImagePreview = document.getElementById(currentImagePreviewId);

  if (currentImage && currentImagePreview && data && data.filename) {
    currentImage.src = `/images/${entityType}/${data.filename}`;
    currentImagePreview.style.display = "flex";
  }

  return data;
};

// export const uploadFile = async (file) => {
//   if (!file) return null;

//   const uploadRoute = await sendToBack({ route: "/get-backend-value-route", key: "uploadRoute" });
//   if (!uploadRoute) return null;

//   const uploadStatus = document.getElementById("upload-status");
//   const uploadButton = document.getElementById("upload-button");

//   uploadStatus.textContent = "Uploading...";
//   uploadStatus.style.display = "inline";
//   uploadButton.disabled = true;

//   const formData = new FormData();
//   formData.append("image", file);

//   try {
//     const response = await fetch(uploadRoute, {
//       method: "POST",
//       body: formData,
//     });

//     const result = await response.json();

//     if (result.error) {
//       uploadStatus.textContent = `✗ ${result.error}`;
//       uploadStatus.style.color = "red";
//       return null;
//     }

//     return result;
//   } catch (error) {
//     console.error("Upload failed:", error);
//     uploadStatus.textContent = "✗ Upload failed";
//     uploadStatus.style.color = "red";
//     return null;
//   } finally {
//     uploadButton.disabled = false;
//   }
// };

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

  // Get filename from uploadData if it exists
  const filename = uploadButton.uploadData?.filename;

  // If we have a filename, delete it from the server
  if (filename) {
    const result = await sendToBack({
      route: "/delete-pic-route",
      filename: filename,
    });

    if (result === "FAIL") {
      console.error("Failed to delete image from server");
      // Continue with frontend cleanup anyway
    }
  }

  // Reset all upload-related UI elements
  uploadButton.uploadData = null;
  uploadButton.textContent = mode === "add" ? "Choose Image" : "Change Image";
  uploadStatus.textContent = "";
  uploadStatus.style.display = "none";
  currentImage.src = "";
  currentImagePreview.style.display = "none";
  picInput.value = ""; // Clear the file input

  console.log("Image deleted");
};
