const Redis = require('ioredis');
require('dotenv').config();

// ioredis connects automatically and handles version fallback parameters natively
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

redisClient.on('error', (err) => {
    console.error('❌ Redis engine connection failure:', err);
});

redisClient.on('connect', () => {
    console.log('🚀 Redis hot-data analytical cache operational.');
});

module.exports = redisClient;