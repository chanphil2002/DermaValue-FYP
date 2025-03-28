import express from "express";
import passport from "passport";

const router = express.Router();

router.post("/clinician/login", passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true
}), (req, res) => {
  res.redirect("/dashboard"); // Redirect after successful login
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

export default router;
