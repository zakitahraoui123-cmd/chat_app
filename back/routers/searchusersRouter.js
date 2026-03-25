
import express from "express";
import pool from "../database/postgrsql.js";

const router = express.Router();

router.get("/searchuser", async (req, res) => {
  try {

    const { search } = req.query;

    const users = await pool.query(
      `SELECT id, first_name
       FROM user_info
       WHERE first_name ILIKE $1
       LIMIT 10`,
      [`%${search}%`]
    );

    res.json(users.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
});

export default router;