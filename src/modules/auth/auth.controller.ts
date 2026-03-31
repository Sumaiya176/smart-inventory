import { Request, Response } from "express";
import { userServices } from "./auth.service";
import { sendResponse } from "../../util/sendResponse";

const createUser = async (req : Request, res : Response) => {
    console.log("Creating user with data:", req.body); // Debug log
    const result = await userServices.createUser(req.body)

    sendResponse(res, {data:result, message: "User created Successfully", isSuccess: true})
}

export const userControllers = {
    createUser
}