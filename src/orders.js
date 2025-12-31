import { runGetCartStats } from "./cart.js";

export const runPlaceOrder = async (req) => {
  const cart = await runGetCartStats(req);

  console.log("RUN PLACE ORDER");
  console.log("CART");
  console.log(cart);
  console.log("REQ BODY");
  console.log(req.body);
};
