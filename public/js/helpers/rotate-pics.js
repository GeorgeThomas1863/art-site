// Array of image URLs to rotate through
const picArray = [
  "/images/background/beach1.jpg",
  "/images/background/beach2.jpg",
  "/images/background/beach3.jpg",
  "/images/background/mountains1.jpg",
  "/images/background/mountains2.jpg",
  "/images/background/mountains3.jpg",
  "/images/background/mountains4.jpg",
  "/images/background/selfie1.jpg",
];

let picIndex = 0;

// Initialize image rotation
export const startPicRotation = async () => {
  const splitImage = document.getElementById("split-image");

  if (!splitImage) {
    console.error("Current pic element not found");
    return;
  }

  // Set initial image
  await setCurrentPic(picIndex);

  // Rotate image every 2 seconds
  setInterval(async () => {
    picIndex++;
    if (picIndex >= picArray.length) {
      picIndex = 0;
    }
    await setCurrentPic(picIndex);
  }, 2000); //switch to 5
};

// Set background image
export const setCurrentPic = async (index) => {
  const splitImage = document.getElementById("split-image");

  if (!splitImage) return;

  const imageUrl = picArray[index];
  splitImage.style.backgroundImage = `url('${imageUrl}')`;
};
