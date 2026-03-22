import { buildProductCard, buildCategoryDescription, buildProductDetailModal } from "../forms/products-form.js";
import { needsContain } from "./rotate-pics.js";

//store locally for filtering
let productsArray = [];

// Populate the products grid with product cards
export const populateProducts = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  productsArray = inputArray;

  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  // Clear existing products
  productsGrid.innerHTML = "";

  // Build all product cards in parallel
  const cardPromises = [];
  for (let i = 0; i < inputArray.length; i++) {
    cardPromises.push(buildProductCard(inputArray[i]));
  }
  const cards = await Promise.all(cardPromises);
  for (let i = 0; i < cards.length; i++) {
    productsGrid.append(cards[i]);
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

export const formatPrice = (price) => {
  const num = parseFloat(price);
  return num % 1 === 0 ? `$${num}` : `$${num.toFixed(2)}`;
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

export const changeProductsFilterButton = async (clickElement) => {
  if (!clickElement) return null;

  const categoryFilter = clickElement.getAttribute("data-category");
  // console.log("FILTERING BY CATEGORY:");
  // console.log(categoryFilter);

  // Update active button state
  const allFilterButtons = document.querySelectorAll(".products-filter-btn");
  for (let i = 0; i < allFilterButtons.length; i++) {
    allFilterButtons[i].classList.remove("active");
  }
  clickElement.classList.add("active");

  const filteredArray = await filterProducts(productsArray, categoryFilter);

  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  productsGrid.innerHTML = "";

  // Build all filtered product cards in parallel
  const cardPromises = [];
  for (let i = 0; i < filteredArray.length; i++) {
    cardPromises.push(buildProductCard(filteredArray[i]));
  }
  const cards = await Promise.all(cardPromises);
  for (let i = 0; i < cards.length; i++) {
    productsGrid.append(cards[i]);
  }

  await updateCategoryDescription(categoryFilter);

  return true;
};

export const updateCategoryDescription = async (category) => {
  // Remove existing description if present
  const existingDescription = document.querySelector(".category-description-container");
  if (existingDescription) existingDescription.remove();

  // Build new description for this category
  const newDescription = await buildCategoryDescription(category);
  if (!newDescription) return null;

  const filterBar = document.querySelector(".products-filter-bar");
  if (filterBar) filterBar.insertAdjacentElement("afterend", newDescription);

  return true;
};

// Internal: build and show modal for a given product object
const openModalForProduct = async (productData, startIndex = 0) => {
  const modal = await buildProductDetailModal(productData, startIndex);
  const productsElement = document.getElementById("products-element");
  productsElement.append(modal);

  // Apply contain mode after image loads naturally — non-blocking
  const imgEl = modal.querySelector(".product-detail-image");
  if (imgEl) {
    imgEl.addEventListener('load', () => {
      const container = { offsetWidth: Math.min(window.innerWidth - 64, 700), offsetHeight: 500 };
      if (needsContain(imgEl, container)) imgEl.classList.add("contain-mode");
    }, { once: true });
  }

  // Trigger reflow then add visible class for animation
  requestAnimationFrame(() => {
    modal.classList.add("visible");
    if (productData.urlName) history.pushState(null, '', '/products/' + productData.urlName);
  });
};

// Open product detail modal
export const openProductDetailModal = async (clickElement) => {
  const card = clickElement.closest(".product-card");
  if (!card) return null;

  const productId = card.getAttribute("data-product-id");
  const productData = productsArray.find((p) => String(p.productId) === String(productId));
  if (!productData) return null;

  const cardCarousel = card.querySelector(".product-carousel");
  const startIndex = cardCarousel ? getActiveIndex(cardCarousel) : 0;

  await openModalForProduct(productData, startIndex);
};

// Open product detail modal by URL slug (for deep-link support)
export const openProductDetailModalBySlug = async (slug) => {
  let product = null;
  for (let i = 0; i < productsArray.length; i++) {
    if (productsArray[i].urlName === slug) {
      product = productsArray[i];
      break;
    }
  }
  if (!product) return;
  await openModalForProduct(product, 0);
};

// Close product detail modal
export const closeProductDetailModal = async (updateHistory = true) => {
  const modal = document.querySelector(".product-detail-overlay");
  if (modal) modal.remove();
  if (updateHistory) history.replaceState(null, '', '/products');
};

const goToSlide = (carousel, index) => {
  const track = carousel.querySelector(".carousel-track");
  const dots = carousel.querySelectorAll(".carousel-dot");
  if (track) track.style.transform = `translateX(-${index * 100}%)`;
  for (let i = 0; i < dots.length; i++) dots[i].classList.remove("active");
  if (dots[index]) dots[index].classList.add("active");
};

const getActiveIndex = (carousel) => {
  const dot = carousel.querySelector(".carousel-dot.active");
  return dot ? parseInt(dot.getAttribute("data-index")) : 0;
};

export const runProductCarouselDot = async (dot) => {
  const carousel = dot.closest(".product-carousel");
  if (!carousel) return null;
  goToSlide(carousel, parseInt(dot.getAttribute("data-index")));
};

export const advanceCarousel = (carousel, direction) => {
  const total = carousel.querySelectorAll(".carousel-dot").length;
  if (total <= 1) return;
  const current = getActiveIndex(carousel);
  if (direction === "next" && current === total - 1) return;
  if (direction === "prev" && current === 0) return;
  const next = direction === "next" ? current + 1 : current - 1;
  goToSlide(carousel, next);
};

export const runCarouselPrev = async (btn) => {
  const carousel = btn.closest(".product-carousel");
  if (carousel) advanceCarousel(carousel, "prev");
};

export const runCarouselNext = async (btn) => {
  const carousel = btn.closest(".product-carousel");
  if (carousel) advanceCarousel(carousel, "next");
};
