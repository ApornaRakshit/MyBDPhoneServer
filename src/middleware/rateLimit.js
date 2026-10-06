
const buckets = new Map();

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const key = String(req.ip || req.headers["x-forwarded-for"] || "unknown")
      .split(",")[0]
      .trim();

    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

module.exports = { createRateLimiter };
