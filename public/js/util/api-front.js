export const sendToBack = async (inputParams) => {
  const { route } = inputParams;

  try {
    const res = await fetch(route, {
      method: "POST",
      body: JSON.stringify(inputParams),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
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

export const sendToBackGET = async (inputParams) => {
  const { route } = inputParams;

  try {
    const res = await fetch(route, {
      method: "GET",
    });

    const data = await res.json();
    return data;
  } catch (e) {
    console.log(e);
    return "FAIL";
  }
};
