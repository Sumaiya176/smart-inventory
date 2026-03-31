import { Request, Response } from "express";

import { sendResponse } from "../../util/sendResponse";
import { userServices } from "../auth/auth.service";
import { productServices } from "./product.service";

const createProduct = async (req : Request, res : Response) => {
    console.log("Creating product with data:", req.body); // Debug log
   try {
     const result = await productServices.createProduct(req.body)

    sendResponse(res, {data:result, message: "Product created Successfully", isSuccess: true})
   } catch (error : any) {
    console.error("Error creating product:", error);
    sendResponse(res, {message: "Error creating product", isSuccess: false, data: error})
   }
}
const getAllProducts = async (req : Request, res : Response) => {
    console.log("Fetching all products"); // Debug log
    try {
        const result = await productServices.getAllProducts(req.query)
        sendResponse(res, {data:result, message: "Products fetched Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error fetching products:", error);
        sendResponse(res, {message: "Error fetching products", isSuccess: false, data: error})
    }
}

export const productControllers = {
    createProduct,
    getAllProducts
}