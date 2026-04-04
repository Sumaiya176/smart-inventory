import { Request, Response } from "express";
import { sendResponse } from "../../util/sendResponse";
import { orderServices } from "./order.service";
import { AuthRequest } from "../../middlewares/auth";

const createOrder = async (req : AuthRequest, res : Response) => {
    console.log("Creating order with data:", req.body); // Debug log
   try {
     const result = await orderServices.createOrder(req.body, req.user)

    sendResponse(res, {data:result, message: "Order created Successfully", isSuccess: true})
   } catch (error : any) {
    console.error("Error creating order:", error);
    sendResponse(res, {message: "Error creating order", isSuccess: false, data: error})
   }
}
const getAllOrders = async (req : Request, res : Response) => {
    console.log("Fetching all orders"); // Debug log
    try {
        const result = await orderServices.getAllOrders(req.query);
        sendResponse(res, {data:result, message: "Orders fetched Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error fetching orders:", error);
        sendResponse(res, {message: "Error fetching orders", isSuccess: false, data: error})
    }
}

const updateOrderStatus = async (req : AuthRequest, res : Response) => {
    console.log("Updating order status", req.params.id, req.body.status ); // Debug log
    try {
        const result = await orderServices.updateOrderStatus(req.params.id as string, req.body.status, req.user as any);
        sendResponse(res, {data:result, message: "Order status updated Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error updating order status:", error);
        sendResponse(res, {message: "Error updating order status", isSuccess: false, data: error})
    }
}
const cancelOrder = async (req : AuthRequest, res : Response) => {
    console.log("Cancelling order" ); // Debug log
    try {
        const result = await orderServices.cancelOrder(req.params.orderId as string, req.user as any, req.body.reason as string);
        sendResponse(res, {data:result, message: "Order cancelled Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error cancelling order:", error);
        sendResponse(res, {message: "Error cancelling order", isSuccess: false, data: error})
    }
}

const orderStatistics = async (req : Request, res : Response) => {
    console.log("Fetching order statistics");
    try {
        const result = await orderServices.orderStatistics();
        sendResponse(res, {data:result, message: "Order statistics fetched Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error fetching order statistics:", error);
        sendResponse(res, {message: "Error fetching order statistics", isSuccess: false, data: error})
    }
}

export const orderControllers = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    orderStatistics
}