import { sendToBack } from "./util/api-front.js";

import { buildMainForm, buildNavBar } from "./forms/main-form.js";
import { buildProductsForm } from "./forms/products-form.js";
import { buildCartForm } from "./forms/cart-form.js";
import { buildCheckoutForm } from "./forms/checkout-form.js";
import { buildConfirmOrderForm } from "./forms/confirm-form.js";

import { populateProducts } from "./helpers/products-run.js";
import { populateCart, updateNavbarCart } from "./helpers/cart-run.js";
import { populateCheckout, populateConfirmOrder } from "./helpers/buy-run.js";
import { startPicRotation } from "./helpers/rotate-pics.js";

const displayElement = document.getElementById("display-element");
const productsElement = document.getElementById("products-element");
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

  await startPicRotation();
  await updateNavbarCart();

  return true;
};

export const buildProductsDisplay = async () => {
  if (!productsElement) return null;

  const navElement = await buildNavBar();
  const productForm = await buildProductsForm();
  productsElement.append(navElement, productForm);

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  console.log("PRODUCT DATA");
  console.dir(productData);
  await populateProducts(productData);
  await updateNavbarCart();

  return true;
};

export const buildCartDisplay = async () => {
  if (!cartElement) return null;

  const navElement = await buildNavBar();
  const cartForm = await buildCartForm();
  cartElement.append(navElement, cartForm);

  await populateCart();

  return true;
};

export const buildCheckoutDisplay = async () => {
  if (!checkoutElement) return null;

  const navElement = await buildNavBar();
  const checkoutForm = await buildCheckoutForm();
  checkoutElement.append(navElement, checkoutForm);

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
if (productsElement) buildProductsDisplay();
if (cartElement) buildCartDisplay();
if (checkoutElement) buildCheckoutDisplay();
if (confirmElement) buildConfirmOrderDisplay();

//DESCRIPTIONS TO ADD

// const descriptions = {
//   acorns: `The acorn ornaments are created using acorn caps from the Bur Oak tree. The Bur Oak produces the largest acorns in North America. These trees can be found in many states and are very adaptable to soil and weather conditions. They are very hardy and live for centuries.  Bur Oak trees provide food and shelter to many species of wildlife.
// We are always on the search for other types of acorn caps which we use for our smaller felted acorns, jewelry, and other creations.
// We have wonderful customers, family and friends who also gather acorn caps for us, it does take a village and we are so grateful to be a part of it.
// `,
//   mtbs: `The creation of the baskets starts with the wet felting process. They are then hand stitched creating their shape. The baskets are then embellished with antique and vintage beads, antique focal pieces, driftwood and selected botanicals.
// We then pair each one with an inspirational quote to complete these wonderful one of a kind baskets.`,

//   animals: `Funky Fun Animals!
// These whimsical creatures are designed to bring joy to all who see them.
// The animals are created with natural fleece, wool roving, wool locks and twists along with other embelishments.
// `,
//   geodes: `Stones with a secret!!!
//  Revered by many as a connection with the earths energy. Representing strength, hidden potential, and positive energy flow.
// We create our geodes with both wet felting and dry needle felting. Our geodes emerge from multiple layers created by these two methods. Once the exterior is complete the interior beauty emerges by using crystals carefully placed and enhanced with complimentary gemstones, vintage beads and more.
// `,

//   snails: `Our Snails are funky, fun, and created to bring smiles!
// In reality snails are very important little creatures, critical to bio diversity , and indicators of environmental health.
// Snails have a secret weapon, their mucus. They can move over 150 times their weight  and walk over razor blades without getting cut. A pretty powerful critter
// They are inspirational; representing steady growth, progress, prosperity, good luck, resilience and transformation.
// We hope you enjoy our wonderful snails!
// `,
//   wallPieces: `Matted original art
// For those who like to use their frames we have available 5 by 7 inch needle felted scenes. These are matted to 8 by 10 inches.
// These one of a kind scenes are created using wool, sari silk, throwsters waste, and other assorted fibers.
// `,
// };
