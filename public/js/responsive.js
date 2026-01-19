import { runModalTrigger, runModalClose, runAddNewProduct, runEditProduct, runDeleteProduct, changeAdminProductSelector } from "./helpers/admin-run.js"; //prettier-ignore
import { runUploadClick, runUploadPic, runDeleteUploadImage } from "./helpers/upload-pic.js";
import { changeProductsFilterButton } from "./helpers/products-run.js";
import { runAddToCart, runIncreaseQuantity, runDecreaseQuantity, runRemoveFromCart } from "./helpers/cart-run.js";
import { runPlaceOrder, runCalculateShipping } from "./helpers/buy-run.js";
import { runAuthSubmit, runPwToggle } from "./auth.js";
import { closePopup, closeConfirmDialog } from "./helpers/popup.js";

const authElement = document.getElementById("auth-element");
const displayElement = document.getElementById("display-element");
const adminElement = document.getElementById("admin-element");
const productsElement = document.getElementById("products-element");
const cartElement = document.getElementById("cart-element");
const checkoutElement = document.getElementById("checkout-element");

export const clickHandler = async (e) => {
  const clickElement = e.target;
  const clickId = clickElement.id;
  const clickType = clickElement.getAttribute("data-label");
  // const tabType = clickElement.getAttribute("data-tab");

  //get rid of
  // const modalTrigger = clickElement.getAttribute("data-modal-trigger");
  // const modalClose = clickElement.getAttribute("data-modal-close");

  console.log("CLICK HANDLER");
  console.log(clickId);
  console.log("CLICK TYPE");
  console.log(clickType);
  // console.log("MODAL TRIGGER");
  // console.log(modalTrigger);
  // console.log("MODAL CLOSE");
  // console.log(modalClose);

  if (clickType === "auth-submit") await runAuthSubmit();
  if (clickType === "pwToggle") await runPwToggle();

  if (clickType === "popup-close") await closePopup();
  if (clickType === "confirm-yes") await closeConfirmDialog(true);
  if (clickType === "confirm-no") await closeConfirmDialog(false);

  if (clickType?.includes("open-modal-")) await runModalTrigger(clickElement);
  if (clickType?.includes("close-modal-")) await runModalClose(clickElement);

  if (clickType === "upload-click" || clickType === "edit-upload-click") await runUploadClick(clickElement);
  if (clickType === "delete-upload-image" || clickType === "edit-delete-upload-image") await runDeleteUploadImage(clickElement);

  if (clickType === "category-filter-btn") await changeProductsFilterButton(clickElement);

  if (clickType === "add-to-cart") await runAddToCart(clickElement);
  if (clickType === "increase-quantity") await runIncreaseQuantity(clickElement);
  if (clickType === "decrease-quantity") await runDecreaseQuantity(clickElement);
  if (clickType === "remove-from-cart") await runRemoveFromCart(clickElement);

  if (clickType === "calculate-shipping") await runCalculateShipping(clickElement);

  if (clickType === "checkout-btn") window.location.href = "/checkout";
  if (clickType === "place-order") await runPlaceOrder();

  if (clickType === "new-product-submit") await runAddNewProduct();
  if (clickType === "edit-product-submit") await runEditProduct();
  if (clickType === "delete-product-submit") await runDeleteProduct();
};

export const keyHandler = async (e) => {
  if (e.key !== "Enter") return null;
  e.preventDefault();

  const keyElement = e.target;
  const keyId = keyElement.id;

  console.log("KEY HANDLER");
  console.log(keyId);

  if (keyId === "auth-pw-input") await runAuthSubmit();

  return true;
};

export const changeHandler = async (e) => {
  const changeElement = e.target;
  const changeId = changeElement.id;

  console.log("CHANGE HANDLER");
  console.dir(changeElement);
  console.log("CHANGE ID");
  console.log(changeId);

  //Upload / Edit pic
  if (changeId === "upload-pic-input" || changeId === "edit-upload-pic-input") {
    const pic = e.target.files[0];
    if (!pic) return null;

    const mode = changeId.includes("edit") ? "edit" : "add";
    const entityType = changeElement.entityType;
    await runUploadPic(pic, mode, entityType);
    return true;
  }

  //entity selector
  if (changeId === "entity-type-selector") await runEntityTypeChange(changeElement);

  //Product selector
  if (changeId === "product-selector") await changeAdminProductSelector(changeElement);
};

//modal
export const overlayClickHandler = async (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("visible");
  }
};

if (authElement) {
  authElement.addEventListener("click", clickHandler);
  authElement.addEventListener("keydown", keyHandler);
}

if (displayElement) {
  displayElement.addEventListener("click", clickHandler);
  displayElement.addEventListener("keydown", keyHandler);
}

if (adminElement) {
  adminElement.addEventListener("click", clickHandler);
  adminElement.addEventListener("keydown", keyHandler);
  adminElement.addEventListener("change", changeHandler);
  adminElement.addEventListener("click", overlayClickHandler);
}

if (productsElement) {
  productsElement.addEventListener("click", clickHandler);
  productsElement.addEventListener("keydown", keyHandler);
  productsElement.addEventListener("change", changeHandler);
}

if (cartElement) {
  cartElement.addEventListener("click", clickHandler);
}

if (checkoutElement) {
  checkoutElement.addEventListener("click", clickHandler);
}
