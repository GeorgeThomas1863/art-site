// make backup of all pics

// report on number of unique visitors, by page?

// better sending email account for newsletter (display name, pic etc)

// way to email out new products, so a button in admin, in product creation panel

// in admin sort IDs by product type / IDs more logical

// buttons / videos in the news letter

//w ay to remove / hide old events from display

//videos in newsletters

//test image / vid uploads and editing on multiple displays

//write tests?

//++++++++++++++++++

//RUN ANOTHER FULL CODE REVIEW AND SECURITY REVIEW OF SITE

//MAKE SURE IMAGE EDTING WORKS ON MOBILE, keep testing image editing

// figure out the cloudflare problem and fix it (have claude investigate based on cloudflare docs)

//figure out how to receive email from mailgun through admin email

//popup display of product category should be under add to cart?

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
