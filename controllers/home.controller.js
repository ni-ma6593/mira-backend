import homeService from "../services/home.service.js";

export const getHome = async (req, res, next) => {
  try {
    const userId = req.user?._id; // اگر authOptional باشه، ممکنه undefined باشه
    const data = await homeService.getHomeData(userId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};