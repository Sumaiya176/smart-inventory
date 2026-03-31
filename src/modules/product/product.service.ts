import prisma from "../../prisma/client"

const createProduct = async (data : any) => {
   const { name, sku, description, categoryId, price, stockQuantity, minimumStockThreshold, status } = data;
    
    // Check if SKU exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });
    
    if (existingProduct) {
      throw new Error('SKU already exists');
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        categoryId,
        price,
        stockQuantity: stockQuantity || 0,
        minimumStockThreshold: minimumStockThreshold || 5,
        status: status || 'ACTIVE'
      },
      include: { category: true }
    });
    
    // Check if product needs restock
    if (product.stockQuantity <= product.minimumStockThreshold) {
      const priority = product.stockQuantity <= 2 ? 'HIGH' : 'MEDIUM';
      
      await prisma.restockQueueItem.upsert({
        where: { productId: product.id },
        update: {
          currentStock: product.stockQuantity,
          priority,
          resolvedAt: null
        },
        create: {
          productId: product.id,
          currentStock: product.stockQuantity,
          threshold: product.minimumStockThreshold,
          priority
        }
      });
    }
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `Product "${name}" created`,
        actionType: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: product.id,
        //userId: req.user.id,
        metadata: { sku, price, stockQuantity }
      }
    });
    return product
}
const getAllProducts = async (queries: any) => {
    const { page = 1, limit = 10, search, categoryId, status, lowStock } = queries;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (categoryId) where.categoryId = categoryId as string;
    if (status) where.status = status as string;
    if (lowStock === 'true') {
      where.stockQuantity = { lt: prisma.product.fields.minimumStockThreshold };
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

     const data = { products,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
     }
    return data
}


export const productServices  = {
    createProduct,
    getAllProducts
}