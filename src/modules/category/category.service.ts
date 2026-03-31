import prisma from "../../prisma/client"

const createCategory = async (data : any) => {
    const { name, description } = data;
    
    if (!name) {
        throw Error("Name is required")
    }
    
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });
    
    if (existingCategory) {
         throw Error("Category already exists")
    }
    
    const category = await prisma.category.create({
      data: { name, description }
    });
     if (!category) {
        throw Error("category not created")
    }
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        action: `Category "${name}" created`,
        actionType: 'CATEGORY_CREATED',
        entityType: 'CATEGORY',
        entityId: category.id,
        //userId: req.user.id,
        metadata: { name, description }
      }
    });
    return category
}
const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: { id: true, name: true, stockQuantity: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return categories
}


export const categoryServices  = {
    createCategory,
    getAllCategories
}