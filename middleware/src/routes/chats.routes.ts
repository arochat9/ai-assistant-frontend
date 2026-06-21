import { Router } from "express";
import { getChats, getChatMessages, getChatDetail } from "../controllers/chats.controller";

const router = Router();

router.post("/", getChats);
router.post("/:id/messages", getChatMessages);
router.get("/:id/detail", getChatDetail);

export default router;
