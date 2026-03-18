import { Router } from "express";
import { userControllers } from "./auth.controller";

const route = Router()

route.post("/register", userControllers.createUser)

export const userRoute = 
    route
