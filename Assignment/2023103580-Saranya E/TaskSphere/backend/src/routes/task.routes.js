import { Router } from "express";

import {
createTask,
getTasks,
getTaskById,
updateTask,
deleteTask,
} from "../controllers/task.controller.js";

import {
authenticate,
} from "../middleware/auth.middleware.js";

import {
validate,
} from "../middleware/validate.middleware.js";

import {
createTaskSchema,
} from "../validators/task.validator.js";

const router = Router();

router.post(
"/",
authenticate,
validate(createTaskSchema),
createTask
);

router.get(
"/",
authenticate,
getTasks
);

router.get(
"/:id",
authenticate,
getTaskById
);

router.put(
"/:id",
authenticate,
updateTask
);

router.delete(
"/:id",
authenticate,
deleteTask
);

export default router;
