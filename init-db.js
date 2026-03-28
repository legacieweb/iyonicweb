const db = require('./config/db');

async function initDB() {
  try {
    console.log('Starting DB initialization...');

    // Drop tables if they exist to start fresh (optional, but good for first setup)
    // await db.schema.dropTableIfExists('ManagedDomainRequests');
    // await db.schema.dropTableIfExists('CustomDomains');
    // await db.schema.dropTableIfExists('Subscriptions');
    // await db.schema.dropTableIfExists('Pipelines');
    // await db.schema.dropTableIfExists('Users');

    // Users
    if (!(await db.schema.hasTable('Users'))) {
      await db.schema.createTable('Users', (table) => {
        table.increments('id').primary();
        table.string('name');
        table.string('email').unique().notNullable();
        table.string('password');
        table.string('phone');
        table.boolean('banned').defaultTo(false);
        table.integer('subdomainsClaimed').defaultTo(0);
      });
      console.log('Created Users table');
    }

    // Subscriptions
    if (!(await db.schema.hasTable('Subscriptions'))) {
      await db.schema.createTable('Subscriptions', (table) => {
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('Users').onDelete('CASCADE');
        table.string('siteName');
        table.string('customName');
        table.float('price');
        table.string('planType').defaultTo('monthly');
        table.string('domain');
        table.float('totalPaid').defaultTo(0);
        table.float('credit').defaultTo(0);
        table.timestamp('lastPaymentDate');
        table.timestamp('expiresAt');
        table.timestamp('createdAt').defaultTo(db.fn.now());
        table.boolean('suspended').defaultTo(false);
      });
      console.log('Created Subscriptions table');
    }

    // CustomDomains
    if (!(await db.schema.hasTable('CustomDomains'))) {
      await db.schema.createTable('CustomDomains', (table) => {
        table.increments('id').primary();
        table.integer('userId').unsigned().references('id').inTable('Users').onDelete('CASCADE');
        table.string('domain').notNullable();
        table.integer('siteId').unsigned().references('id').inTable('Subscriptions').onDelete('CASCADE');
        table.string('setup').notNullable(); // self or assisted
        table.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('Created CustomDomains table');
    }

    // Pipelines
    if (!(await db.schema.hasTable('Pipelines'))) {
      await db.schema.createTable('Pipelines', (table) => {
        table.increments('id').primary();
        table.string('businessName').notNullable();
        table.string('email');
        table.string('phone');
        table.string('secondaryPhone');
        table.string('altContact');
        table.string('status').defaultTo('Lead'); // Lead, Contacted, Proposal, In Progress, Completed
        table.text('notes');
        table.timestamp('createdAt').defaultTo(db.fn.now());
        table.timestamp('updatedAt').defaultTo(db.fn.now());
      });
      console.log('Created Pipelines table');
    }

    // ManagedDomainRequests
    if (!(await db.schema.hasTable('ManagedDomainRequests'))) {
      await db.schema.createTable('ManagedDomainRequests', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable();
        table.string('domainInterest').notNullable();
        table.timestamp('createdAt').defaultTo(db.fn.now());
      });
      console.log('Created ManagedDomainRequests table');
    }

    console.log('DB initialization completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing DB:', err);
    process.exit(1);
  }
}

initDB();
