module.exports = async (req, res) => {
  try {
    const redis = require("./_db");
    const { code } = req.query;
    const url = await redis.get("l:" + code);
    if (!url) return res.status(404).send("Link not found");
    redis.incr("c:" + code).catch(() => {});
    res.setHeader("Cache-Control", "no-store");
    res.redirect(302, url);
  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
};
