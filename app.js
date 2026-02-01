//build admin newsletter backend, get fully working

//finish purchases (with shipping + tax)

//add local only option to products (items that cant ship)

//Build page or popup for product details

//rotating pics on about?

//-----------------

//BUGS: price of items in cart needs to changed based on quantity

//number of events at bottom not updating correctly

//fix square styles for card input

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
