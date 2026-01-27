import { SquareClient, SquareEnvironment } from "square";

const SQ = new SquareClient({
  token: process.env.SQUARE_TOKEN, // Get from Square Dashboard
  environment: SquareEnvironment.Sandbox, // Change to Environment.Production for live
});

export default SQ;
