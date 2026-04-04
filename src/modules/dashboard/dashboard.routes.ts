import { Router } from "express";

import { authenticateToken } from "../../middlewares/auth";
import { dashboardControllers } from "./dashboard.controller";


const route = Router()

route.get('/metrics', authenticateToken, dashboardControllers.getMetrics)
route.get('/revenue-chart', authenticateToken, dashboardControllers.revenueChart)
route.get('/activities', authenticateToken, dashboardControllers.activities)


export const dashboardRoute = 
    route
