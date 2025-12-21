//BUILD THE FUCKING FRONTEND

//PUT PICS IN IMAGES FOLDER AND DONT SAVE TO GITHUB

//Alphabetize select product drop down

//BUILD WAY TO UPLOAD MULTIPLE PICS PER PRODUCT

//ADD REAL DATA AND BUILD FRONTEND

import express from "express";
import session from "express-session";
import routes from "./routes/router.js";

import CONFIG from "./config/config.js";

const { expressPicPath, picPath, port } = CONFIG;

const app = express();

app.use(session(CONFIG.buildSessionConfig()));

app.use(expressPicPath, express.static(picPath));

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

app.listen(port);
