import { formatProductType, formatPrice } from "../helpers/products-run.js";
import { buildCollapseContainer } from "../util/collapse.js";
import { categoryDescriptions } from "../util/define-things.js";

// Build the entire products page
export const buildProductsForm = async () => {
  const productsContainer = document.createElement("div");
  productsContainer.className = "products-container";

  const pageHeader = await buildProductsPageHeader();
  const filterBar = await buildProductsFilterBar();
  const productsGrid = await buildProductsGrid();

  productsContainer.append(pageHeader, filterBar, productsGrid);

  return productsContainer;
};

// Build page header with title and subtitle
export const buildProductsPageHeader = async () => {
  const pageHeader = document.createElement("div");
  pageHeader.className = "products-page-header";

  const pageTitle = document.createElement("h1");
  pageTitle.className = "products-page-title";
  pageTitle.textContent = "Our Collection";

  const pageSubtitle = document.createElement("p");
  pageSubtitle.className = "products-page-subtitle";
  pageSubtitle.textContent = "Handcrafted with love and natural materials";

  pageHeader.append(pageTitle, pageSubtitle);

  return pageHeader;
};

// Build filter bar with category dropdown
export const buildProductsFilterBar = async () => {
  const filterBar = document.createElement("div");
  filterBar.className = "products-filter-bar";

  const filterButtons = document.createElement("div");
  filterButtons.className = "products-filter-buttons";

  const filterOptions = [
    { value: "all", text: "All Products", selected: true },
    { value: "acorns", text: "Acorns" },
    { value: "animals", text: "Animals" },
    { value: "geodes", text: "Geodes" },
    { value: "wallPieces", text: "Wall Pieces" },
    { value: "mountainTreasureBaskets", text: "Mountain Treasure Baskets" },
    { value: "other", text: "Other" },
  ];

  for (let i = 0; i < filterOptions.length; i++) {
    const optionData = filterOptions[i];
    const button = document.createElement("button");
    button.className = "products-filter-btn";
    button.setAttribute("data-label", "category-filter-btn");
    button.setAttribute("data-category", optionData.value);
    button.textContent = optionData.text;

    if (optionData.selected) {
      button.classList.add("active");
    }
    filterButtons.append(button);
  }

  // filterBar.append(filterLabel, filterButtons);
  filterBar.append(filterButtons);

  return filterBar;
};

//---------------------

export const buildCategoryDescription = async (category) => {
  const descriptionObj = categoryDescriptions[category];
  if (!descriptionObj || !descriptionObj.title || !descriptionObj.details) return null;

  const titleElement = document.createElement("h2");
  titleElement.innerHTML = `${descriptionObj.title}`;
  titleElement.className = "category-description-title";

  const contentElement = document.createElement("div");
  contentElement.innerHTML = descriptionObj.details;
  contentElement.className = "category-description-text";

  // Build collapse container
  const collapseContainer = await buildCollapseContainer({
    titleElement: titleElement,
    contentElement: contentElement,
    isExpanded: true, // Start expanded
    className: "category-description-container",
  });

  return collapseContainer;
};

//---------------------------------

// Build the products grid container
export const buildProductsGrid = async () => {
  const productsGrid = document.createElement("div");
  productsGrid.className = "products-grid";
  productsGrid.id = "products-grid";

  return productsGrid;
};

// Build individual product card
export const buildProductCard = async (productData) => {
  const productCard = document.createElement("div");
  productCard.className = "product-card";
  productCard.setAttribute("data-product-id", productData.productId);
  productCard.setAttribute("data-product-type", productData.productType);

  const productImage = await buildProductImage(productData);
  const productInfo = await buildProductInfo(productData);

  productCard.append(productImage, productInfo);

  return productCard;
};

// Internal helper — builds a carousel element for grid cards or the detail modal
const buildCarouselElement = (pics, altText, isCard) => {
  const carousel = document.createElement("div");
  carousel.className = "product-carousel";
  if (isCard) carousel.setAttribute("data-label", "product-card-click");

  const track = document.createElement("div");
  track.className = "carousel-track";

  for (let i = 0; i < pics.length; i++) {
    const slide = document.createElement("img");
    slide.className = "carousel-slide";
    if (isCard) slide.setAttribute("data-label", "product-card-click");
    slide.src = `/images/products/${pics[i].filename}`;
    slide.alt = altText;
    track.append(slide);
  }

  const prevBtn = document.createElement("button");
  prevBtn.className = "carousel-arrow carousel-arrow-prev";
  prevBtn.setAttribute("data-label", "carousel-prev");
  prevBtn.type = "button";
  prevBtn.innerHTML = "&#8249;";

  const nextBtn = document.createElement("button");
  nextBtn.className = "carousel-arrow carousel-arrow-next";
  nextBtn.setAttribute("data-label", "carousel-next");
  nextBtn.type = "button";
  nextBtn.innerHTML = "&#8250;";

  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";

  for (let i = 0; i < pics.length; i++) {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("data-label", "product-carousel-dot");
    dot.setAttribute("data-index", String(i));
    dot.type = "button";
    dotsContainer.append(dot);
  }

  carousel.append(track, prevBtn, nextBtn, dotsContainer);
  return carousel;
};

// Build product image element
export const buildProductImage = async (productData) => {
  const { picData } = productData;
  const pics = picData ? (Array.isArray(picData) ? picData : [picData]) : [];
  if (pics.length === 0) return null;

  if (pics.length === 1) {
    const productImage = document.createElement("img");
    productImage.className = "product-image";
    productImage.setAttribute("data-label", "product-card-click");
    productImage.alt = productData.name;
    productImage.src = `/images/products/${pics[0].filename}`;
    return productImage;
  }

  return buildCarouselElement(pics, productData.name, true);
};

// Build product info section (name, price, description, footer)
export const buildProductInfo = async (productData) => {
  const productInfo = document.createElement("div");
  productInfo.className = "product-info";

  const productHeader = await buildProductHeader(productData);
  const productName = await buildProductName(productData);
  const productPrice = await buildProductPrice(productData);
  const productDescription = await buildProductDescription(productData);
  const productType = await buildProductTypeBadge(productData);

  productInfo.append(productHeader, productName, productPrice, productDescription, productType);

  return productInfo;
};

export const buildProductHeader = async (productData) => {
  const productHeader = document.createElement("div");
  productHeader.className = "product-header";

  const addToCartBtn = await buildAddToCartButton(productData);

  productHeader.append(addToCartBtn);

  return productHeader;
};

export const buildAddToCartButton = async (productData) => {
  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "add-to-cart-btn";
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.productId = productData.productId;
  addToCartBtn.setAttribute("data-label", "add-to-cart");

  return addToCartBtn;
};

// Build product name
export const buildProductName = async (productData) => {
  const productName = document.createElement("h2");
  productName.className = "product-name";
  productName.setAttribute("data-label", "product-card-click");
  productName.textContent = productData.name;

  return productName;
};

// Build product price
export const buildProductPrice = async (productData) => {
  const productPrice = document.createElement("div");
  productPrice.className = "product-price";
  productPrice.setAttribute("data-label", "product-card-click");
  productPrice.textContent = formatPrice(productData.price);

  return productPrice;
};

// Build product description
export const buildProductDescription = async (productData) => {
  const productDescription = document.createElement("p");
  productDescription.className = "product-description";
  productDescription.setAttribute("data-label", "product-card-click");
  productDescription.textContent = productData.description;

  return productDescription;
};

// Build product type badge
export const buildProductTypeBadge = async (productData) => {
  const productType = document.createElement("span");
  productType.className = "product-type";
  productType.setAttribute("data-label", "product-card-click");

  // Convert camelCase to readable format
  const typeText = await formatProductType(productData.productType);
  productType.textContent = typeText;

  return productType;
};

//----------------------

// Build product detail modal
export const buildProductDetailModal = async (productData) => {
  const overlay = document.createElement("div");
  overlay.className = "product-detail-overlay";
  overlay.setAttribute("data-label", "close-product-modal");

  const wrapper = document.createElement("div");
  wrapper.className = "product-detail-wrapper";

  // Header with close button
  const header = document.createElement("div");
  header.className = "product-detail-header";

  const closeBtn = document.createElement("button");
  closeBtn.className = "product-detail-close";
  closeBtn.setAttribute("data-label", "close-product-modal");
  closeBtn.innerHTML = "&times;";
  header.append(closeBtn);

  // Body
  const body = document.createElement("div");
  body.className = "product-detail-body";

  // Images
  const pics = productData.picData ? (Array.isArray(productData.picData) ? productData.picData : [productData.picData]) : [];
  if (pics.length === 1) {
    const img = document.createElement("img");
    img.className = "product-detail-image";
    img.src = `/images/products/${pics[0].filename}`;
    img.alt = productData.name;
    body.append(img);
  } else if (pics.length > 1) {
    const carousel = buildCarouselElement(pics, productData.name, false);
    body.append(carousel);
  }

  // Info section
  const info = document.createElement("div");
  info.className = "product-detail-info";

  const name = document.createElement("h2");
  name.className = "product-detail-name";
  name.textContent = productData.name;

  const price = document.createElement("div");
  price.className = "product-detail-price";
  price.textContent = formatPrice(productData.price);

  const description = document.createElement("p");
  description.className = "product-detail-description";
  description.textContent = productData.description;

  const typeText = await formatProductType(productData.productType);
  const typeBadge = document.createElement("span");
  typeBadge.className = "product-detail-type";
  typeBadge.textContent = typeText;

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "add-to-cart-btn product-detail-cart-btn";
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.productId = productData.productId;
  addToCartBtn.setAttribute("data-label", "add-to-cart");

  info.append(name, price, description, typeBadge, addToCartBtn);
  body.append(info);

  wrapper.append(header, body);
  overlay.append(wrapper);

  return overlay;
};
