import { Request, Response } from "express";
import { sendResponse } from "../../util/sendResponse";
import { dashboardServices } from "./dashboard.service";
import { AuthRequest } from "../../middlewares/auth";

const getMetrics = async (req : AuthRequest, res : Response) => {
    console.log("Fetching order metrics"); // Debug log
    try {
        const result = await dashboardServices.getMetrics();
        sendResponse(res, {data:result, message: "Order metrics fetched Successfully", isSuccess: true})
   } catch (error : any) {
    console.error("Error fetching order metrics:", error);
    sendResponse(res, {message: "Error fetching order metrics", isSuccess: false, data: error})
   }
}

const revenueChart = async (req : Request, res : Response) => {
    console.log("Fetching revenue chart data"); 
    try {
        const { days = '7' } = req.query;
        const result = await dashboardServices.revenueChart(days as string);
        sendResponse(res, {data:result, message: "Revenue chart data fetched Successfully", isSuccess: true})
   } catch (error : any) {
    console.error("Error fetching revenue chart data:", error);
    sendResponse(res, {message: "Error fetching revenue chart data", isSuccess: false, data: error})
   }
}

const activities = async (req : Request, res : Response) => {
    console.log("Fetching recent activities");  
    try {
        const { limit = '10' } = req.query;
        const result = await dashboardServices.activities(limit as string);
        sendResponse(res, {data:result, message: "Recent activities fetched Successfully", isSuccess: true})
   } catch (error : any) {
    console.error("Error fetching recent activities:", error);
    sendResponse(res, {message: "Error fetching recent activities", isSuccess: false, data: error})
   }    
}

export const dashboardControllers = {
    getMetrics,
    revenueChart,
    activities
}