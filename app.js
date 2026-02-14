//image links are all broken

//image upload broken on pics and events

//button for auth pw toggle broken

//have the can ship selection NOT cause shit to disappear but instead change shipping info to N/A / make not editable

//current subscribers simply listed as "fail"

//media queries, changed back

//RUN ANOTHER SECURITY AUDIT, specifically on USER INPUTS

//rotating pics on about?

//-----------------

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
