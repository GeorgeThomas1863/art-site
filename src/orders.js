import { runGetCartStats } from "./cart.js";

export const runPlaceOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  const inputParams = req.body;

  const cart = await runGetCartStats(req);
  if (!cart || !cart.success) return { success: false, message: "Failed to get cart data" };

  console.log("RUN PLACE ORDER");
  console.log("CART");
  console.log(cart);
  console.log("REQ BODY");
  console.log(req.body);

  //FIGURE OUT TAXES, put in CONFIG
  const taxRate = 0.08;
  const tax = cart.total * taxRate;

  const totalCost = cart.total + tax;

  //TEST THIS
  const paymentRes = await processPayment(totalCost, inputParams);

  //BUILD ORDER

  //STORE CUSTOMER DATA
};
