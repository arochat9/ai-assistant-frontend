import { Router } from "express";
import { getMessages, searchMessages } from "../controllers/messages.controller";
import { getMessagesMetrics } from "../controllers/chats.controller";

const router = Router();

router.post("/", getMessages);
router.post("/search", searchMessages);
router.get("/metrics", getMessagesMetrics);

export default router;
