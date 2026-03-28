const db = require('../config/db');

const Pipeline = {
  async findOne(query) {
    return db('Pipelines').where(query).first();
  },
  async find(query) {
    return db('Pipelines').where(query);
  },
  async create(data) {
    const [pipeline] = await db('Pipelines').insert(data).returning('*');
    return pipeline;
  },
  async findByIdAndUpdate(id, update, options) {
    const set = update.$set || update;
    const [pipeline] = await db('Pipelines').where({ id }).update(set).returning('*');
    return pipeline;
  },
  async findByIdAndDelete(id) {
    return db('Pipelines').where({ id }).del();
  }
};

module.exports = Pipeline;
