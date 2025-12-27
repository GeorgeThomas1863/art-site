import { buildProductCard } from "../forms/products-form.js";
import { addToCart } from "./cart-run.js";

//store locally for filtering
let productsArray = [];

// Populate the products grid with product cards
export const populateProductsGrid = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  productsArray = inputArray;

  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  // Clear existing products
  productsGrid.innerHTML = "";

  // Build and append each product card
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const productCard = await buildProductCard(product);
    productsGrid.append(productCard);
  }
};

// Filter products by category
export const filterProducts = async (inputArray, category) => {
  if (category === "all") {
    return inputArray;
  }

  const filteredProducts = [];
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    if (product.productType === category) {
      filteredProducts.push(product);
    }
  }

  return filteredProducts;
};

// Helper function to format product type from camelCase to readable text
export const formatProductType = async (productType) => {
  if (!productType) return null;

  // Handle special cases
  const specialCases = {
    mountainTreasureBaskets: "Mountain Treasure Baskets",
    wallPieces: "Wall Pieces",
    gnomeHouses: "Gnome Houses",
  };

  if (specialCases[productType]) {
    return specialCases[productType];
  }

  // Default: capitalize first letter
  return productType.charAt(0).toUpperCase() + productType.slice(1);
};

//----------------------------

export const changeProductsFilter = async (changeElement) => {
  if (!changeElement) return null;

  // const selectedOption = changeElement.options[changeElement.selectedIndex];
  const categoryFilter = changeElement.value;
  console.log("FILTERING BY CATEGORY:");
  console.log(categoryFilter);

  const filteredArray = await filterProducts(productsArray, categoryFilter);

  // Repopulate the grid with filtered products
  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  // Clear existing products
  productsGrid.innerHTML = "";

  // Build and append each filtered product card
  for (let i = 0; i < filteredArray.length; i++) {
    const product = filteredArray[i];
    const productCard = await buildProductCard(product);
    productsGrid.append(productCard);
  }

  return true;
};

//----------

export const runAddToCart = async (productId) => {
  console.log("ADD TO CART CLICKED");
  console.log("Product ID:", productId);

  // Find product data from the DOM //UNFUCK THIS
  const productCard = document.querySelector(`[data-product-id="${productId}"]`);
  if (!productCard) {
    console.error("Product card not found");
    return null;
  }

  const name = productCard.querySelector(".product-name")?.textContent;
  const priceText = productCard.querySelector(".product-price")?.textContent;
  const price = priceText ? parseFloat(priceText.replace("$", "")) : 0;
  const image = productCard.querySelector(".product-image")?.src;

  const productData = {
    productId,
    name,
    price,
    image
  };

  await addToCart(productData);

  return true;
};
