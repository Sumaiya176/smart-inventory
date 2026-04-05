
import { restockQueueService } from "./restockQueue.service";
import { sendResponse } from "../../util/sendResponse";
import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";

const getAllRestockQueueItems = async (req : AuthRequest, res : Response) => {
    try {
        const result = await restockQueueService.getAllRestockQueueItems(req.query);
        sendResponse(res,{
            isSuccess: true,
            message: 'Restock queue items retrieved successfully',
            data: result
        })
    } catch (error) {
        console.error('Error fetching restock queue items:', error);
        sendResponse(res, {
            isSuccess: false,
            message: 'Failed to retrieve restock queue items',
            data: error instanceof Error ? error.message : 'Unknown error'
        });
    }          
}

const removeFromQueue = async (req : AuthRequest, res : Response) => {
    try {
        const { itemId } = req.params;

        const result = await restockQueueService.removeFromQueue(Number(itemId), req.user);
        sendResponse(res, {
            isSuccess: true,
            message: 'Item removed from restock queue successfully',
            data: result
        });
    } catch (error) {
        console.error('Error removing item from restock queue:', error);
        sendResponse(res, {
            isSuccess: false,
            message: 'Failed to remove item from restock queue',
            data: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

const updateStockLevel = async (req : AuthRequest, res : Response) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;
        console.log('Updating stock level for productId:', productId, 'with quantity:', quantity);

        const result = await restockQueueService.updateStockLevel(productId as string, Number(quantity), req.user);
        sendResponse(res, {
            isSuccess: true,
            message: 'Stock level updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating stock level:', error);
        sendResponse(res, {
            isSuccess: false,
            message: 'Failed to update stock level',
            data: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}


const bulkRestockProducts = async (req : AuthRequest, res : Response) => {
    try {

        const result = await restockQueueService.bulkRestockProducts(req.body, req.user);
        sendResponse(res, {
            isSuccess: true,
            message: 'Products restocked successfully',
            data: result
        });
    } catch (error) {
        console.error('Error restocking products:', error);
        sendResponse(res, {
            isSuccess: false,
            message: 'Failed to restock products',
            data: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export const restockQueueControllers = {
    getAllRestockQueueItems,
    removeFromQueue,
    updateStockLevel,
    bulkRestockProducts
}