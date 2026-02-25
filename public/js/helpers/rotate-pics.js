import { sendToBack } from "../util/api-front.js";

// Fallback array of image URLs to rotate through
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

let aboutIndexTop = 0;
let aboutIndexBottom = 4;

// Append a crossfade overlay layer to a rotating element
const initCrossfadeLayer = (element) => {
  if (!element) return;
  const layer = document.createElement("div");
  layer.classList.add("image-crossfade-layer");
  element.appendChild(layer);
};

const RATIO_MISMATCH_THRESHOLD = 1.25;

// Preload an image, returns a Promise that resolves with the Image object
export const preloadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(url);
    img.src = url;
  });

export const needsContain = (img, element) => {
  if (!element.offsetWidth || !element.offsetHeight) return false;
  const imageRatio = img.naturalWidth / img.naturalHeight;
  const containerRatio = element.offsetWidth / element.offsetHeight;
  const mismatch = Math.max(imageRatio / containerRatio, containerRatio / imageRatio);
  return mismatch > RATIO_MISMATCH_THRESHOLD;
};

const applyContainMode = (element, enable) => {
  element.classList.toggle("bg-contain-mode", enable);
};

// Set background image with crossfade transition
export const setCurrentPic = async (element, picURL, checkRatio = false) => {
  if (!element) return;

  // First call (no layer yet — init was just called): just set directly
  const layer = element.querySelector(".image-crossfade-layer");
  if (!layer) {
    element.style.backgroundImage = `url('${picURL}')`;
    return;
  }

  let loadedImg;
  try {
    loadedImg = await preloadImage(picURL);
  } catch {
    // Fallback on load error — set directly without crossfade
    element.style.backgroundImage = `url('${picURL}')`;
    return;
  }

  const isExtreme = checkRatio && needsContain(loadedImg, element);

  applyContainMode(layer, isExtreme);
  // Set image on the crossfade layer and fade it in
  layer.style.backgroundImage = `url('${picURL}')`;
  layer.style.opacity = "1";

  // After fade completes, promote to parent and reset layer instantly
  setTimeout(() => {
    element.style.backgroundImage = `url('${picURL}')`;
    applyContainMode(element, isExtreme);
    applyContainMode(layer, false);
    layer.style.transition = "none";
    layer.style.opacity = "0";
    // Restore transition after the instant reset settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layer.style.transition = "";
      });
    });
  }, 1600); // slightly longer than the 1.5s CSS transition
};

// Returns sorted/shuffled product image URL array, or null on failure/empty
const getProductImages = async () => {
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (!productData || !Array.isArray(productData) || productData.length === 0) return null;

  const filtered = [];
  for (let i = 0; i < productData.length; i++) {
    const p = productData[i];
    if (p.display === "no") continue;
    const pics = Array.isArray(p.picData) ? p.picData : (p.picData ? [p.picData] : []);
    if (!pics[0]?.filename) continue;
    filtered.push(p);
  }
  if (filtered.length === 0) return null;

  filtered.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  const rest = filtered.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = rest[i]; rest[i] = rest[j]; rest[j] = temp;
  }
  const sorted = [filtered[0], ...rest];
  const urls = [];
  for (let i = 0; i < sorted.length; i++) {
    const pics = Array.isArray(sorted[i].picData) ? sorted[i].picData : [sorted[i].picData];
    urls.push(`/images/products/${pics[0].filename}`);
  }
  return urls;
};

// Initialize image rotation
export const startMainPicRotation = async () => {
  const productImages = await getProductImages();
  const images = (productImages && productImages.length > 0) ? productImages : mainPicArray;

  const splitImageLeft = document.getElementById("split-image-left");
  const splitImageRight = document.getElementById("split-image-right");

  initCrossfadeLayer(splitImageLeft);
  initCrossfadeLayer(splitImageRight);

  let mainIndexLeft = 0;
  let mainIndexRight = Math.min(Math.floor(images.length / 2), images.length - 1);

  // Set initial image
  await setCurrentPic(splitImageLeft, images[mainIndexLeft], true);
  await setCurrentPic(splitImageRight, images[mainIndexRight], true);

  // Rotate left image
  setInterval(async () => {
    mainIndexLeft++;
    if (mainIndexLeft >= images.length) {
      mainIndexLeft = 0;
    }
    await setCurrentPic(splitImageLeft, images[mainIndexLeft], true);
  }, 5000);

  // Rotate right image (offset by 2.5 seconds for visual interest)
  setTimeout(() => {
    setInterval(async () => {
      mainIndexRight++;
      if (mainIndexRight >= images.length) {
        mainIndexRight = 0;
      }
      await setCurrentPic(splitImageRight, images[mainIndexRight], true);
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
