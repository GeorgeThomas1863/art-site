import { sendToBack } from "./api-front.js";

export const uploadFile = async (file) => {
  if (!file) return null;

  const uploadRoute = await sendToBack({ route: "/get-backend-value-route", key: "uploadRoute" });
  if (!uploadRoute) return null;

  const uploadStatus = document.getElementById("upload-status");
  const uploadButton = document.getElementById("upload-button");

  uploadStatus.textContent = "Uploading...";
  uploadStatus.style.display = "inline";
  uploadButton.disabled = true;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(uploadRoute, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.error) {
      uploadStatus.textContent = `✗ ${result.error}`;
      uploadStatus.style.color = "red";
      return null;
    }

    // await checkFile();

    // uploadStatus.textContent = `✓ ${file.name}`;
    // uploadStatus.style.color = "green";
    // uploadButton.textContent = "Change Resume";
    // uploadButton.dataset.uploadedFile = result.filename;
    return result;
  } catch (error) {
    console.error("Upload failed:", error);
    uploadStatus.textContent = "✗ Upload failed";
    uploadStatus.style.color = "red";
    return null;
  } finally {
    uploadButton.disabled = false;
  }
};
