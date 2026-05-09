import { Request, Response } from "express";
import { categoryServices } from "./category.service";
import { sendResponse } from "../../util/sendResponse";
import { userServices } from "../auth/auth.service";
import { AuthRequest } from "../../middlewares/auth";

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


const getCategoryById = async (req : AuthRequest, res : Response) => {
    const id = req.params.categoryId;
    console.log("Fetching single category", id); // Debug log
    try {
        const result = await categoryServices.getCategoryById(id as string)
        sendResponse(res, {data:result, message: "Category fetched Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error fetching category:", error);
        sendResponse(res, {message: "Error fetching category", isSuccess: false, data: error})
    }
}



export const categoryControllers = {
    createCategory,
    getAllCategories,
    getCategoryById
}