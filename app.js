// BUILD SEND EMAIL CONFIRMATION (finish) //confirm checkout page + shipping fully works

//shipping totals in checkout page are off / selected shipping option when checkout loads fucked

//change confirm email to admin to include more shipping info

//change confirm email to user to NOT include order number  and to include mroe arrival info

//if user has calculated shiping ands changes order, recalculate shipping

//starting admin confirm

//add louis armstrong thing

//media queries

//RUN SECURITY AUDIT, esp on USER INPUTS

//-----------------

//BUGS: price of items in cart needs to changed based on quantity

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
