//FIX FUCKING MULTI PIC ARROWS

//fix event dates / display

//border problem in modal

//figure out how to get email to NOT go to spam

// figure out the cloudflare problem and fix it

//figure out how to receive email from mailgun through admin email

//popup display of product category should be under add to cart

//RUN ANOTHER SECURITY AUDIT, specifically on USER INPUTS


//-----------------

import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import express from "express";
import session from "express-session";
import routes from "./routes/router.js";

import { buildSessionConfig } from "./middleware/session-config.js";

const app = express();

app.use(session(buildSessionConfig()));

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

app.listen(process.env.PORT);
