const BaseRepository = require("./BaseRepository");

class UserRepository extends BaseRepository {
  constructor(userModel) {
    super(userModel);
  }

  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  async findByUsername(username) {
    return await this.model.findOne({ username });
  }
}

module.exports = UserRepository;
