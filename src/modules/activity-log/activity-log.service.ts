import prisma from "../../prisma/client";

const activities = async ( page = 1,
    limit = 20,
    actionType : any,
    entityType : any,
    startDate : any,
    endDate : any,
    search : any) => {
   

  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = {};
  
  if (actionType) where.actionType = actionType;
  if (entityType) where.entityType = entityType;
  if (search) {
    where.OR = [
      { action: { contains: search as string, mode: 'insensitive' } },
      { entityId: { contains: search as string, mode: 'insensitive' } }
    ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }
  
  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.activityLog.count({ where })
  ]);
  
 
    const data = {
      data: activities,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }

    return data

}


export const acitvityLogServices = {
    activities
}