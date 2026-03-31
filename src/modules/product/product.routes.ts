import { Router } from "express";
import { categoryControllers } from "../category/category.controller";
import { productControllers } from "./product.controller";


const route = Router()

route.post("/create-product", productControllers.createProduct)
route.get("/products", productControllers.getAllProducts)

export const productRoute = 
    route
