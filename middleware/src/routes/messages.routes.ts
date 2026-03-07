import { Router } from "express";
import { getMessages } from "../controllers/messages.controller";

const router = Router();

router.post("/", getMessages);

export default router;
