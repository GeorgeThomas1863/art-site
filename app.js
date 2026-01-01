//make order submission less dumb in buy.js


//BUGS: price of items in cart needs to changed based on quantity

//fix square styles for card input

//test purchases with my square acct

//add dates to product upload

//switch product filter to buttons; include type descriptions on click

//Build model or popup for product details

//add in facebook and insta connections

//add about and events display pages

//add events create and mailing list to ADMIN / Mongo

//ADD CATEGORY DESCRIPTIONS

// email mailing list

// contact us form

// event upload / newslettre

// rotating pics on about

// tax location RESEARCH

//ask about 3 pics or 2 pics on main page

import express from "express";
import session from "express-session";
import routes from "./routes/router.js";

import CONFIG from "./config/config.js";

// const { expressPicPath, picPath, port } = CONFIG;
const { port } = CONFIG;

const app = express();

app.use(session(CONFIG.buildSessionConfig()));

// app.use(expressPicPath, express.static(picPath));

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

app.listen(port);
