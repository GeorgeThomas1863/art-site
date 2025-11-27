import { buildHomeForm } from "./forms/home-form.js";

const displayElement = document.getElementById("display-element");

export const buildDisplay = async () => {
  if (!displayElement) return null;
  //   const { isFirstLoad } = stateFront;

  const data = await buildHomeForm(inputArray);
  displayElement.append(data);

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
    url: "/images/photo_2025-11-27_16-18-06.jpg",
    title: "Alpine Solitude",
    price: "$425",
    description:
      "Captured at dawn in the Swiss Alps, this piece embodies the quiet magnificence of untouched wilderness. Museum-quality archival print on fine art paper.",
  },
  {
    url: "/images/photo_2025-11-27_16-18-21.jpg",
    title: "Emerald Path",
    price: "$350",
    description: "Limited edition print, 20x30 inches",
  },
  {
    url: "/images/photo_2025-11-27_16-18-24.jpg",
    title: "Prairie Light",
    price: "$375",
    description: "Limited edition print, 30x40 inches",
  },
  {
    url: "/images/photo_2025-11-27_16-18-28.jpg",
    title: "Horizon",
    price: "$325",
    description: "Limited edition print, 24x36 inches",
  },
  {
    url: "/images/photo_2025-11-27_16-18-35.jpg",
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
