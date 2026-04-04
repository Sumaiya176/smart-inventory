import { Request, Response } from "express";
import { userServices } from "./auth.service";
import { sendResponse } from "../../util/sendResponse";


const createUser = async (req : Request, res : Response) => {
    console.log("Creating user with data:", req.body); 
    try {
        const result = await userServices.createUser(req.body)

    sendResponse(res, {data:result, message: "User registered Successfully", isSuccess: true})
    } catch (error : any) {
        console.error("Error creating user:", error);
        sendResponse(res, {message: "Error creating user", isSuccess: false, data: error})
    }
}

const loginUser = async (req : Request, res : Response) => {
    console.log("Logging in user with data:", req.body);
    try {
        const result = await userServices.loginUser(req.body);
        sendResponse(res, {data: result, message: "User logged in successfully", isSuccess: true});
    } catch (error : any) {
        console.error("Error logging in user:", error);
        sendResponse(res, {message: "Error logging in user", isSuccess: false, data: error});
    }
}

export const userControllers = {
    createUser,
    loginUser
}