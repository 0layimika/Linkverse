import { Router } from "express";
import { uploadFile, deleteFile } from "../controllers/media.controller";
import { auth } from "../middlewares/auth.middleware";
import { uploadSingle, validateFileSize } from "../middlewares/upload.middleware";

const router = Router();

router.use(auth);

router.post(
    "/upload",
    uploadSingle,
    validateFileSize,
    uploadFile
);

router.delete(
    "/delete/:fileId",
    deleteFile
);

export default router;

