//if user has calculated shiping ands changes order, recalculate shipping

//confirm checkout page + shipping fully works // BUILD SEND EMAIL CONFIRMATION

//starting admin confirm

//add louis armstrong thing

//media queries

//RUN SECURITY AUDIT, esp on USER INPUTS

//-----------------

//BUGS: in cart price of items themselves need to changed based on quantity

//number of events at bottom not updating correctly

//fix square styles for card input

//rotating pics on about?

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
