const db = require('../config/db');

const User = {
  async findOne(query) {
    return db('Users').where(query).first();
  },
  async findById(id) {
    return db('Users').where({ id }).first();
  },
  async create(data) {
    const [user] = await db('Users').insert(data).returning('*');
    return user;
  },
  async findOneAndUpdate(query, update) {
    // Mongoose findOneAndUpdate with $set logic
    const set = update.$set || update;
    const [user] = await db('Users').where(query).update(set).returning('*');
    return user;
  },
  async save(user) {
     // For cases where user object is modified and then .save() is called (Mongoose style)
     if (user.id) {
       const { id, ...data } = user;
       await db('Users').where({ id }).update(data);
     } else {
       const [newUser] = await db('Users').insert(user).returning('*');
       Object.assign(user, newUser);
     }
  }
};

module.exports = User;
