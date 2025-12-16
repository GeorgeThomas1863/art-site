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
  formData.append("resume", file);

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

// export const checkFile = async () => {
//   const uploadStatus = document.getElementById("upload-status");
//   const uploadButton = document.getElementById("upload-button");
//   if (!uploadStatus || !uploadButton) return null;

//   const checkRoute = await sendToBack({ route: "/get-backend-value-route", key: "checkRoute" });
//   const fileData = await sendToBackGET({ route: checkRoute });
//   if (!fileData || !fileData.success) return null;
//   console.log("CHECK FILE FILE DATA");
//   console.log(fileData);

//   uploadStatus.textContent = `✓ ${fileData.filename}`;
//   uploadStatus.style.color = "green";
//   uploadButton.textContent = "Change Resume";
//   uploadStatus.style.display = "inline";
//   uploadButton.dataset.uploadedFile = fileData.filename;

//   return fileData;
// };
