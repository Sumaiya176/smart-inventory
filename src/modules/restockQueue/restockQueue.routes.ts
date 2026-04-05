import { Router } from "express";
import { restockQueueControllers } from "./restockQueue.controller";
import { authenticateToken } from "../../middlewares/auth";

const route = Router()

route.get("/", authenticateToken, restockQueueControllers.getAllRestockQueueItems)
route.delete("/:itemId", authenticateToken, restockQueueControllers.removeFromQueue)
route.patch("/update-stock/:productId", authenticateToken, restockQueueControllers.updateStockLevel)
route.post("/bulk-restock", authenticateToken, restockQueueControllers.bulkRestockProducts)

export const restockQueueRoute = 
    route
