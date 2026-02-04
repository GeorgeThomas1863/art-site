const debounce = (func) => {
  let timer;
  const DELAY = 500; //500 milliseconds

  //method for creating new promise, so can use with async await
  return (...args) => {
    return new Promise((resolve, reject) => {
      // Cancel any pending execution
      clearTimeout(timer);

      // Schedule new execution
      timer = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, DELAY);
    });
  };
};

export default debounce;
