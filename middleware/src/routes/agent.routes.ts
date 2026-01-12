import { Router } from "express";
import * as agentController from "../controllers/agent.controller";

const router = Router();

// POST /api/agent/chat - Chat with AI agent
router.post("/chat", agentController.chat);

export default router;
