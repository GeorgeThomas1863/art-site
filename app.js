//build contact us page

//build newsletter into the admin backend (add sign up on events / contact us page)

//finish purchases (with shipping + tax)

//add local only option to products (items that cant ship)

//Build page or popup for product details

//build backend for adding events / newsletter (email mailing list)

//add about, events, contact us, newsletter  display pages

//rotating pics on about

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
