import { Request, Response } from "express";
import { categoryServices } from "./category.service";
import { sendResponse } from "../../util/sendResponse";
import { userServices } from "../auth/auth.service";

const createCategory = async (req : Request, res : Response) => {
    console.log("Creating category with data:", req.body); // Debug log
   try {
     const result = await categoryServices.createCategory(req.body)

    sendResponse(res, {data:result, message: "Category created Successfully", isSuccess: true})
   } catch (error : any) {
    console.error("Error creating category:", error);
    sendResponse(res, {message: "Error creating category", isSuccess: false, data: error})
   }
}
const getAllCategories = async (req : Request, res : Response) => {
    console.log("Fetching all categories"); // Debug log
    try {
        const result = await categoryServices.getAllCategories()
        sendResponse(res, {data:result, message: "Categories fetched Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error fetching categories:", error);
        sendResponse(res, {message: "Error fetching categories", isSuccess: false, data: error})
    }
}

export const categoryControllers = {
    createCategory,
    getAllCategories
}