import prisma from "../../prisma/client"

const createUser = async (data : any) => {
    const user = await prisma.user.create({data})
    if (!user) {
        throw Error("user not created")
    }
    return user
}


export const userServices  = {
    createUser
}