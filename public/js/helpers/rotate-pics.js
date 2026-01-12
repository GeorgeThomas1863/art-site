import { sendToBack } from "../util/api-front.js";

// Array of image URLs to rotate through
const picArray = [
  "/images/background/acorn1.jpg",
  "/images/background/acorn2.jpg",
  "/images/background/mtb1.jpg",
  "/images/background/matted1.jpg",
  "/images/background/matted2.jpg",
];

let picIndexLeft = 0;
let picIndexRight = 3; //start at different spot to avoid overlap

// Initialize image rotation
export const startPicRotation = async () => {
  const splitImageLeft = document.getElementById("split-image-left");
  const splitImageRight = document.getElementById("split-image-right");

  // Set initial image
  await setCurrentPic(splitImageLeft, picArray[picIndexLeft]);
  await setCurrentPic(splitImageRight, picArray[picIndexRight]);

  // Rotate left image
  setInterval(async () => {
    picIndexLeft++;
    if (picIndexLeft >= picArray.length) {
      picIndexLeft = 0;
    }
    await setCurrentPic(splitImageLeft, picArray[picIndexLeft]);
  }, 5000);

  // Rotate right image (offset by 2.5 seconds for visual interest)
  setTimeout(() => {
    setInterval(async () => {
      picIndexRight++;
      if (picIndexRight >= picArray.length) {
        picIndexRight = 0;
      }
      await setCurrentPic(splitImageRight, picArray[picIndexRight]);
    }, 5000);
  }, 2500);
};

export const getBackgroundPics = async () => {
  const res = await sendToBack({ route: "/get-background-pics" }, "GET");

  console.log("GET BACKGROUND PICS RES");
  console.log(res);

  return res;
};

// Set background image
export const setCurrentPic = async (element, picURL) => {
  if (!element) return;
  element.style.backgroundImage = `url('${picURL}')`;
};
