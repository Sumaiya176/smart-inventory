import { Router } from "express";
import { activityLogControllers } from "./activity-log.controller";
import { authenticateToken } from "../../middlewares/auth";

const route = Router()

route.get("/", authenticateToken ,activityLogControllers.activities)


export const activityLogRoute = 
    route
