import { buildMainForm } from "./forms/main-form.js";
import { buildProductsForm } from "./forms/products-form.js";
import { sendToBackGET } from "./util/api-front.js";
import { populateProductsGrid } from "./helpers/products-run.js";

const displayElement = document.getElementById("display-element");
const productsElement = document.getElementById("products-element");

export const buildMainDisplay = async () => {
  if (!displayElement) return null;
  //   const { isFirstLoad } = stateFront;

  const data = await buildMainForm(inputArray);
  displayElement.append(data);

  return true;
};

export const buildProductsDisplay = async () => {
  if (!productsElement) return null;

  const productForm = await buildProductsForm();
  const productData = await sendToBackGET({ route: "/get-product-data-route" });

  await populateProductsGrid(productData);

  productsElement.append(productForm);
  return true;
};

if (displayElement) buildMainDisplay();
if (productsElement) buildProductsDisplay();
