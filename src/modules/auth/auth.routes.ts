import { Router } from "express";
import { userControllers } from "./auth.controller";

const route = Router()

route.post("/register", userControllers.createUser)
route.post("/login", userControllers.loginUser)

export const userRoute = 
    route
