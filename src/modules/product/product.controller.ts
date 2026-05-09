import { Request, Response } from "express";

import { sendResponse } from "../../util/sendResponse";
import { userServices } from "../auth/auth.service";
import { productServices } from "./product.service";
import { AuthRequest } from "../../middlewares/auth";

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

const getProductById = async (req : Request, res : Response) => {
    const { id } = req.params;
    console.log(`Fetching product with ID: ${id}`); // Debug log
    try {
        const result = await productServices.getProductById(id as string)
        sendResponse(res, {data:result, message: "Product fetched Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error fetching product:", error);
        sendResponse(res, {message: "Error fetching product", isSuccess: false, data: error})
    }
}

const updateProduct = async (req : AuthRequest, res : Response) => {
    const { id } = req.params;
    console.log(`Updating product with ID: ${id} and data:`, req.body); // Debug log
    if (!req.user) {
        sendResponse(res, {message: "User not authenticated", isSuccess: false, data: null});
        return;
    }
    try {
        const result = await productServices.updateProduct(id as string, req.user.id, req.body)
        sendResponse(res, {data:result, message: "Product updated Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error updating product:", error);
        sendResponse(res, {message: "Error updating product", isSuccess: false, data: error})
    }
}

const deleteProduct = async (req : AuthRequest, res : Response) => {
    const { id } = req.params;
    console.log(`Deleting product with ID: ${id}`); // Debug log
    if (!req.user) {
        sendResponse(res, {message: "User not authenticated", isSuccess: false, data: null});
        return;
    }
    try {
        const result = await productServices.deleteProduct(id as string, req.user.id)
        sendResponse(res, {data:result, message: "Product deleted Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error deleting product:", error);
        sendResponse(res, {message: "Error deleting product", isSuccess: false, data: error})
    }
}

const updateStock = async (req : AuthRequest, res : Response) => {
    const { id } = req.params;
    const { stockQuantity } = req.body;
    console.log(`Updating stock for product with ID: ${id} to quantity: ${stockQuantity}`); // Debug log
    if (!req.user) {
        sendResponse(res, {message: "User not authenticated", isSuccess: false, data: null});
        return;
    }
    try {
        const result = await productServices.updateStock(id as string, req.user.id, stockQuantity)
        sendResponse(res, {data:result, message: "Stock updated Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error updating stock:", error);
        sendResponse(res, {message: "Error updating stock", isSuccess: false, data: error})
    }
}

export const productControllers = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock
}