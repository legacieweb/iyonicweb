const db = require('../config/db');

const CustomDomain = {
  async findOne(query) {
    return db('CustomDomains').where(query).first();
  },
  async find(query) {
    return db('CustomDomains').where(query);
  },
  async findById(id) {
    return db('CustomDomains').where({ id }).first();
  },
  async create(data) {
    const [domain] = await db('CustomDomains').insert(data).returning('*');
    return domain;
  },
  async insertMany(inserts) {
    return db('CustomDomains').insert(inserts);
  },
  async save(domain) {
    if (domain.id) {
       const { id, ...data } = domain;
       await db('CustomDomains').where({ id }).update(data);
    } else {
       const [newDomain] = await db('CustomDomains').insert(domain).returning('*');
       Object.assign(domain, newDomain);
    }
  }
};

module.exports = CustomDomain;
