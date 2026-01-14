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

// Initialize image rotation
export const startMainPicRotation = async () => {
  const splitImageLeft = document.getElementById("split-image-left");
  const splitImageRight = document.getElementById("split-image-right");

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

  // Set initial images
  await setCurrentPic(aboutImageTop, aboutPicArray[aboutIndexTop]);
  await setCurrentPic(aboutImageBottom, aboutPicArray[aboutIndexBottom]);
  await setCurrentPic(aboutImageStatic, aboutStaticPic);

  // Rotate top image
  setInterval(async () => {
    aboutIndexTop++;
    if (aboutIndexTop >= aboutPicArray.length) {
      aboutIndexTop = 0;
    }
    await setCurrentPic(aboutImageTop, aboutPicArray[aboutIndexTop]);
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

// Set background image
export const setCurrentPic = async (element, picURL) => {
  if (!element) return;
  element.style.backgroundImage = `url('${picURL}')`;
};
