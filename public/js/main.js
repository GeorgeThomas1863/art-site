import { sendToBack } from "./util/api-front.js";

import { buildMainForm, buildNavBar } from "./forms/main-form.js";
import { buildAdminForm } from "./forms/admin-form.js";
import { buildProductsForm } from "./forms/products-form.js";
import { buildAboutForm } from "./forms/about-form.js";
import { buildEventsForm } from "./forms/events-form.js";
import { buildContactForm } from "./forms/contact-form.js";
import { buildCartForm } from "./forms/cart-form.js";
import { buildCheckoutForm } from "./forms/checkout-form.js";
import { buildConfirmOrderForm } from "./forms/confirm-form.js";

import { updateAdminStats } from "./helpers/admin-run.js";
import { populateProducts, updateCategoryDescription } from "./helpers/products-run.js";
import { populateEvents } from "./helpers/events-run.js";
import { populateCart, updateNavbarCart } from "./helpers/cart-run.js";
import { populateCheckout, populateConfirmOrder } from "./helpers/buy-run.js";
import { startMainPicRotation, startAboutPicRotation } from "./helpers/rotate-pics.js";

const displayElement = document.getElementById("display-element");
const adminElement = document.getElementById("admin-element");
const productsElement = document.getElementById("products-element");
const aboutElement = document.getElementById("about-element");
const eventsElement = document.getElementById("events-element");
const contactElement = document.getElementById("contact-element");
const cartElement = document.getElementById("cart-element");
const checkoutElement = document.getElementById("checkout-element");
const confirmElement = document.getElementById("confirm-element");

export const buildMainDisplay = async () => {
  if (!displayElement) return null;
  //   const { isFirstLoad } = stateFront;

  const data = await buildMainForm();

  console.log("BUILD MAIN DISPLAY");
  console.log(data);
  displayElement.append(data);
  await updateNavbarCart();

  await startMainPicRotation();

  return true;
};

export const buildAdminDisplay = async () => {
  if (!adminElement) return null;

  const adminFormData = await buildAdminForm();
  adminElement.append(adminFormData);

  await updateAdminStats();

  return true;
};

export const buildProductsDisplay = async () => {
  if (!productsElement) return null;

  const navElement = await buildNavBar();
  const productForm = await buildProductsForm();
  productsElement.append(navElement, productForm);

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");

  // console.log("PRODUCT DATA");
  // console.dir(productData);

  await updateNavbarCart();
  await populateProducts(productData);

  await updateCategoryDescription("all");

  return true;
};

export const buildAboutDisplay = async () => {
  if (!aboutElement) return null;

  const navElement = await buildNavBar();
  const aboutForm = await buildAboutForm();
  aboutElement.append(navElement, aboutForm);

  await updateNavbarCart();
  await startAboutPicRotation();

  return true;
};

export const buildEventsDisplay = async () => {
  if (!eventsElement) return null;

  const navElement = await buildNavBar();
  const eventsForm = await buildEventsForm();
  eventsElement.append(navElement, eventsForm);

  // Fetch event data from backend
  const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
  // console.log("EVENT DATA");
  // console.dir(eventData);

  await updateNavbarCart();
  await populateEvents(eventData);

  return true;
};

export const buildContactDisplay = async () => {
  if (!contactElement) return null;

  const navElement = await buildNavBar();
  const contactForm = await buildContactForm();
  contactElement.append(navElement, contactForm);

  await updateNavbarCart();

  return true;
};

export const buildCartDisplay = async () => {
  if (!cartElement) return null;

  const navElement = await buildNavBar();
  const cartForm = await buildCartForm();
  cartElement.append(navElement, cartForm);

  await updateNavbarCart();
  await populateCart();

  return true;
};

export const buildCheckoutDisplay = async () => {
  if (!checkoutElement) return null;

  const navElement = await buildNavBar();
  const checkoutForm = await buildCheckoutForm();
  checkoutElement.append(navElement, checkoutForm);

  await updateNavbarCart();
  await populateCheckout();

  return true;
};

export const buildConfirmOrderDisplay = async () => {
  if (!confirmElement) return null;

  const navElement = await buildNavBar();
  const confirmOrderForm = await buildConfirmOrderForm();
  confirmElement.append(navElement, confirmOrderForm);

  await populateConfirmOrder();

  return true;
};

if (displayElement) buildMainDisplay();
if (adminElement) buildAdminDisplay();
if (productsElement) buildProductsDisplay();
if (aboutElement) buildAboutDisplay();
if (eventsElement) buildEventsDisplay();
if (contactElement) buildContactDisplay();
if (cartElement) buildCartDisplay();
if (checkoutElement) buildCheckoutDisplay();
if (confirmElement) buildConfirmOrderDisplay();
