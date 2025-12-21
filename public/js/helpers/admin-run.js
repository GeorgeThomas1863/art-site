import { ADMIN_EDIT_DEFAULT_ARRAY } from "../util/define-things.js";
import { sendToBackFile, sendToBack, sendToBackGET } from "../util/api-front.js";
import { getNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";

//EVENT HANDLERS
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

//PIC
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

//------

//Add
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

//----

//Edit
export const runEditProduct = async () => {
  // Need to get the selected product ID first
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to update", "error");
    return null;
  }
  const editProductParams = await getEditProductParams();
  if (!editProductParams || !editProductParams.name || !editProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  //FIX THE PIC HERE

  const productId = selectedOption.value;
  editProductParams.productId = productId;
  editProductParams.route = "/edit-product-route";
  console.log("UPDATE PRODUCT PARAMS");
  console.dir(editProductParams);

  const data = await sendToBack(editProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to update product", "error");
    return null;
  }

  const popupText = `Product "${data.name}" updated successfully`;
  await displayPopup(popupText, "success");

  // Refresh the product data to reflect changes
  const productData = await sendToBackGET({ route: "/get-product-data-route" });
  if (productData) {
    await populateAdminProductSelector(productData);

    // Re-select the product that was just updated so user can see the changes
    productSelector.value = productId;

    // Re-populate the form with the updated data
    const updatedOption = productSelector.options[productSelector.selectedIndex];
    if (updatedOption && updatedOption.productData) {
      await populateAdminEditForm(updatedOption.productData);
    }
  }

  return data;
};

export const runDeleteProduct = async () => {
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to delete", "error");
    return null;
  }

  const productName = document.getElementById("edit-name").value;
  const confirmMessage = `Are you sure you want to delete ${productName}? This action cannot be undone.`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);

  if (!confirmDialog) return null;

  const productId = selectedOption.value;

  const data = await sendToBack({ route: "/delete-product-route", productId: productId });
  if (!data || !data.success) {
    await displayPopup("Failed to delete product", "error");
    return null;
  }

  const popupText = `Product "${productName}" deleted successfully`;
  await displayPopup(popupText, "success");

  return data;
};

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    // User selected the default "-- Select a product --" option
    await clearAdminEditFields();
    await disableAdminEditFields();
    return null;
  }

  // Get product data directly from the property
  const productObj = selectedOption.productData;
  if (!productObj) return null;

  // Enable all fields
  await enableAdminEditFields();

  // Populate the form
  await populateAdminEditForm(productObj);
};

//+++++++++++++++++++++++++++++++++++++++++++++++

//DATA

//[sets data for rest of form]
export const populateAdminProductSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const productSelector = document.getElementById("product-selector");
  if (!productSelector) return;

  // Clear existing options except the default one
  const defaultOption = productSelector.querySelector("option[disabled]");
  productSelector.innerHTML = "";
  if (defaultOption) {
    productSelector.append(defaultOption);
  }

  // Add all products as options
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const option = document.createElement("option");
    option.value = product.productId;
    option.textContent = `${product.name} - ${product.productType}`;
    option.productData = product; //stores product data to then display on select
    productSelector.append(option);
  }

  return true;
};

export const populateAdminEditForm = async (inputObj) => {
  if (!inputObj) return null;
  const { name, productType, price, description, display, sold, picData } = inputObj;

  const adminEditMapArray = [
    { id: "edit-name", value: name },
    { id: "edit-product-type", value: productType },
    { id: "edit-price", value: price },
    { id: "edit-description", value: description },
    { id: "edit-display", value: display },
    { id: "edit-sold", value: sold },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) {
    deleteButton.style.display = "block";
  }

  // Image preview - UPDATED IDs
  if (!picData || !picData.filename) return null;

  const currentImage = document.getElementById("edit-current-image");
  const currentImagePreview = document.getElementById("edit-current-image-preview");
  const editUploadButton = document.getElementById("edit-upload-button");
  if (!currentImage || !currentImagePreview || !editUploadButton) return null;

  //set pic data to upload button (to get correct pic when submitting edit)
  editUploadButton.uploadData = picData;
  currentImage.src = `/pics/${picData.filename}`;
  currentImagePreview.style.display = "flex";
};

export const enableAdminEditFields = async () => {
  for (let i = 0; i < ADMIN_EDIT_DEFAULT_ARRAY.length; i++) {
    const field = document.getElementById(ADMIN_EDIT_DEFAULT_ARRAY[i]);
    if (field) {
      field.disabled = false;
    }
  }

  return true;
};

export const disableAdminEditFields = async () => {
  for (let i = 0; i < ADMIN_EDIT_DEFAULT_ARRAY.length; i++) {
    const field = document.getElementById(ADMIN_EDIT_DEFAULT_ARRAY[i]);
    if (field) {
      field.disabled = true;
    }
  }

  return true;
};

export const clearAdminAddFields = async () => {
  const clearFieldsArray = ["name", "price", "description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  // Reset select dropdowns to defaults
  const productTypeSelect = document.getElementById("product-type");
  if (productTypeSelect) {
    productTypeSelect.selectedIndex = 0; // Reset to first option (Acorns)
  }

  const displaySelect = document.getElementById("display");
  if (displaySelect) {
    displaySelect.value = "yes"; // Reset to default
  }

  const soldSelect = document.getElementById("sold");
  if (soldSelect) {
    soldSelect.value = "no"; // Reset to default
  }

  // Clear image preview
  const currentImagePreview = document.getElementById("current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }

  // Reset upload button and status
  const uploadButton = document.getElementById("upload-button");
  const uploadStatus = document.getElementById("upload-status");
  const uploadInput = document.getElementById("upload-pic-input");

  if (uploadButton) {
    uploadButton.uploadData = null;
    uploadButton.textContent = "Choose Image";
  }

  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.style.display = "none";
  }

  if (uploadInput) {
    uploadInput.value = ""; // Clear the file input
  }

  return true;
};

export const clearAdminEditFields = async () => {
  const clearFieldsArray = ["edit-name", "edit-price", "edit-description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  const currentImagePreview = document.getElementById("edit-current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }

  // Clear upload data
  const uploadButton = document.getElementById("edit-upload-button");
  const uploadStatus = document.getElementById("edit-upload-status");
  const uploadInput = document.getElementById("edit-upload-pic-input");

  if (uploadButton) {
    uploadButton.uploadData = null;
    uploadButton.textContent = "Change Image";
  }

  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.style.display = "none";
  }

  if (uploadInput) {
    uploadInput.value = "";
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) {
    deleteButton.style.display = "none";
  }

  return true;
};
