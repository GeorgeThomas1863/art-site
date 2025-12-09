// Main function to build and render the photography site
export const buildMainForm = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const mainContainer = document.createElement("div");
  mainContainer.id = "main-container";

  // Clear the container
  mainContainer.innerHTML = "";

  // Create navigation
  const navElement = await buildNavBar();
  mainContainer.append(navElement);

  return mainContainer;
};

// Create navigation bar
export const buildNavBar = async () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const navContainer = document.createElement("div");
  navContainer.className = "nav-container";

  const logo = document.createElement("div");
  logo.className = "logo";
  logo.textContent = "Two Sisters Fiber Art";

  const ul = document.createElement("ul");
  ul.className = "nav-links";

  const navItems = [
    { text: "Welcome", href: "#index" },
    { text: "All Products", href: "#products" },
    { text: "About", href: "#about" },
    { text: "Events", href: "#events" },
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
// export const createFeaturedProduct = async (pic) => {
//   const grid = document.createElement("div");
//   grid.className = "featured-grid";

//   const img = document.createElement("img");
//   img.src = pic.url;
//   img.alt = pic.title;
//   img.className = "featured-image";

//   const info = document.createElement("div");
//   info.className = "featured-info";

//   const label = document.createElement("div");
//   label.className = "featured-label";
//   label.textContent = "FEATURED WORK";

//   const title = document.createElement("h1");
//   title.className = "featured-title";
//   title.textContent = pic.title;

//   const description = document.createElement("p");
//   description.className = "featured-description";
//   description.textContent = pic.description;

//   const price = document.createElement("div");
//   price.className = "featured-price";
//   price.textContent = pic.price;

//   const button = document.createElement("button");
//   button.className = "featured-button";
//   button.textContent = "PURCHASE PRINT";

//   info.append(label, title, description, price, button);

//   grid.appendChild(img);
//   grid.appendChild(info);

//   return grid;
// };

// // Create individual product item for grid
// export const createProductItem = async (pic) => {
//   const item = document.createElement("div");
//   item.className = "product-item";

//   const img = document.createElement("img");
//   img.src = pic.url;
//   img.alt = pic.title;
//   img.className = "product-image";

//   const name = document.createElement("div");
//   name.className = "product-name";
//   name.textContent = pic.title;

//   const price = document.createElement("div");
//   price.className = "product-price";
//   price.textContent = pic.price;

//   item.append(img, name, price);

//   return item;
// };

//--------------------------------------

// const featuredSection = document.createElement("div");
// featuredSection.className = "featured";

// // Create featured product display
// const featuredContainer = document.createElement("div");
// featuredContainer.id = "featured-container";
// const featuredGrid = await createFeaturedProduct(inputArray[0]);
// featuredContainer.appendChild(featuredGrid);

// // Create more products section
// const moreProducts = document.createElement("div");
// moreProducts.className = "more-products";

// const sectionTitle = document.createElement("h2");
// sectionTitle.className = "section-title";
// sectionTitle.textContent = "MORE FROM THE COLLECTION";

// const productsGrid = document.createElement("div");
// productsGrid.className = "products-grid";
// productsGrid.id = "products-grid";

// // Add remaining products to grid
// for (let i = 1; i < inputArray.length; i++) {
//   const productItem = await createProductItem(inputArray[i]);
//   productsGrid.appendChild(productItem);
// }

// moreProducts.appendChild(sectionTitle);
// moreProducts.appendChild(productsGrid);

// featuredSection.appendChild(featuredContainer);
// featuredSection.appendChild(moreProducts);

// homeContainer.appendChild(featuredSection);
// return homeContainer;
