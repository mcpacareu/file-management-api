const {
  createUserValidationRules,
  loginUserValidationRules,
  validate,
} = require("../middlewares/userValidation");
const CreateUserDTO = require("../../domain/dtos/CreateUserDTO");

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  registerUser = [
    createUserValidationRules(),
    validate,
    async (req, res, next) => {
      try {
        const { username, email, password } = req.body;
        const userDto = new CreateUserDTO(username, email, password);
        const user = await this.userService.registerUser(userDto);
        res.status(201).json(user);
      } catch (error) {
        next(error);
      }
    },
  ];

  loginUser = [
    loginUserValidationRules(),
    validate,
    async (req, res, next) => {
      const { email, password } = req.body;

      try {
        const token = await this.userService.loginUser({ email, password });
        return res.status(200).json({ token });
      } catch (error) {
        next(error);
      }
    },
  ];

  findUserById = async (req, res, next) => {
    try {
      const user = await this.userService.findById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteUserById = async (req, res, next) => {
    try {
      const result = await this.userService.deleteById(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteUserAndFiles = async (req, res, next) => {
    try {
      await this.userService.deleteUserAndFiles(req.user.id);
      return res
        .status(200)
        .json({ message: "User data and files deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
  
  exportUserData = async (req, res, next) => {
    try {
      const archiveStream = await this.userService.exportUserData(req.user.id);
      res.attachment("user_data.zip");
      archiveStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = UserController;
