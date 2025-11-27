// Main function to build and render the photography site
export const buildHomeForm = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const homeContainer = document.createElement("div");
  homeContainer.id = "home-container";

  // Clear the container
  homeContainer.innerHTML = "";

  // Create navigation
  const nav = createNavigation();
  homeContainer.appendChild(nav);

  // Create featured section container
  const featuredSection = document.createElement("div");
  featuredSection.className = "featured";

  // Create featured product display
  const featuredContainer = document.createElement("div");
  featuredContainer.id = "featured-container";
  const featuredGrid = createFeaturedProduct(inputArray[0]);
  featuredContainer.appendChild(featuredGrid);

  // Create more products section
  const moreProducts = document.createElement("div");
  moreProducts.className = "more-products";

  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "MORE FROM THE COLLECTION";

  const productsGrid = document.createElement("div");
  productsGrid.className = "products-grid";
  productsGrid.id = "products-grid";

  // Add remaining products to grid
  for (let i = 1; i < inputArray.length; i++) {
    const productItem = createProductItem(inputArray[i]);
    productsGrid.appendChild(productItem);
  }

  moreProducts.appendChild(sectionTitle);
  moreProducts.appendChild(productsGrid);

  featuredSection.appendChild(featuredContainer);
  featuredSection.appendChild(moreProducts);

  homeContainer.appendChild(featuredSection);
};

// Create navigation bar
export const createNavigation = async () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const navContainer = document.createElement("div");
  navContainer.className = "nav-container";

  const logo = document.createElement("div");
  logo.className = "logo";
  logo.textContent = "APERTURE";

  const ul = document.createElement("ul");
  ul.className = "nav-links";

  const navItems = [
    { text: "HOME", href: "#home" },
    { text: "COLLECTION", href: "#collection" },
    { text: "PRINTS", href: "#prints" },
    { text: "ABOUT", href: "#about" },
    { text: "CONTACT", href: "#contact" },
  ];

  for (let i = 0; i < navItems.length; i++) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = navItems[i].href;
    a.textContent = navItems[i].text;
    li.appendChild(a);
    ul.appendChild(li);
  }

  navContainer.appendChild(logo);
  navContainer.appendChild(ul);
  nav.appendChild(navContainer);

  return nav;
};

// Create featured product section
export const createFeaturedProduct = async (pic) => {
  const grid = document.createElement("div");
  grid.className = "featured-grid";

  const img = document.createElement("img");
  img.src = pic.url;
  img.alt = pic.title;
  img.className = "featured-image";

  const info = document.createElement("div");
  info.className = "featured-info";

  const label = document.createElement("div");
  label.className = "featured-label";
  label.textContent = "FEATURED WORK";

  const title = document.createElement("h1");
  title.className = "featured-title";
  title.textContent = pic.title;

  const description = document.createElement("p");
  description.className = "featured-description";
  description.textContent = pic.description;

  const price = document.createElement("div");
  price.className = "featured-price";
  price.textContent = pic.price;

  const button = document.createElement("button");
  button.className = "featured-button";
  button.textContent = "PURCHASE PRINT";
  // button.addEventListener("click", function () {
  //   handlePurchase(pic.title);
  // });

  // info.appendChild(label);
  // info.appendChild(title);
  // info.appendChild(description);
  // info.appendChild(price);
  // info.appendChild(button);

  info.append(label, title, description, price, button);

  grid.appendChild(img);
  grid.appendChild(info);

  return grid;
};

// Create individual product item for grid
export const createProductItem = async (pic) => {
  const item = document.createElement("div");
  item.className = "product-item";

  const img = document.createElement("img");
  img.src = pic.url;
  img.alt = pic.title;
  img.className = "product-image";

  const name = document.createElement("div");
  name.className = "product-name";
  name.textContent = pic.title;

  const price = document.createElement("div");
  price.className = "product-price";
  price.textContent = pic.price;

  // item.addEventListener("click", function () {
  //   handleProductClick(pic.title);
  // // });

  // item.appendChild(img);
  // item.appendChild(name);
  // item.appendChild(price);

  item.append(img, name, price);

  return item;
};

// Handle purchase button click
// function handlePurchase(productTitle) {
//   alert('Purchasing "' + productTitle + '"');
//   // You can replace this with your actual purchase logic
// }

// // Handle product item click
// function handleProductClick(productTitle) {
//   alert('Viewing "' + productTitle + '"');
//   // You can replace this with your actual product view logic
// }

// Sample data - replace this with your actual data from backend
// const samplePhotos = [
//   {
//     url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
//     title: "Alpine Solitude",
//     price: "$425",
//     description:
//       "Captured at dawn in the Swiss Alps, this piece embodies the quiet magnificence of untouched wilderness. Museum-quality archival print on fine art paper.",
//   },
//   {
//     url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
//     title: "Emerald Path",
//     price: "$350",
//     description: "Limited edition print, 20x30 inches",
//   },
//   {
//     url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
//     title: "Prairie Light",
//     price: "$375",
//     description: "Limited edition print, 30x40 inches",
//   },
//   {
//     url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
//     title: "Horizon",
//     price: "$325",
//     description: "Limited edition print, 24x36 inches",
//   },
//   {
//     url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
//     title: "Dunes",
//     price: "$400",
//     description: "Limited edition print, 24x36 inches",
//   },
// ];

// Initialize the site when DOM is ready
// document.addEventListener("DOMContentLoaded", function () {
//   const displayElement = document.getElementById("app");
//   if (displayElement) {
//     buildPhotographySite(displayElement, samplePhotos);
//   }
// });
