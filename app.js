//connect to mongo

import express from "express";
import routes from "./routes/router.js";

import CONFIG from "./config/config.js";

const { displayPort } = CONFIG;

const app = express();

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

// app.listen(1801);
app.listen(displayPort);
