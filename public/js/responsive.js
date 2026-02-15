import { runModalTrigger, runModalClose, runChangeStatusCard } from "./helpers/admin-run.js"; //prettier-ignore
import { runAddNewProduct, runEditProduct, runDeleteProduct, changeAdminProductSelector } from "./helpers/admin-products.js";
import { runAddNewEvent, runEditEvent, runDeleteEvent, changeAdminEventSelector } from "./helpers/admin-events.js";
import { runSendNewsletter, runAddSubscriber, runRemoveSubscriber } from "./helpers/admin-newsletter.js";
import { runUploadClick, runUploadPic, runDeleteUploadImage } from "./helpers/upload-pic.js";
import { changeProductsFilterButton, openProductDetailModal, closeProductDetailModal } from "./helpers/products-run.js";
import { sendContactForm } from "./helpers/contact-run.js";
import { runEventsNewsletterToggle, runEventsNewsletterSubmit } from "./helpers/events-run.js";
import { runAddToCart, runIncreaseQuantity, runDecreaseQuantity, runRemoveFromCart } from "./helpers/cart-run.js";
import { runPlaceOrder } from "./helpers/buy-run.js";
import { runCalculateShipping, runShippingOptionSelect, runCheckoutShippingOptionSelect, runCalculateShippingCheckout } from "./helpers/shipping-calc.js"; //prettier-ignore
import { runToggleAudio } from "./helpers/about-run.js";
import { runToggleMenu } from "./util/collapse.js";
import { runAuthSubmit, runPwToggle } from "./auth.js";
import { closePopup, closeConfirmDialog } from "./util/popup.js";
import debounce from "./util/debounce.js";

const authElement = document.getElementById("auth-element");
const displayElement = document.getElementById("display-element");
const adminElement = document.getElementById("admin-element");
const productsElement = document.getElementById("products-element");
const eventsElement = document.getElementById("events-element");
const contactElement = document.getElementById("contact-element");
const cartElement = document.getElementById("cart-element");
const aboutElement = document.getElementById("about-element");
const checkoutElement = document.getElementById("checkout-element");

export const clickHandler = async (e) => {
  const clickElement = e.target;
  const clickId = clickElement.id;
  const clickType = clickElement.getAttribute("data-label");
  // const tabType = clickElement.getAttribute("data-tab");

  console.log("CLICK HANDLER");
  console.log(clickId);
  console.log("CLICK TYPE");
  console.log(clickType);

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

  if (clickType === "product-card-click") await openProductDetailModal(clickElement);
  if (clickType === "close-product-modal") await closeProductDetailModal();

  if (clickType === "add-to-cart") {
    await runAddToCart(clickElement);
    if (clickElement.closest(".product-detail-overlay")) await closeProductDetailModal();
  }
  if (clickType === "increase-quantity") await runIncreaseQuantity(clickElement);
  if (clickType === "decrease-quantity") await runDecreaseQuantity(clickElement);
  if (clickType === "remove-from-cart") await runRemoveFromCart(clickElement);

  if (clickType === "calculate-shipping") await runCalculateShipping(clickElement);
  if (clickType === "shipping-option-select") await runShippingOptionSelect(clickElement);
  if (clickType === "checkout-shipping-option-select") await runCheckoutShippingOptionSelect(clickElement);

  if (clickType === "checkout-btn") window.location.href = "/checkout";
  if (clickType === "view-products-btn") window.location.href = "/products";
  if (clickType === "place-order") await runPlaceOrder();

  if (clickType === "events-newsletter-checkbox") await runEventsNewsletterToggle(clickElement);
  if (clickType === "events-newsletter-submit") await runEventsNewsletterSubmit();

  if (clickType === "toggle-audio") await runToggleAudio();

  if (clickType === "toggle-menu") await runToggleMenu();

  if (clickType === "contact-submit") await sendContactForm();

  if (clickType === "new-product-submit") await runAddNewProduct();
  if (clickType === "edit-product-submit") await runEditProduct();
  if (clickType === "delete-product-submit") await runDeleteProduct();

  if (clickType === "new-event-submit") await runAddNewEvent();
  if (clickType === "edit-event-submit") await runEditEvent();
  if (clickType === "delete-event-submit") await runDeleteEvent();

  if (clickType === "send-newsletter-submit") await runSendNewsletter();
  if (clickType === "add-subscriber-email") await runAddSubscriber();
  if (clickType === "remove-subscriber") await runRemoveSubscriber(clickElement);
};

export const keyHandler = async (e) => {
  if (e.key === "Escape") {
    await closeProductDetailModal();
    return;
  }

  if (e.key !== "Enter") return null;
  if (e.target.tagName === "TEXTAREA") return null; //textarea

  e.preventDefault();

  const keyElement = e.target;
  const keyId = keyElement.id;

  console.log("KEY HANDLER");
  console.log(keyId);

  if (keyId === "auth-pw-input") await runAuthSubmit();

  return true;
};

//FIX, standardize like others
export const changeHandler = async (e) => {
  const changeElement = e.target;
  const changeId = changeElement.id;
  const changeType = changeElement.getAttribute("data-label");

  console.log("CHANGE HANDLER");
  console.dir(changeElement);
  console.log("CHANGE ID");
  console.log(changeId);
  console.log("CHANGE TYPE");
  console.log(changeType);

  //Upload / Edit pic
  if (changeId === "upload-pic-input" || changeId === "edit-upload-pic-input") {
    const pic = e.target.files[0];
    if (!pic) return null;

    const mode = changeId.includes("edit") ? "edit" : "add";
    const entityType = changeElement.entityType;
    await runUploadPic(pic, mode, entityType);
    return true;
  }

  // Status select color change
  if (changeType === "display-card" || changeType === "sold-card" || changeType === "can-ship-card") await runChangeStatusCard(changeElement);

  //entity selector
  if (changeId === "entity-type-selector") await runEntityTypeChange(changeElement);

  //Product selector
  if (changeId === "product-selector") await changeAdminProductSelector(changeElement);

  if (changeId === "event-selector") await changeAdminEventSelector(changeElement);
};

const debouncedCheckoutZipShipping = debounce(runCalculateShippingCheckout);

export const inputHandler = async (e) => {
  const inputElement = e.target;
  const inputId = inputElement.id;

  console.log("INPUT HANDLER");
  console.log(inputId);

  // Debounced shipping calculation when typing in checkout zip field
  if (inputId === "zip") {
    await debouncedCheckoutZipShipping();
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
  // adminElement.addEventListener("click", overlayClickHandler);
}

if (productsElement) {
  productsElement.addEventListener("click", clickHandler);
  productsElement.addEventListener("keydown", keyHandler);
  productsElement.addEventListener("change", changeHandler);
}

if (eventsElement) {
  eventsElement.addEventListener("click", clickHandler);
}

if (contactElement) {
  contactElement.addEventListener("click", clickHandler);
  contactElement.addEventListener("keydown", keyHandler);
  contactElement.addEventListener("change", changeHandler);
}

if (aboutElement) {
  aboutElement.addEventListener("click", clickHandler);
}

if (cartElement) {
  cartElement.addEventListener("click", clickHandler);
}

if (checkoutElement) {
  checkoutElement.addEventListener("click", clickHandler);
  checkoutElement.addEventListener("input", inputHandler);
}
