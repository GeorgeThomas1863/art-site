// import { sendToBack } from "../util/api-front.js";

// Array of image URLs to rotate through
const mainPicArray = [
  "/images/background/acorn1.jpg",
  "/images/background/acorn2.jpg",
  "/images/background/mtb1.jpg",
  "/images/background/matted1.jpg",
  "/images/background/matted2.jpg",
];

const aboutPicArray = [
  "/images/background/mountains1.jpg",
  "/images/background/mountains2.jpg",
  "/images/background/mountains3.jpg",
  "/images/background/mountains4.jpg",
  "/images/background/beach1.jpg",
  "/images/background/beach2.jpg",
  "/images/background/beach3.jpg",
];

const aboutStaticPic = "/images/background/selfie1.jpg";

let mainIndexLeft = 0;
let mainIndexRight = 3; //start at different spot to avoid overlap

let aboutIndexTop = 0;
let aboutIndexBottom = 4;

// Append a crossfade overlay layer to a rotating element
const initCrossfadeLayer = (element) => {
  if (!element) return;
  const layer = document.createElement("div");
  layer.classList.add("image-crossfade-layer");
  element.appendChild(layer);
};

// Preload an image, returns a Promise that resolves with the URL
const preloadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(url);
    img.src = url;
  });

// Set background image with crossfade transition
export const setCurrentPic = async (element, picURL) => {
  if (!element) return;

  // First call (no layer yet — init was just called): just set directly
  const layer = element.querySelector(".image-crossfade-layer");
  if (!layer) {
    element.style.backgroundImage = `url('${picURL}')`;
    return;
  }

  try {
    await preloadImage(picURL);
  } catch {
    // Fallback on load error — set directly without crossfade
    element.style.backgroundImage = `url('${picURL}')`;
    return;
  }

  // Set image on the crossfade layer and fade it in
  layer.style.backgroundImage = `url('${picURL}')`;
  layer.style.opacity = "1";

  // After fade completes, promote to parent and reset layer instantly
  setTimeout(() => {
    element.style.backgroundImage = `url('${picURL}')`;
    layer.style.transition = "none";
    layer.style.opacity = "0";
    // Restore transition after the instant reset settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layer.style.transition = "";
      });
    });
  }, 850); // slightly longer than the 0.8s CSS transition
};

// Initialize image rotation
export const startMainPicRotation = async () => {
  const splitImageLeft = document.getElementById("split-image-left");
  const splitImageRight = document.getElementById("split-image-right");

  initCrossfadeLayer(splitImageLeft);
  initCrossfadeLayer(splitImageRight);

  // Set initial image
  await setCurrentPic(splitImageLeft, mainPicArray[mainIndexLeft]);
  await setCurrentPic(splitImageRight, mainPicArray[mainIndexRight]);

  // Rotate left image
  setInterval(async () => {
    mainIndexLeft++;
    if (mainIndexLeft >= mainPicArray.length) {
      mainIndexLeft = 0;
    }
    await setCurrentPic(splitImageLeft, mainPicArray[mainIndexLeft]);
  }, 5000);

  // Rotate right image (offset by 2.5 seconds for visual interest)
  setTimeout(() => {
    setInterval(async () => {
      mainIndexRight++;
      if (mainIndexRight >= mainPicArray.length) {
        mainIndexRight = 0;
      }
      await setCurrentPic(splitImageRight, mainPicArray[mainIndexRight]);
    }, 5000);
  }, 2500);
};

//+++++++++++++++++++++++++

export const startAboutPicRotation = async () => {
  const aboutImageTop = document.getElementById("about-image-top");
  const aboutImageBottom = document.getElementById("about-image-bottom");
  const aboutImageStatic = document.getElementById("about-image-static");
  const aboutImageMobile = document.getElementById("about-image-mobile");

  initCrossfadeLayer(aboutImageTop);
  initCrossfadeLayer(aboutImageBottom);
  initCrossfadeLayer(aboutImageMobile);
  // aboutImageStatic doesn't rotate — no crossfade layer needed

  // Set initial images
  await setCurrentPic(aboutImageTop, aboutPicArray[aboutIndexTop]);
  await setCurrentPic(aboutImageBottom, aboutPicArray[aboutIndexBottom]);
  await setCurrentPic(aboutImageStatic, aboutStaticPic);
  await setCurrentPic(aboutImageMobile, aboutPicArray[aboutIndexTop]);

  // Rotate top image (and mobile image in sync)
  setInterval(async () => {
    aboutIndexTop++;
    if (aboutIndexTop >= aboutPicArray.length) {
      aboutIndexTop = 0;
    }
    await setCurrentPic(aboutImageTop, aboutPicArray[aboutIndexTop]);
    await setCurrentPic(aboutImageMobile, aboutPicArray[aboutIndexTop]);
  }, 5000);

  // Rotate middle image (offset by 2.5 seconds for visual interest)
  setTimeout(() => {
    setInterval(async () => {
      aboutIndexBottom++;
      if (aboutIndexBottom >= aboutPicArray.length) {
        aboutIndexBottom = 0;
      }
      await setCurrentPic(aboutImageBottom, aboutPicArray[aboutIndexBottom]);
    }, 5000);
  }, 2500);
};
