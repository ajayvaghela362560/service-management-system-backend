import { Router } from "express";
import multer from "../helpers/multer.js";
import { uploadFileToS3 } from "../helpers/fileUpload.js";
const routesManager = Router();

routesManager.get("/", (req, res) => {
  const status = 200;
  res.status(status).end();
});

routesManager.post("/file-upload", multer.array("files"), async (req, res) => {
  try {
    const uploadedFiles = await Promise.all(req.files.map(uploadFileToS3));
    res.status(200).json({ success: true, files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default routesManager;
