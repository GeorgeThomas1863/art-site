import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateProductStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";

//Add product
export const runAddNewProduct = async () => {
  const newProductParams = await buildNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  console.log("NEW PRODUCT PARAMS");
  console.dir(newProductParams);

  //check if image uploaded
  const uploadButton = document.getElementById("upload-button");
  if (!uploadButton.uploadData) {
    await displayPopup("Please upload an image of the product first", "error");
    return null;
  }

  const data = await sendToBack(newProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new product", "error");
    return null;
  }

  console.log("DATA");
  console.dir(data);

  const popupText = `Product "${data.name}" added successfully`;
  await displayPopup(popupText, "success");

  // Remove modal
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  // Clear the form after successful submission
  // await clearAdminAddFields();
  // closeModal("add-products-modal");

  // Refresh stats
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) await updateProductStats(productData);

  return data;
};

//----

//Edit product
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
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) {
    await populateAdminProductSelector(productData);
    await updateProductStats(productData);

    // Re-select the product that was just updated so user can see the changes
    productSelector.value = productId;

    // Re-populate the form with the updated data
    const updatedOption = productSelector.options[productSelector.selectedIndex];
    if (updatedOption && updatedOption.productData) {
      await populateEditFormProducts(updatedOption.productData);
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

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  // Refresh the product data to reflect changes
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) {
    // await populateAdminProductSelector(productData);
    await updateProductStats(productData);
  }

  // // Clear the form fields
  // await clearAdminEditFields();
  // await disableAdminEditFields();
  // productSelector.value = "";

  return data;
};

//++++++++++++++++++

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  await clearAdminEditFields();
  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    // User selected the default "-- Select a product --" option
    await disableAdminEditFields();
    return null;
  }

  // Get product data directly from the property
  const productObj = selectedOption.productData;
  if (!productObj) return null;

  // Enable all fields
  await enableAdminEditFields();
  await populateEditFormProducts(productObj);
};

//+++++++++++++++++++++++++++++++++++++++++++++++

//DATA
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

  // Sort by most recently added first
  inputArray.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  // Add all products as options
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const option = document.createElement("option");
    option.value = product.productId;
    option.textContent = `${product.name}`;
    option.productData = product; //stores product data to then display on select
    productSelector.append(option);
  }

  return true;
};

export const populateEditFormProducts = async (inputObj) => {
  if (!inputObj) return null;

  const { name, productType, price, description, display, sold, removeWhenSold, picData, canShip, length, width, height, weight } = inputObj;

  const adminEditMapArray = [
    { id: "edit-name", value: name },
    { id: "edit-product-type", value: productType },
    { id: "edit-price", value: price },
    { id: "edit-can-ship", value: canShip || "yes" },
    { id: "edit-length", value: length || 5 },
    { id: "edit-width", value: width || 5 },
    { id: "edit-height", value: height || 5 },
    { id: "edit-weight", value: weight || 5 },
    { id: "edit-description", value: description },
    { id: "edit-display", value: display },
    { id: "edit-sold", value: sold },
    { id: "edit-remove-when-sold", value: removeWhenSold || "yes" },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  // Sync CSS classes on status selects to match their values
  const statusIds = ["edit-display", "edit-sold", "edit-can-ship", "edit-remove-when-sold"];
  for (const id of statusIds) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("status-yes", "status-no");
      el.classList.add(`status-${el.value}`);
    }
  }

  // Enforce cross-flag invariant on legacy data
  const soldEl = document.getElementById("edit-sold");
  const removeEl = document.getElementById("edit-remove-when-sold");
  const displayEl = document.getElementById("edit-display");

  if (soldEl?.value === "yes" && removeEl?.value === "yes" && displayEl) {
    displayEl.value = "no";
    displayEl.classList.remove("status-yes", "status-no");
    displayEl.classList.add("status-no");
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) {
    // deleteButton.style.display = "block";
    deleteButton.disabled = false;
  }

  // Image preview - UPDATED IDs
  if (!picData || !picData.filename) return null;

  const currentImage = document.getElementById("edit-current-image");
  const currentImagePreview = document.getElementById("edit-current-image-preview");
  const editUploadButton = document.getElementById("edit-upload-button");
  if (!currentImage || !currentImagePreview || !editUploadButton) return null;

  //set pic data to upload button (to get correct pic when submitting edit)
  editUploadButton.uploadData = picData;
  currentImage.src = `/images/products/${picData.filename}`;
  currentImage.style.display = "block";
  currentImagePreview.style.display = "flex";

  const deleteImageBtn = document.getElementById("edit-delete-image-btn");
  if (deleteImageBtn) deleteImageBtn.style.display = "block";

  const placeholder = currentImagePreview.querySelector(".image-placeholder");
  if (placeholder) placeholder.style.display = "none";

  return true;
};
