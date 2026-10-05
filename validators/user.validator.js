import Joi from "joi";
import AppError from "../utils/AppError.js";

// Matches the actual editable fields on the User model
// (see models/user.model.js / controllers/user.controller.js updateMe)
const updateMeSchema = Joi.object({
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().min(1).max(50),
  avatarUrl: Joi.string().uri(),
  bio: Joi.string().max(300).allow(""),
  gender: Joi.string().valid("male", "female", "other"),
  birthDate: Joi.date().iso(),
});

export const validateUpdateMe = (req, res, next) => {
  const { error } = updateMeSchema.validate(req.body, { stripUnknown: true });
  if (error) {
    return next(new AppError(error.message, 400, "VALIDATION_ERROR"));
  }
  next();
};
