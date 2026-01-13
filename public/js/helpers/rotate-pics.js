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
  "/images/background/acorn1.jpg",
  "/images/background/acorn2.jpg",
  "/images/background/mtb1.jpg",
  "/images/background/matted1.jpg",
  "/images/background/matted2.jpg",
];

const aboutStaticPic = "/images/background/wool_background.jpg";

let mainIndexLeft = 0;
let mainIndexRight = 3; //start at different spot to avoid overlap

let aboutIndexTop = 0;
let aboutIndexMiddle = 3;

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

export const startAboutPicRotation = async () => {
  const aboutImageTop = document.getElementById("about-image-top");
  const aboutImageMiddle = document.getElementById("about-image-middle");
  const aboutImageBottom = document.getElementById("about-image-bottom");

  // Set initial images
  await setCurrentPic(aboutImageTop, aboutPicArray[aboutIndexTop]);
  await setCurrentPic(aboutImageMiddle, aboutPicArray[aboutIndexMiddle]);
  await setCurrentPic(aboutImageBottom, aboutStaticPic);

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
      aboutIndexMiddle++;
      if (aboutIndexMiddle >= aboutPicArray.length) {
        aboutIndexMiddle = 0;
      }
      await setCurrentPic(aboutImageMiddle, aboutPicArray[aboutIndexMiddle]);
    }, 5000);
  }, 2500);
};

// Set background image
export const setCurrentPic = async (element, picURL) => {
  if (!element) return;
  element.style.backgroundImage = `url('${picURL}')`;
};

// export const getBackgroundPics = async () => {
//   const res = await sendToBack({ route: "/get-background-pics" }, "GET");

//   console.log("GET BACKGROUND PICS RES");
//   console.log(res);

//   return res;
// };
