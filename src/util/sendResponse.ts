import { Response } from "express";

interface IResponse<T> {
  message: string | null;
  isSuccess: boolean | null;
  data: T | null;
}

export const sendResponse = <T>(res: Response, responseData: IResponse<T>) => {
  const { data, message, isSuccess } = responseData;
  res.status(200).json({
    isSuccess,
    message,
    data,
  });
};