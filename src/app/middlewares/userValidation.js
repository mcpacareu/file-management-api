const { body, validationResult } = require("express-validator");

const createUserValidationRules = () => {
  return [
    body("username")
      .isLength({ min: 1 })
      .withMessage("Username is required")
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, dashes and underscores"
      ),
    body("email")
      .isLength({ min: 1 })
      .withMessage("Email is required")
      .bail()
      .isEmail()
      .withMessage("Email is invalid"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];
};

const loginUserValidationRules = () => {
  return [
    body("email").isEmail().withMessage("Email is invalid"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  createUserValidationRules,
  loginUserValidationRules,
  validate,
};
