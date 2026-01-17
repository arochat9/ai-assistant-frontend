import { Router } from "express";
import { getTasks, getTaskById, createNewTask, updateExistingTask } from "../controllers/tasks.controller";
import { getTaskChanges } from "../controllers/taskChangelogs.controller";

const router = Router();

router.post("/", getTasks);
router.get("/:id", getTaskById);
router.post("/create", createNewTask);
router.put("/update", updateExistingTask);
router.post("/changelogs", getTaskChanges);

export default router;
