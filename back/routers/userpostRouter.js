import express from "express";
import pool from "../database/postgrsql.js";
import upload from "../multer/multer.js";
import { toPublicMulterPath } from "../pathUtils.js";

const userPostsRouters = express.Router();

userPostsRouters.get("/posts/:userPostId", async (req, res) => {
  const { userPostId } = req.params;
  if (!userPostId) return res.status(400).json({ message: "missing id" });
  try {
    const AlluserPosts = await pool.query(
      "SELECT * FROM get_user_posts($1)",
      [userPostId]
    );
    res.status(200).json({ userPosts: AlluserPosts.rows });
  } catch (error) {
    res.status(500).json({ message: "we could not acceses the user posts" });
  }
});

userPostsRouters.post(
  "/creatpost",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    let userImage = null;
    let userVideo = null;

    if (req.body.image === "null") userImage = null;
    else if (req.body.video === "null") userVideo = null;

    try {
      const userId = req.body?.userId;
      const userPostText = req.body?.text ?? "";
      userImage = toPublicMulterPath(req.files?.image?.[0]?.path);
      userVideo = toPublicMulterPath(req.files?.video?.[0]?.path);

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      await pool.query(
        "INSERT INTO user_post_video_pic (user_id,post,video,image) VALUES ($1,$2,$3,$4)",
        [userId, userPostText || null, userVideo, userImage]
      );
      res.status(200).json({ message: "post was uploaded" });
    } catch (error) {
      console.error("creatpost error:", error);
      res.status(500).json({
        message: error?.message || "could not save post",
      });
    }
  }
);

export default userPostsRouters;
