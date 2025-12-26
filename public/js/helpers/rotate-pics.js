// Array of image URLs to rotate through
const picArrayLeft = [
  "/images/background/acorn1.jpg",
  "/images/background/acorn2.jpg",
  "/images/background/mtb1.jpg",
  "/images/background/matted1.jpg",
  "/images/background/matted2.jpg",
];

// const picArrayRight = [
//   "/images/background/mountains1.jpg",
//   "/images/background/mountains2.jpg",
//   "/images/background/mountains3.jpg",
//   "/images/background/mountains4.jpg",
//   "/images/background/beach1.jpg",
//   "/images/background/beach2.jpg",
//   "/images/background/beach3.jpg",
// ];

const picArrayRight = [
  "/images/background/mtb1.jpg",
  "/images/background/matted1.jpg",
  "/images/background/matted2.jpg",
  "/images/background/acorn1.jpg",
  "/images/background/acorn2.jpg",
];

const staticPics = {
  left: "/images/background/selfie1.jpg",
  // center: "/images/background/selfie2.jpg",
  // right: "/images/background/selfie3.jpg",
};

let picIndexLeft = 0;
let picIndexRight = 0;

// Initialize image rotation
export const startPicRotation = async () => {
  // const splitImage = document.getElementById("split-image");
  const splitImageLeft = document.getElementById("split-image-left");
  const splitImageRight = document.getElementById("split-image-right");
  const staticImage = document.getElementById("split-image-static");
  // const staticLeft = document.getElementById("split-image-static-left");
  // const staticCenter = document.getElementById("split-image-static-center");
  // const staticRight = document.getElementById("split-image-static-right");

  // if (!splitImage) {
  //   console.error("Current pic element not found");
  //   return;
  // }

  // Set initial image
  await setCurrentPic(splitImageLeft, picArrayLeft[picIndexLeft]);
  await setCurrentPic(splitImageRight, picArrayRight[picIndexRight]);
  await setCurrentPic(staticImage, staticPics.left);

  // if (staticLeft) await setCurrentPic(staticLeft, staticPics.left);
  // if (staticCenter) await setCurrentPic(staticCenter, staticPics.center);
  // if (staticRight) await setCurrentPic(staticRight, staticPics.right);

  setInterval(async () => {
    picIndexLeft++;
    if (picIndexLeft >= picArrayLeft.length) {
      picIndexLeft = 0;
    }
    await setCurrentPic(splitImageLeft, picArrayLeft[picIndexLeft]);
  }, 5000);

  // Rotate right image (offset by 2.5 seconds for visual interest)
  setTimeout(() => {
    setInterval(async () => {
      picIndexRight++;
      if (picIndexRight >= picArrayRight.length) {
        picIndexRight = 0;
      }
      await setCurrentPic(splitImageRight, picArrayRight[picIndexRight]);
    }, 5000);
  }, 2500);

  // setInterval(async () => {
  //   picIndex++;
  //   if (picIndex >= picArray.length) {
  //     picIndex = 0;
  //   }
  //   await setCurrentPic(picIndex);
  // }, 5000);
};

// Set background image
export const setCurrentPic = async (element, picURL) => {
  if (!element) return;
  element.style.backgroundImage = `url('${picURL}')`;
};
