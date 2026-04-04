import { OrderStatus } from "@prisma/client";
import prisma from "../../prisma/client"
import { BusinessRuleError, NotFoundError, ValidationError } from "../../util/error";

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

const createOrder = async (body: any, user: any) => {
  const { customerName, customerEmail, customerPhone, items, notes } = body;

  // ================================
  // 1. VALIDATION (OUTSIDE TRANSACTION)
  // ================================

  if (!items || items.length === 0) {
    throw new BusinessRuleError('At least one item is required', {
      field: 'items',
      required: true,
      minItems: 1
    });
  }

  const productIds = items.map((item: any) => item.productId);

  // Check duplicates
  if (new Set(productIds).size !== productIds.length) {
    throw new BusinessRuleError('Duplicate products found in order', {
      field: 'items',
      duplicates: productIds.filter(
        (id: string, index: number) => productIds.indexOf(id) !== index
      )
    });
  }

  // Fetch products (ONLY required fields)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      stockQuantity: true,
      status: true,
      minimumStockThreshold: true
    }
  });

  // Check missing products
  if (products.length !== productIds.length) {
    const foundIds = products.map(p => p.id);
    const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
    throw new NotFoundError(`Products not found: ${missingIds.join(', ')}`);
  }

  // Stock validation
  const stockErrors = [];
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (product!.stockQuantity < item.quantity) {
      stockErrors.push({
        productId: item.productId,
        productName: product!.name,
        requested: item.quantity,
        available: product!.stockQuantity
      });
    }
  }

  if (stockErrors.length > 0) {
    throw new BusinessRuleError('Insufficient stock', { errors: stockErrors });
  }

  // Status validation
  const inactiveProducts = products.filter(p => p.status !== 'ACTIVE');
  if (inactiveProducts.length > 0) {
    throw new BusinessRuleError('Inactive products found', {
      products: inactiveProducts.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status
      }))
    });
  }

  // ================================
  // 2. PREPARE DATA (OUTSIDE TRANSACTION)
  // ================================

  let totalAmount = 0;

  const orderItems = items.map((item: any) => {
    const product = products.find(p => p.id === item.productId)!;
    const subtotal = Number(product.price) * item.quantity;
    totalAmount += subtotal;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal
    };
  });

  // ================================
  // 3. TRANSACTION (MINIMAL & FAST)
  // ================================

  const order = await prisma.$transaction(async (tx) => {
  // 1. Create order
  const createdOrder = await tx.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      status: 'PENDING',
      notes,
      userId: user.id,
      items: {
        create: orderItems
      }
    }
  });

  // 2. Sequential updates (SAFE)
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stockQuantity: {
          decrement: item.quantity
        },
        status: 'ACTIVE' // optional, fix later outside
      }
    });
  }

  return createdOrder;
});

  // ================================
  // 4. SIDE EFFECTS (OUTSIDE TRANSACTION)
  // ================================

  // Restock queue (parallel)
  await Promise.all(
    items.map(async (item: any) => {
      const product = products.find(p => p.id === item.productId)!;
      const newStock = product.stockQuantity - item.quantity;

      if (newStock <= product.minimumStockThreshold) {
        const priority = newStock <= 2 ? 'HIGH' : 'MEDIUM';

        await prisma.restockQueueItem.upsert({
          where: { productId: item.productId },
          update: {
            currentStock: newStock,
            priority,
            resolvedAt: null
          },
          create: {
            productId: item.productId,
            currentStock: newStock,
            threshold: product.minimumStockThreshold,
            priority
          }
        });
      }
    })
  );

  // Activity log
  await prisma.activityLog.create({
    data: {
      action: `Order #${order.orderNumber} created`,
      actionType: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      userId: user.id,
      metadata: {
        totalAmount,
        itemsCount: items.length
      }
    }
  });

  return order;
};
const getAllOrders = async (queries : any) => {
    const { page = 1, limit = 10, status, startDate, endDate, search } = queries;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (status) where.status = status as string;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerEmail: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);
    
    return {
      data: orders,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
}

const updateOrderStatus = async (orderId: string, newStatus: string, user: any) => {
  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  if (!validStatuses.includes(newStatus)) {
    new ValidationError('Invalid order status', {
      field: 'Order status',
      allowedValues: validStatuses
      });
  }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    
    if (!order) {
      new NotFoundError('Order not found');
    }
    console.log("Current order status:", order?.status, "Requested new status:", newStatus);
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as OrderStatus},
      include: {
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `Order #${order?.orderNumber} status changed to ${newStatus}`,
        actionType: 'ORDER_STATUS_CHANGED',
        entityType: 'ORDER',
        entityId: order?.id as string,
        userId: user.id,
        metadata: { oldStatus: order?.status, newStatus: newStatus }
      }
    });


  return updatedOrder;
};

const cancelOrder = async (orderId: string, user: any, reason: string) => {

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });


  if (!order) {
    new NotFoundError('Order not found');
  }

  if (order?.status === 'CANCELLED') {
    throw new Error('Order is already cancelled');
  }

  if (order?.status === 'DELIVERED') {
    throw new Error('Cannot cancel delivered order');
  }


  const cancelledOrder = await prisma.$transaction(async (tx) => {
    // Restore stock (sequential + atomic)
    for (const item of order!.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity
          }
        }
      });
    }

    // Update order status
    return await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });
  });


  await prisma.activityLog.create({
    data: {
      action: `Order #${order?.orderNumber} cancelled`,
      actionType: 'ORDER_CANCELLED',
      entityType: 'ORDER',
      entityId: order!.id,
      userId: user.id,
      metadata: { reason: reason }
    }
  });

  return cancelledOrder;
}

const orderStatistics = async () => {
  const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalOrders, pendingOrders, revenue, byStatus] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      })
    ]);
    
    
    const  data = {
        totalOrders,
        pendingOrders,
        totalRevenue: revenue._sum.totalAmount || 0,
        ordersByStatus: byStatus
      }

      return data
    
}
  

export const orderServices  = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    orderStatistics
}