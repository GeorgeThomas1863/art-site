//about display still wrong

//upcoming events value in admin section is off

//popup display of product category should be under add to cart

//product display media styles

//have the can ship selection NOT cause shit to disappear but instead change shipping info to N/A / make not editable

//newsletter is prob fucked in contacts, double check

//media queries, changed back

//RUN ANOTHER SECURITY AUDIT, specifically on USER INPUTS

//DEPLOY, hten make style edits

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
