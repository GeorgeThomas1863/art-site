import { SquareClient, SquareEnvironment } from "square";

// Defaults to Production when SQUARE_ENV is unset — the deployed prod box has no
// SQUARE_ENV var yet and must keep working. Set SQUARE_ENV=sandbox to switch.
const squareEnvironment = process.env.SQUARE_ENV === "sandbox" ? SquareEnvironment.Sandbox : SquareEnvironment.Production;

const SQ = new SquareClient({
  token: process.env.SQUARE_TOKEN, // Get from Square Dashboard
  environment: squareEnvironment,
});

export default SQ;
