module.exports = async (req, res) => {
  try {
    if (!process.env.ADMIN_KEY) return res.status(500).json({ error: "ADMIN_KEY env var set nahi hai" });
    if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY)
      return res.status(401).json({ error: "Wrong key" });

    const redis = require("./_db");
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    if (req.method === "GET") {
      const codes = (await redis.smembers("all")) || [];
      if (!codes.length) return res.json({ links: [] });
      const urls = await redis.mget(...codes.map((c) => "l:" + c));
      const hits = await redis.mget(...codes.map((c) => "c:" + c));
      const links = codes.map((c, i) => ({
        code: c, url: urls[i], clicks: hits[i] || 0, short: `https://${host}/${c}`,
      }));
      return res.json({ links: links.reverse() });
    }

    if (req.method === "POST") {
      const { url, alias } = req.body || {};
      try {
        if (!/^https?:$/.test(new URL(url).protocol)) throw 0;
      } catch {
        return res.status(400).json({ error: "Invalid URL (https:// ke saath daalo)" });
      }
      let code = (alias || "").trim();
      if (code) {
        if (!/^[a-zA-Z0-9_-]{2,32}$/.test(code))
          return res.status(400).json({ error: "Alias: 2-32 chars, a-z 0-9 _ -" });
        if (!(await redis.set("l:" + code, url, { nx: true })))
          return res.status(409).json({ error: "Alias already taken" });
      } else {
        do { code = Math.random().toString(36).slice(2, 8); }
        while (!(await redis.set("l:" + code, url, { nx: true })));
      }
      await redis.sadd("all", code);
      return res.json({ short: `https://${host}/${code}`, code });
    }

    if (req.method === "DELETE") {
      const { code } = req.body || {};
      await redis.del("l:" + code, "c:" + code);
      await redis.srem("all", code);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
