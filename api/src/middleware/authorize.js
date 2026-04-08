'use strict';

const VALID_ROLES = ['supplier', 'transporter', 'customs', 'buyer', 'admin', 'port_operator', 'airline', 'warehouse'];

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

module.exports = { authorize, VALID_ROLES };
