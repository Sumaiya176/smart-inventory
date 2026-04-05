import prisma from "../../prisma/client";
import { BusinessRuleError, NotFoundError } from "../../util/error";

const getAllRestockQueueItems = async (queries: any) => {
    const { page = 1, limit = 10, priority } = queries;
  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = { resolvedAt: null };
  if (priority) where.priority = priority;
  
  const [queueItems, total] = await Promise.all([
    prisma.restockQueueItem.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: [
        { priority: 'asc' },
        { currentStock: 'asc' }
      ]
    }),
    prisma.restockQueueItem.count({ where })
  ]);
  

    const data = {
      data: queueItems,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }

    return data
}

const removeFromQueue = async (itemId: number, user : any) => {
    const queueItem = await prisma.restockQueueItem.findUnique({
    where: { id: itemId as unknown as string}
  });
  
  if (!queueItem) {
    throw new NotFoundError('Queue item not found');
  }
  
  const result =await prisma.restockQueueItem.delete({
    where: { id: itemId as unknown as string }
  });
  
  await prisma.activityLog.create({
    data: {
      action: `Product removed from restock queue`,
      actionType: 'REMOVED_FROM_RESTOCK_QUEUE',
      entityType: 'RESTOCK_QUEUE',
      entityId: itemId as unknown as string,
      userId: user.id,
      metadata: { productId: queueItem.productId }
    }
  });

  return result
}

const updateStockLevel = async (productId: string, quantity: number, user : any) => {
    console.log('Updating stock level for productId:', productId, 'with quantity:', quantity);

    if (!productId) {
    throw new BusinessRuleError('No items selected for restock');
  }
  
  if (!quantity || quantity <= 0) {
    throw new BusinessRuleError('Invalid restock quantity');
  }
    const product = await prisma.product.findUnique({
        where: { id: productId as unknown as string }
    });

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    const newStock = product.stockQuantity + quantity;
      const newStatus = newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE';

    const result = await prisma.product.update({
        where: { id: productId as unknown as string },
        data: {
          stockQuantity: newStock,
          status: newStatus
        }
    });

    const queueItem = await prisma.restockQueueItem.findUnique({
      where: { productId: productId as unknown as string }
    });

     if (newStock > product.minimumStockThreshold) {
        await prisma.restockQueueItem.delete({
          where: { id: queueItem?.id as unknown as string }
        });
      } else {
        // Update queue item
        await prisma.restockQueueItem.update({
          where: { id: queueItem?.id as unknown as string },
          data: { currentStock: newStock }
        });
      }


       // ---------- Log single restock activity ---------
  await prisma.activityLog.create({
    data: {
      action: `Restock performed on ${product.name}, quantity added: ${quantity}`,
      actionType: 'PRODUCT_RESTOCKED',
      entityType: 'PRODUCT',
      entityId: 'bulk',
      userId: user.id,
      metadata: { products: {
        productId: product.id,
        productName: product.name,
        oldStock: product.stockQuantity,
        newStock,
        addedQuantity: quantity
      } }
    }
  });

    return result;
}

const bulkRestockProducts = async (body : { itemIds: string[], quantity: number }, user : any) => {
     const { itemIds, quantity } = body;
  
  if (!itemIds || itemIds.length === 0) {
    throw new BusinessRuleError('No items selected for restock');
  }
  
  if (!quantity || quantity <= 0) {
    throw new BusinessRuleError('Invalid restock quantity');
  }
  
  const updatedProducts = [];
  const removedIds = [];
  
  for (const itemId of itemIds) {
    const queueItem = await prisma.restockQueueItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    });
    
    if (queueItem && !queueItem.resolvedAt) {
      // Update product stock
      const newStock = queueItem.product.stockQuantity + quantity;
      const newStatus = newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE';
      
      await prisma.product.update({
        where: { id: queueItem.productId },
        data: {
          stockQuantity: newStock,
          status: newStatus
        }
      });
      
      // Remove from queue if stock is above threshold
      if (newStock > queueItem.threshold) {
        await prisma.restockQueueItem.delete({
          where: { id: itemId }
        });
        removedIds.push(itemId);
      } else {
        // Update queue item
        await prisma.restockQueueItem.update({
          where: { id: itemId },
          data: { currentStock: newStock }
        });
      }
      
      updatedProducts.push({
        productId: queueItem.productId,
        productName: queueItem.product.name,
        oldStock: queueItem.product.stockQuantity,
        newStock,
        addedQuantity: quantity
      });
    }
  }
  
  // Log bulk restock activity
  await prisma.activityLog.create({
    data: {
      action: `Bulk restock performed on ${updatedProducts.length} products`,
      actionType: 'PRODUCT_RESTOCKED',
      entityType: 'PRODUCT',
      entityId: 'bulk',
      userId: user.id,
      metadata: { products: updatedProducts, totalQuantity: quantity * updatedProducts.length }
    }
  });
  
 
    const data = {
      updatedCount: updatedProducts.length,
      removedIds,
      products: updatedProducts
    }

    return data
}

export const restockQueueService = {
    getAllRestockQueueItems,
    removeFromQueue,
    updateStockLevel,
    bulkRestockProducts
}
