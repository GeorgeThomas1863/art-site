//NEED to switch repo given old pics in history

//-----------------

import "./middleware/env-config.js";

import express from "express";
import session from "express-session";
import routes from "./routes/router.js";

import { buildSessionConfig } from "./middleware/session-config.js";
import { dbConnect } from "./middleware/db-config.js";

const app = express();

//trust the first proxy hop (nginx) so secure cookies work once COOKIE_SECURE=true in prod
app.set("trust proxy", 1);

app.use(session(buildSessionConfig()));

//standard public path
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.use(routes);

await dbConnect();
app.listen(process.env.PORT, process.env.HOST || "127.0.0.1");
