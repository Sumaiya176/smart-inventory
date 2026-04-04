import { OrderStatus } from "@prisma/client";
import prisma from "../../prisma/client"
import { BusinessRuleError, NotFoundError, ValidationError } from "../../util/error";


const getMetrics = async () => {
   const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Parallel queries for metrics
  const [
    totalOrdersToday,
    totalRevenueToday,
    pendingOrders,
    completedOrders,
    lowStockCount,
    totalProducts,
    totalOrders,
    totalCustomers,
    averageOrderValue,
    pendingOrdersCount
  ] = await Promise.all([
    // Orders today
    prisma.order.count({
      where: { createdAt: { gte: today } }
    }),

    // Revenue today
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true }
    }),

    // Pending orders
    prisma.order.count({
      where: { status: 'PENDING' }
    }),

    // Completed orders (delivered)
    prisma.order.count({
      where: { status: 'DELIVERED' }
    }),

    // Low stock products
    prisma.product.count({
      where: {
        stockQuantity: { lt: prisma.product.fields.minimumStockThreshold }
      }
    }),

    // Total products
    prisma.product.count(),

    // Total orders
    prisma.order.count(),

    // Unique customers
    prisma.order.groupBy({
      by: ['customerEmail'],
      _count: true
    }),

    // Average order value
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _avg: { totalAmount: true }
    }),

    // Orders by status
    prisma.order.groupBy({
      by: ['status'],
      _count: true
    })
  ]);

  // Process order status counts
  const statusCounts = {
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0
  };
  
  (pendingOrdersCount || []).forEach((item: any) => {
    statusCounts[item.status as keyof typeof statusCounts] = item._count;
  });

 
    const data = {
      totalOrdersToday,
      totalRevenueToday: totalRevenueToday._sum.totalAmount || 0,
      pendingOrders,
      completedOrders,
      lowStockCount,
      totalProducts,
      totalOrders,
      totalCustomers: totalCustomers.length,
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      orderStatusCounts: statusCounts
    }
 

  return data
};

const revenueChart = async (days: string) => {
  const daysNum = parseInt(days as string);
  
  const chartData = [];
  for (let i = daysNum - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const revenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        },
        status: { not: 'CANCELLED' }
      },
      _sum: { totalAmount: true }
    });
    
    const ordersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });
    
    chartData.push({
      date: date.toISOString().split('T')[0],
      revenue: revenue._sum.totalAmount || 0,
      orders: ordersCount
    });
  }
  
return chartData
}
  

const activities = async (limit: string) => {
    const activities = await prisma.activityLog.findMany({
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  return activities
}

export const dashboardServices  = {
    getMetrics,
    revenueChart,
    activities

}