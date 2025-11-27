import { buildHomeForm } from "./forms/home-form.js";

const displayElement = document.getElementById("display-element");

export const buildDisplay = async () => {
  if (!displayElement) return null;
  //   const { isFirstLoad } = stateFront;

  await buildHomeForm(inputArray);

  //   if (isFirstLoad) {
  //     const dropDownElement = await buildDropDownForm();
  //     const inputFormWrapper = await buildInputForms();
  //     displayElement.append(dropDownElement, inputFormWrapper);
  //   }

  //   await updateDisplay();

  return true;
};

const inputArray = [
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
    title: "Alpine Solitude",
    price: "$425",
    description:
      "Captured at dawn in the Swiss Alps, this piece embodies the quiet magnificence of untouched wilderness. Museum-quality archival print on fine art paper.",
  },
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    title: "Emerald Path",
    price: "$350",
    description: "Limited edition print, 20x30 inches",
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    title: "Prairie Light",
    price: "$375",
    description: "Limited edition print, 30x40 inches",
  },
  {
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
    title: "Horizon",
    price: "$325",
    description: "Limited edition print, 24x36 inches",
  },
  {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
    title: "Dunes",
    price: "$400",
    description: "Limited edition print, 24x36 inches",
  },
];

// export const updateDisplay = async () => {
//   if (!displayElement) return null;

//   //remove current data element
//   const currentDataElement = document.getElementById("return-display-wrapper");
//   if (currentDataElement) currentDataElement.remove();

//   const updateDataRoute = await sendToBack({ route: "/get-backend-value-route", key: "updateDisplayDataRoute" });

//   const updateArray = await sendToBack({ route: updateDataRoute.value, stateFront: stateFront });
//   await updateStateFront(updateArray);

//   // console.log("UPDATE DATA");
//   // console.dir(updateArray || "NO UPDATE DATA");

//   // also handles empty display
//   const returnDisplay = await buildReturnDisplay(updateArray);
//   if (!returnDisplay) return null;

//   displayElement.append(returnDisplay);

//   // console.log("STATE FRONT");
//   // console.dir(stateFront);

//   return true;
// };

buildDisplay();
