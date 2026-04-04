import { Router } from "express";
import { orderControllers } from "./order.controller";
import { authenticateToken } from "../../middlewares/auth";


const route = Router()

route.post("/create-order", authenticateToken, orderControllers.createOrder)
route.get("/orders", authenticateToken, orderControllers.getAllOrders)
route.get("/order-statistics", authenticateToken, orderControllers.orderStatistics)
route.patch("/update-order-status/:id", authenticateToken, orderControllers.updateOrderStatus)
route.post("/cancel-order/:orderId", authenticateToken, orderControllers.cancelOrder)

export const orderRoute = 
    route
