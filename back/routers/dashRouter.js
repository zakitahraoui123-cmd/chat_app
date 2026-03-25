import express from "express";
import upload from "../multer/multer.js";
import pool from "../database/postgrsql.js";
import { toPublicMulterPath } from "../pathUtils.js";

const dashRouter = express.Router();

dashRouter.post("/dash", upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const webPath = toPublicMulterPath(req.file.path);
  if (!webPath) {
    return res.status(500).json({ message: "Could not resolve upload path" });
  }
  try {
    await pool.query(
      "INSERT INTO profile_picture (user_id,avatar) VALUES($1,$2)",
      [req.body.userid, webPath]
    );
    res.status(200).json({ message: "ok", avatar: webPath });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Could not save avatar" });
  }
});


export default dashRouter;