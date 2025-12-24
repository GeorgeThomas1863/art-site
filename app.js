//ADD CATEGORY DESCRIPTIONS, INCLUE CUSTOM FONT

//Build model or popup for product details

//BUILD shopping cart

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
