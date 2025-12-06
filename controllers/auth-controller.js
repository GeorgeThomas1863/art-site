import CONFIG from "../config/config.js";

export const authController = (req, res) => {
  if (!req.body || !req.body.pw) {
    res.json({ success: false, redirect: "/401" });
    return;
  }

  //pw check
  if (req.body.pw !== CONFIG.pw) {
    res.json({ success: false, redirect: "/401" });
    return;
  }

  // auth pw
  req.session.authenticated = true;
  res.json({ success: true, redirect: "/" });
};
