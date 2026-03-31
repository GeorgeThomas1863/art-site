//FIX MAX SIZING ON NEWSLETTER IMAGES THAT ARE EDITED

//RUN ANOTHER FULL CODE REVIEW AND SECURITY REVIEW OF SITE

//MAKE SURE IMAGE EDTING WORKS ON MOBILE, keep testing image editing

// figure out the cloudflare problem and fix it (have claude investigate based on cloudflare docs)

//figure out how to receive email from mailgun through admin email

//popup display of product category should be under add to cart?

//-----------------

import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

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
