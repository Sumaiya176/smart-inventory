import { Router } from "express";
import { categoryControllers } from "./category.controller";

const route = Router()

route.post("/create-category", categoryControllers.createCategory)
route.get("/categories", categoryControllers.getAllCategories)
route.get("/category/categoryId", categoryControllers.getCategoryById)

export const categoryRoute = 
    route
