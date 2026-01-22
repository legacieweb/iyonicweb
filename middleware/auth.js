// For testing only — use proper auth like JWT in real apps
module.exports = (req, res, next) => {
    // Example hardcoded user ID (must be a valid ObjectId)
    req.user = { id: '6431a0e17b94e805a848bd1d' };
    next();
};
