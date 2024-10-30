const BaseRepository = require("./BaseRepository");

class FileRepository extends BaseRepository {
  constructor(fileModel) {
    super(fileModel);
  }

  async findByUserId(userId) {
    return await this.model.find({ user: userId });
  }

  async deleteFilesByUser(userId) {
    return await this.model.deleteMany({ user: userId });
  }
}

module.exports = FileRepository;
