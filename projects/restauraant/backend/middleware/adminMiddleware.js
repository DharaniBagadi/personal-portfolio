/**
 * ROYAL FLAME - ADMIN AUTHORIZATION MIDDLEWARE (adminMiddleware.js)
 * Ensures user is authenticated and possesses the 'admin' role in MongoDB.
 */

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to access royal administration.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only Executive Chefs and Administrators have access to this royal portal.'
    });
  }

  next();
};

module.exports = { adminOnly };
