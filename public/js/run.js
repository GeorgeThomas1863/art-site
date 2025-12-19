import { EYE_OPEN_SVG, EYE_CLOSED_SVG } from "./util/define-things.js";
import { sendToBack, sendToBackFile } from "./util/api-front.js";
import { getNewProductParams } from "./util/params.js";
import { displayPopup } from "./util/popup.js";

export const runAuthSubmit = async () => {
  const authPwInput = document.getElementById("auth-pw-input");
  if (!authPwInput || !authPwInput.value) return null;

  const data = await sendToBack({ route: "/site-auth-route", pw: authPwInput.value });

  if (!data || !data.redirect) return null;

  window.location.href = data.redirect;
  return data;
};

//----------------------

export const runPwToggle = async () => {
  const pwButton = document.querySelector(".password-toggle-btn");
  const pwInput = document.querySelector(".password-input");
  const currentSvgId = pwButton.querySelector("svg").id;

  if (currentSvgId === "eye-closed-icon") {
    pwButton.innerHTML = EYE_OPEN_SVG;
    pwInput.type = "text";
    return true;
  }

  pwButton.innerHTML = EYE_CLOSED_SVG;
  pwInput.type = "password";
  return true;
};

//---------------------

export const runUploadClick = async () => {
  const picInput = document.getElementById("upload-pic-input");
  if (!picInput) return null;

  picInput.click();
  // return true;
};

export const runUploadPic = async (pic) => {
  if (!pic) return null;

  console.log("PIC");
  console.log(pic);

  const uploadStatus = document.getElementById("upload-status");
  const uploadButton = document.getElementById("upload-button");
  uploadButton.uploadData = null;

  uploadStatus.textContent = "Uploading...";
  uploadStatus.style.display = "inline";
  uploadButton.disabled = true;

  const formData = new FormData();
  formData.append("image", pic);

  const data = await sendToBackFile({ route: "/upload-pic-route", formData: formData });
  if (data === "FAIL") {
    uploadStatus.textContent = "✗ Upload failed";
    uploadStatus.style.color = "red";
    uploadButton.uploadData = null;
    return null;
  }

  uploadStatus.textContent = `✓ ${pic.name}`;
  uploadStatus.style.color = "green";
  uploadButton.textContent = "Change Image";
  uploadButton.disabled = false;
  uploadButton.uploadData = data;

  return data;
};

//ADD CHECK FOR IMAGE [CLEAR DATA FROM UPLOAD BUTTON BEFORE UPLOAD]
export const runAddNewProduct = async () => {
  //check if image uploaded
  const uploadButton = document.getElementById("upload-button");
  if (!uploadButton.uploadData) {
    await displayPopup("Please upload an image of the product first", "error");
    return null;
  }

  const newProductParams = await getNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  newProductParams.route = "/add-new-product-route";
  console.log("NEW PRODUCT PARAMS");
  console.dir(newProductParams);

  const data = await sendToBack(newProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new product", "error");
    return null;
  }

  console.log("DATA");
  console.dir(data);
  const popupText = `Product "${data.name}" added successfully`;

  await displayPopup(popupText, "success");

  return data;
};
