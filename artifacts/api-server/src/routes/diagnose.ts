import { Router, type IRouter } from "express";
import multer from "multer";

import { diagnose, getIndexStatus, loadIndex } from "../lib/diagnosisIndex";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB
});

// Warm the index on first import
loadIndex().catch((err) => {
  logger.error({ err }, "Failed to load diagnosis index at startup");
});

router.get("/diagnose/status", async (_req, res) => {
  res.json(getIndexStatus());
});

router.post("/diagnose", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      res.status(400).json({ error: "Missing image upload (field: image)" });
      return;
    }
    const t0 = Date.now();
    const verdict = await diagnose(file.buffer);
    const ms = Date.now() - t0;
    logger.info(
      { ms, condition: verdict.condition, confidence: verdict.confidence },
      "Diagnosed image",
    );
    res.json({ ...verdict, durationMs: ms });
  } catch (err) {
    logger.error({ err }, "Diagnosis failed");
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Diagnosis failed" });
  }
});

export default router;
