import { EYE_OPEN_SVG, EYE_CLOSED_SVG } from "./util/define-things.js";
import { sendToBack, sendToBackFile, sendToBackGET } from "./util/api-front.js";
import { getNewProductParams, getEditProductParams } from "./util/params.js";
import { displayPopup } from "./util/popup.js";
import { populateAdminProductSelector, clearAdminAddFields } from "./helpers/admin-data.js";

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

export const runUploadClick = async (clickedElement) => {
  if (!clickedElement) return null;

  const mode = clickedElement.id.includes("edit") ? "edit" : "add";
  const picInputId = mode === "add" ? "upload-pic-input" : "edit-upload-pic-input";
  const picInput = document.getElementById(picInputId);

  if (!picInput) return null;
  picInput.click();
};

export const runUploadPic = async (pic, mode = "add") => {
  if (!pic) return null;

  console.log(`${mode.toUpperCase()} PIC`);
  console.log(pic);

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

  const formData = new FormData();
  formData.append("image", pic);

  const data = await sendToBackFile({ route: "/upload-pic-route", formData: formData });

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
    currentImage.src = `/pics/${data.filename}`;
    currentImagePreview.style.display = "flex";
  }

  return data;
};

//ADD CHECK FOR IMAGE [CLEAR DATA FROM UPLOAD BUTTON BEFORE UPLOAD]
export const runAddNewProduct = async () => {
  const newProductParams = await getNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  //check if image uploaded
  const uploadButton = document.getElementById("upload-button");
  if (!uploadButton.uploadData) {
    await displayPopup("Please upload an image of the product first", "error");
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

  // Clear the form after successful submission
  await clearAdminAddFields();

  return data;
};

export const runUpdateProduct = async () => {
  // Need to get the selected product ID first
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to update", "error");
    return null;
  }
  const updateProductParams = await getEditProductParams();
  if (!updateProductParams || !updateProductParams.name || !updateProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  const productId = selectedOption.value;
  updateProductParams.productId = productId;
  updateProductParams.route = "/update-product-route";
  console.log("UPDATE PRODUCT PARAMS");
  console.dir(updateProductParams);

  const data = await sendToBack(updateProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to update product", "error");
    return null;
  }

  const popupText = `Product "${data.name}" updated successfully`;
  await displayPopup(popupText, "success");

  return data;
};

export const runTabClick = async (clickElement) => {
  if (!clickElement) return null;
  const tabType = clickElement.getAttribute("data-tab");
  if (!tabType || (tabType !== "add" && tabType !== "edit")) return null;

  const tabButtons = document.querySelectorAll(".admin-tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
  clickElement.classList.add("active");

  const addTab = document.getElementById("add-tab");
  const editTab = document.getElementById("edit-tab");

  if (tabType === "add") {
    addTab.style.display = "block";
    editTab.style.display = "none";
    return true;
  }

  addTab.style.display = "none";
  editTab.style.display = "block";

  const productData = await sendToBackGET({ route: "/get-product-data-route" });

  console.log("PRODUCT DATA");
  console.dir(productData);

  await populateAdminProductSelector(productData); //in admin form

  return true;
};
