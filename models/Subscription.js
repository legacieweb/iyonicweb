const db = require('../config/db');

const Subscription = {
  async findOne(query) {
    if (query.userId && typeof query.userId === 'string') {
      // Handle MongoDB format for userId if needed
    }
    // Handle $regex logic for domain in Subscription
    if (query.domain && query.domain.$regex) {
      const regex = query.domain.$regex.replace(/\\\./g, '.').replace(/\$/g, '');
      return db('Subscriptions').where('domain', 'ilike', `%${regex}`).first();
    }
    return db('Subscriptions').where(query).first();
  },
  async find(query) {
    return db('Subscriptions').where(query);
  },
  async findById(id) {
    return db('Subscriptions').where({ id }).first();
  },
  async create(data) {
    const [sub] = await db('Subscriptions').insert(data).returning('*');
    return sub;
  },
  async countDocuments(query) {
     // Handle $regex logic for domain
     if (query.domain && query.domain.$regex) {
       const regex = query.domain.$regex.replace(/\\\./g, '.').replace(/\$/g, '');
       return db('Subscriptions').where('domain', 'ilike', `%${regex}`).count('* as count').then(res => parseInt(res[0].count));
     }
     return db('Subscriptions').where(query).count('* as count').then(res => parseInt(res[0].count));
  },
  async save(sub) {
    if (sub.id) {
       const { id, ...data } = sub;
       await db('Subscriptions').where({ id }).update(data);
    } else {
       const [newSub] = await db('Subscriptions').insert(sub).returning('*');
       Object.assign(sub, newSub);
    }
  }
};

module.exports = Subscription;
