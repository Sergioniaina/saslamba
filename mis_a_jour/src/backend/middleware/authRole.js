const jwt = require('jsonwebtoken');

function authRole(role) {
  return (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}
module.exports = authRole;
