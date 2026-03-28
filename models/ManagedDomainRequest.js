const db = require('../config/db');

const ManagedDomainRequest = {
  async findOne(query) {
    return db('ManagedDomainRequests').where(query).first();
  },
  async find(query) {
    return db('ManagedDomainRequests').where(query);
  },
  async create(data) {
    const [request] = await db('ManagedDomainRequests').insert(data).returning('*');
    return request;
  },
  async deleteOne(query) {
    return db('ManagedDomainRequests').where(query).del();
  }
};

module.exports = ManagedDomainRequest;
