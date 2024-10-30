class CreateUserDTO {
    constructor(username, email, password) {
      this.username = username;
      this.email = email;
      this.password = password;
    }
  }
  
  module.exports = CreateUserDTO;
  