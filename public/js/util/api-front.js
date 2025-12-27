export const sendToBack = async (inputParams, method = "POST") => {
  const { route } = inputParams;

  try {
    const params = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method !== "GET" && method !== "HEAD") {
      params.body = JSON.stringify(inputParams);
    }

    const res = await fetch(route, params);
    const data = await res.json();
    console.log("DATA");
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
    return "FAIL";
  }
};

export const sendToBackFile = async (inputParams) => {
  const { route, formData } = inputParams;

  try {
    const res = await fetch(route, {
      method: "POST",
      body: formData,
    });

    if (res.error) {
      console.log("UPLOAD ERROR");
      console.log(res.error);
      return "FAIL";
    }

    const data = await res.json();
    return data;
  } catch (e) {
    console.log("UPLOAD ERROR");
    console.log(e);
    return "FAIL";
  }
};

// export const sendToBackGET = async (inputParams) => {
//   const { route } = inputParams;

//   try {
//     const res = await fetch(route, {
//       method: "GET",
//     });

//     const data = await res.json();
//     return data;
//   } catch (e) {
//     console.log(e);
//     return "FAIL";
//   }
// };
