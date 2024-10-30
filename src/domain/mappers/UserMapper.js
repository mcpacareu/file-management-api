const User = require("../models/User");
const UserResponseDTO = require("../dtos/UserResponseDTO");

class UserMapper {
  static toEntity(createUserDTO) {
    return new User({
      username: createUserDTO.username,
      email: createUserDTO.email,
      password: createUserDTO.password,
    });
  }

  static toDTO(userEntity) {
    return new UserResponseDTO(
      userEntity._id,
      userEntity.username,
      userEntity.email
    );
  }
}

module.exports = UserMapper;
