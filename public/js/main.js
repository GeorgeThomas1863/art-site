import { buildMainForm, buildNavBar } from "./forms/main-form.js";
import { buildProductsForm } from "./forms/products-form.js";
import { sendToBackGET } from "./util/api-front.js";
import { populateProductsGrid } from "./helpers/products-run.js";

const displayElement = document.getElementById("display-element");
const productsElement = document.getElementById("products-element");

export const buildMainDisplay = async () => {
  if (!displayElement) return null;
  //   const { isFirstLoad } = stateFront;

  const data = await buildMainForm();

  console.log("BUILD MAIN DISPLAY");
  console.log(data);
  displayElement.append(data);

  return true;
};

export const buildProductsDisplay = async () => {
  if (!productsElement) return null;

  const navElement = await buildNavBar();
  const productForm = await buildProductsForm();
  productsElement.append(navElement, productForm);

  const productData = await sendToBackGET({ route: "/get-product-data-route" });
  console.log("PRODUCT DATA");
  console.dir(productData);
  await populateProductsGrid(productData);

  return true;
};

if (displayElement) buildMainDisplay();
if (productsElement) buildProductsDisplay();
