import express from "express";
import session from "express-session";
import routes from "./routes/router.js";

import CONFIG from "./config/config.js";

const app = express();

app.use(session(CONFIG.buildSessionConfig()));

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

app.listen(CONFIG.port);
