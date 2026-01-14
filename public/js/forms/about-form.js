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

  const aboutLeft = await buildAboutLeft();
  const aboutRight = await buildAboutRight();

  // const aboutText = await buildAboutText();
  // const rotatingRight = await buildRotatingRight();
  // const rotatingLeft = await buildRotatingLeft();
  // const staticBottom = await buildStaticBottom();

  aboutContent.append(aboutLeft, aboutRight);

  return aboutContent;
};

export const buildAboutLeft = async () => {
  const aboutLeft = document.createElement("div");
  aboutLeft.className = "about-left";

  const aboutText = await buildAboutText();
  const staticBottom = await buildStaticBottom();

  aboutLeft.append(aboutText, staticBottom);

  return aboutLeft;
};

export const buildAboutRight = async () => {
  const aboutRight = document.createElement("div");
  aboutRight.className = "about-right";

  const rotatingTop = document.createElement("div");
  rotatingTop.className = "about-image-rotating";
  rotatingTop.id = "about-image-top";

  const rotatingBottom = document.createElement("div");
  rotatingBottom.className = "about-image-rotating";
  rotatingBottom.id = "about-image-bottom";

  aboutRight.append(rotatingTop, rotatingBottom);

  return aboutRight;
};

export const buildStaticBottom = async () => {
  const staticBottom = document.createElement("div");
  staticBottom.className = "about-image-static";
  staticBottom.id = "about-image-static";

  return staticBottom;
};

// Build the text section (right side)
export const buildAboutText = async () => {
  const aboutText = document.createElement("div");
  aboutText.className = "about-text";

  const aboutTitle = await buildAboutTitle();
  const aboutParagraph = await buildAboutParagraph();

  aboutText.append(aboutTitle, aboutParagraph);

  return aboutText;
};

// Build title
export const buildAboutTitle = async () => {
  const aboutTitle = document.createElement("h2");
  aboutTitle.className = "about-title";
  aboutTitle.textContent = "The story of Two Sisters Fiber Art and what we do.";

  return aboutTitle;
};

export const buildAboutParagraph = async () => {
  const aboutParagraph = document.createElement("p");
  aboutParagraph.className = "about-paragraph";
  aboutParagraph.innerHTML = `From the waters of Lake Michigan to the mountains of North Carolina a synergy is created which is the heart of Two Sisters Fiber Art.<br><br>

We are two sisters living miles apart yet connected to each other in our art. Our main media is wool, a diverse natural fiber which lends itself to be worked into sculptures, or paintings. We like to say we paint with wool!<br><br>

We incorporate other types of fiber into our work along with found botanicals, carved and glass beads to enhance our work.<br><br>

The technique we primarily use is called needle felting. A tiny barbed needle is used to secure the loose wool onto itself or into a base material.<br><br>

We do a lot of gathering and hunting always searching for that unique item to enhance our art. You can find us at shorelines, forests, junk shops and antique shops!<br><br>

Thank you for visiting our site. We hope our art brings you joy.
`;

  return aboutParagraph;
};

// export const buildRotatingRight = async () => {
//   const rotatingRight = document.createElement("div");
//   rotatingRight.className = "about-image-rotating";
//   rotatingRight.id = "about-image-right";

//   return rotatingRight;
// };

// export const buildRotatingLeft = async () => {
//   const rotatingLeft = document.createElement("div");
//   rotatingLeft.className = "about-image-rotating";
//   rotatingLeft.id = "about-image-left";

//   return rotatingLeft;
// };
