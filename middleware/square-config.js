import { SquareClient, SquareEnvironment } from "square";

const SQ = new SquareClient({
  token: process.env.SQUARE_TOKEN, // Get from Square Dashboard
  // SANDBOX (active) — comment out when deploying
  // environment: SquareEnvironment.Sandbox,
  // PRODUCTION — uncomment when deploying
  environment: SquareEnvironment.Production,
});

export default SQ;
