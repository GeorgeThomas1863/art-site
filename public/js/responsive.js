import { runTabClick, runUploadClick, runUploadPic, runAddNewProduct, runEditProduct, runDeleteProduct, changeAdminProductSelector } from "./helpers/admin-run.js"; //prettier-ignore
import { changeProductsFilter } from "./helpers/products-run.js";
import { runAddToCart } from "./helpers/cart-run.js";
import { runAuthSubmit, runPwToggle } from "./auth.js";
import { closePopup, closeConfirmDialog } from "./helpers/popup.js";

const authElement = document.getElementById("auth-element");
const displayElement = document.getElementById("display-element");
const adminElement = document.getElementById("admin-element");
const productsElement = document.getElementById("products-element");
const cartElement = document.getElementById("cart-element");

export const clickHandler = async (e) => {
  const clickElement = e.target;
  const clickId = clickElement.id;
  const clickType = clickElement.getAttribute("data-label");
  const tabType = clickElement.getAttribute("data-tab");

  console.log("CLICK HANDLER");
  console.log(clickId);
  console.log("CLICK TYPE");
  console.log(clickType);

  if (clickType === "auth-submit") await runAuthSubmit();
  if (clickType === "pwToggle") await runPwToggle();
  if (clickType === "popup-close") await closePopup();
  if (clickType === "confirm-yes") await closeConfirmDialog(true);
  if (clickType === "confirm-no") await closeConfirmDialog(false);

  if (tabType) await runTabClick(clickElement);
  if (clickType === "upload-click" || clickType === "edit-upload-click") await runUploadClick(clickElement);

  if (clickType === "add-to-cart") await runAddToCart(clickElement);

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
    await runUploadPic(pic, mode);
    return true;
  }

  //Product selector
  if (changeId === "product-selector") await changeAdminProductSelector(changeElement);

  if (changeId === "category-filter") await changeProductsFilter(changeElement);
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
}

if (productsElement) {
  productsElement.addEventListener("click", clickHandler);
  productsElement.addEventListener("keydown", keyHandler);
  productsElement.addEventListener("change", changeHandler);
}

if (cartElement) {
  cartElement.addEventListener("click", clickHandler);
  // cartElement.addEventListener("keydown", keyHandler);
}