import { Router } from "express";
import { productControllers } from "./product.controller";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth";


const route = Router()

route.post("/create-product", productControllers.createProduct)
route.get("/products", productControllers.getAllProducts)
route.get("/product/:id", productControllers.getProductById)
route.put("/update-product/:id", authenticateToken, productControllers.updateProduct)
route.delete("/delete-product/:id", authenticateToken, productControllers.deleteProduct)   
route.patch('/:id/update-stock', authenticateToken, authorizeRoles(['ADMIN', 'MANAGER']), productControllers.updateStock)   

export const productRoute = 
    route
