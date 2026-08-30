import { sendToBack } from "../util/api-front.js";
import { buildProductRotationEntries } from "./product-rotation.js";

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
const MAIN_ROTATION_INTERVAL = 10000;
const RIGHT_ROTATION_DELAY = 5000;
const CROSSFADE_DURATION = 1600;
// Manual nav (arrow click / drag / swipe) pauses that panel's auto-rotation for this long; each
// manual interaction resets the pause, and normal-interval auto-rotation resumes once it elapses.
const MANUAL_INTERACTION_PAUSE = 30000;

let aboutIndexTop = 0;
let aboutIndexBottom = 4;
let mainRotationEntries = [];
const mainRotationStates = new Map();

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

// Set background image with crossfade transition (or an instant swap — see `instant`)
export const setCurrentPic = async (element, picURL, checkRatio = false, waitForTransition = false, instant = false) => {
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

  // Instant path (arrow-button clicks and swipes): swap straight in, no crossfade wait
  if (instant) {
    element.style.backgroundImage = `url('${picURL}')`;
    applyContainMode(element, isExtreme);
    applyContainMode(layer, false);
    layer.style.transition = "none";
    layer.style.opacity = "0";
    // Restore transition after the instant reset settles, so the layer is ready to fade for the next auto rotation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layer.style.transition = "";
      });
    });
    return;
  }

  applyContainMode(layer, isExtreme);
  // Set image on the crossfade layer and fade it in
  layer.style.backgroundImage = `url('${picURL}')`;
  layer.style.opacity = "1";

  // After fade completes, promote to parent and reset layer instantly
  const transitionPromise = new Promise((resolve) => setTimeout(() => {
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
    resolve();
  }, CROSSFADE_DURATION)); // slightly longer than the 1.5s CSS transition
  if (waitForTransition) await transitionPromise;
};

// Returns sorted/shuffled product rotation entries, or null on failure/empty
export const getProductRotationEntries = async () => {
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (!productData || !Array.isArray(productData) || productData.length === 0) return null;

  const filtered = [];
  for (let i = 0; i < productData.length; i++) {
    const p = productData[i];
    if (p.display === "no") continue;
    if (buildProductRotationEntries([p]).length === 0) continue;
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
  return buildProductRotationEntries(sorted);
};

// Initialize image rotation
export const startMainPicRotation = async () => {
  const productEntries = await getProductRotationEntries();
  mainRotationEntries = productEntries?.length ? productEntries : buildFallbackRotationEntries();

  const splitImageLeft = document.getElementById("split-image-left");
  const splitImageRight = document.getElementById("split-image-right");
  if (!splitImageLeft || !splitImageRight) return;

  initCrossfadeLayer(splitImageLeft);
  initCrossfadeLayer(splitImageRight);

  const leftState = buildMainRotationState(splitImageLeft, 0);
  const rightIndex = Math.min(Math.floor(mainRotationEntries.length / 2), mainRotationEntries.length - 1);
  const rightState = buildMainRotationState(splitImageRight, rightIndex);

  await Promise.all([
    setMainRotationEntry(splitImageLeft, mainRotationEntries[leftState.index]),
    setMainRotationEntry(splitImageRight, mainRotationEntries[rightState.index]),
  ]);

  scheduleMainRotation(leftState, MAIN_ROTATION_INTERVAL);
  scheduleMainRotation(rightState, RIGHT_ROTATION_DELAY);
};

export const rotateMainPic = async (element, direction, instant = false) => {
  const state = mainRotationStates.get(element);
  if (!state) return;

  clearTimeout(state.timerId);
  if (state.transitionPromise) await state.transitionPromise;
  await advanceMainRotation(state, direction, instant);
  scheduleMainRotation(state, MANUAL_INTERACTION_PAUSE);
};

const buildMainRotationState = (element, index) => {
  const state = { element, index, timerId: null, transitionPromise: null };
  mainRotationStates.set(element, state);
  return state;
};

const scheduleMainRotation = (state, delay) => {
  clearTimeout(state.timerId);
  state.timerId = setTimeout(async () => {
    await advanceMainRotation(state, "next");
    scheduleMainRotation(state, MAIN_ROTATION_INTERVAL);
  }, delay);
};

const advanceMainRotation = async (state, direction, instant = false) => {
  if (!state || mainRotationEntries.length === 0) return;

  state.index = getAdjacentRotationIndex(state.index, mainRotationEntries.length, direction);
  state.transitionPromise = setMainRotationEntry(state.element, mainRotationEntries[state.index], instant);
  await state.transitionPromise;
  state.transitionPromise = null;
};

export const getAdjacentRotationIndex = (index, entryCount, direction) => {
  if (entryCount <= 0) return 0;
  if (direction === "prev") return (index - 1 + entryCount) % entryCount;
  return (index + 1) % entryCount;
};

const buildFallbackRotationEntries = () => {
  const entries = [];
  for (let i = 0; i < mainPicArray.length; i++) {
    entries.push({ src: mainPicArray[i], urlName: null });
  }
  return entries;
};

export const setMainRotationEntry = async (element, entry, instant = false) => {
  if (!element || !entry) return;

  await setCurrentPic(element, entry.src, true, true, instant);
  setMainRotationLink(element, entry.urlName);
};

const setMainRotationLink = (element, urlName) => {
  if (!urlName) {
    delete element.dataset.urlName;
    element.href = "/products";
    return;
  }

  element.dataset.urlName = urlName;
  element.href = `/products/${urlName}`;
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
