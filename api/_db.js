const { Redis } = require("@upstash/redis");
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (!url || !token) throw new Error("Redis env vars missing (UPSTASH_REDIS_REST_URL / TOKEN)");
module.exports = new Redis({ url, token });
