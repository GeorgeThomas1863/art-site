//build shipping calculator

// tax location RESEARCH

//add category descriptions to products page display

//Build page or popup for product details

//add in facebook and insta connections

//build backend for adding events / newsletter (email mailing list)

//add about, events, contact us, newsletter  display pages

//rotating pics on about

//add in the color display changes they made

//-----------------

//BUGS: price of items in cart needs to changed based on quantity

//fix square styles for card input

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
