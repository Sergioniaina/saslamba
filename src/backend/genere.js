// generateSecret.js
const fs = require('fs');
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');

fs.writeFileSync('.env', `JWT_SECRET=${secret}\n`, { flag: 'a' });
console.log('JWT_SECRET generated and stored in .env file');
