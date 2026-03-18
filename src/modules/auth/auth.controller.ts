import { Request, Response } from "express";
import { userServices } from "./auth.service";
import { sendResponse } from "../../util/sendResponse";

const createUser = async (req : Request, res : Response) => {
    const user = {
        name: "sumaiya",
        email: "sumaiya@gmail.com",
        password: "sumaiya"
    }
    const result = await userServices.createUser(user)

    sendResponse(res, {data:result, message: "User created Successfully", isSuccess: true})
}

export const userControllers = {
    createUser
}