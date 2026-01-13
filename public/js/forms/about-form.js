// Build the about page
export const buildAboutForm = async () => {
    const aboutContainer = document.createElement("div");
    aboutContainer.id = "about-container";
    aboutContainer.className = "about-container";
  
    aboutContainer.innerHTML = "";
  
    const aboutContent = await buildAboutContent();
    aboutContainer.appendChild(aboutContent);
  
    return aboutContainer;
  };
  
  // Build the main content section
  export const buildAboutContent = async () => {
    const aboutContent = document.createElement("div");
    aboutContent.className = "about-content";
  
    const aboutImages = await buildAboutImages();
    const aboutText = await buildAboutText();
  
    aboutContent.append(aboutImages, aboutText);
  
    return aboutContent;
  };
  
  // Build the images section (left side)
  export const buildAboutImages = async () => {
    const aboutImages = document.createElement("div");
    aboutImages.className = "about-images";
  
    const rotatingTop = document.createElement("div");
    rotatingTop.className = "about-image-rotating";
    rotatingTop.id = "about-image-top";
  
    const rotatingMiddle = document.createElement("div");
    rotatingMiddle.className = "about-image-rotating";
    rotatingMiddle.id = "about-image-middle";
  
    const staticBottom = document.createElement("div");
    staticBottom.className = "about-image-static";
    staticBottom.id = "about-image-bottom";
  
    aboutImages.append(rotatingTop, rotatingMiddle, staticBottom);
  
    return aboutImages;
  };
  
  // Build the text section (right side)
  export const buildAboutText = async () => {
    const aboutText = document.createElement("div");
    aboutText.className = "about-text";
  
    const aboutTitle = await buildAboutTitle();
    const aboutParagraph1 = await buildAboutParagraph1();
    const aboutParagraph2 = await buildAboutParagraph2();
    const aboutParagraph3 = await buildAboutParagraph3();
  
    aboutText.append(aboutTitle, aboutParagraph1, aboutParagraph2, aboutParagraph3);
  
    return aboutText;
  };
  
  // Build title
  export const buildAboutTitle = async () => {
    const aboutTitle = document.createElement("h2");
    aboutTitle.className = "about-title";
    aboutTitle.textContent = "Meet the Artists";
  
    return aboutTitle;
  };
  
  // Build first paragraph
  export const buildAboutParagraph1 = async () => {
    const aboutParagraph = document.createElement("p");
    aboutParagraph.className = "about-paragraph";
    aboutParagraph.textContent =
      "We are passionate about creating beautiful fiber art pieces that bring joy and wonder to your home. Each creation is made with love and attention to detail.";
  
    return aboutParagraph;
  };
  
  // Build second paragraph
  export const buildAboutParagraph2 = async () => {
    const aboutParagraph = document.createElement("p");
    aboutParagraph.className = "about-paragraph";
    aboutParagraph.textContent =
      "Using only natural materials and sustainable practices, each piece is a testament to our commitment to quality and the environment. From gathering acorn caps to hand-felting each creation, we pour our hearts into every detail.";
  
    return aboutParagraph;
  };
  
  // Build third paragraph
  export const buildAboutParagraph3 = async () => {
    const aboutParagraph = document.createElement("p");
    aboutParagraph.className = "about-paragraph";
    aboutParagraph.textContent = "Thank you for supporting our small business and bringing our art into your life.";
  
    return aboutParagraph;
  };