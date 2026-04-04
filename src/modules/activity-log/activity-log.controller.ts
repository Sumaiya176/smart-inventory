import { AuthRequest } from "../../middlewares/auth";
import { sendResponse } from "../../util/sendResponse";
import { acitvityLogServices } from "./activity-log.service";
import { Response } from "express";

const activities = async (req: AuthRequest, res: Response) => {
     const {
    page = 1,
    limit = 20,
    actionType,
    entityType,
    startDate,
    endDate,
    search
  } = req.query;

  try {
    const result = await acitvityLogServices.activities(
      page as number,
      limit as number,
      actionType,
      entityType,
      startDate,
      endDate,
      search
    );
    sendResponse(res, { data: result, message: "Activities fetched Successfully", isSuccess: true });   
  } catch (error) {
    sendResponse(res, { message: "Error fetching activities", isSuccess: false, data: error });   

  }
}

export const activityLogControllers = {
    activities
}