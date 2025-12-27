import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.sendFile(path.join(__dirname, "../html/auth.html"));
    // res.sendFile(path.join(process.cwd(), "html", "auth.html"));
    // res.redirect("/auth");
    return;
  }
};

export default requireAuth;
