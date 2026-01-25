"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../controllers/media.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.auth);
router.post("/upload", upload_middleware_1.uploadSingle, upload_middleware_1.validateFileSize, media_controller_1.uploadFile);
router.delete("/delete/:fileId", media_controller_1.deleteFile);
exports.default = router;
//# sourceMappingURL=media.route.js.map