//TO DO: CURRENT IMAGE IS FUCKED ON EDIT IN ADMIN / FIX ON UPLOAD IN RUN

// - BUILD FRONTEND (just so have something to show)

// - ADD EDIT ITEM / VIEW ITEM BUTTONS / FUNCTIONS

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
