import fs from "fs";
import path from "path";
import multer from "multer";

const baseDir = path.join(process.cwd(), "multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = "other";
    if (file.fieldname === "avatar") sub = "avatar";
    else if (file.fieldname === "image") sub = "image";
    else if (file.fieldname === "video") sub = "video";
    const dest = path.join(baseDir, sub);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqname = Date.now() + "_" + Math.floor(Math.random() * 1e9);
    cb(null, file.fieldname + "_" + uniqname + file.originalname);
  },
});

const upload = multer({ storage });

export default upload;
