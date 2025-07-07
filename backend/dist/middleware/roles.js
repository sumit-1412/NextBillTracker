"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrCommissioner = exports.requireCommissioner = exports.requireStaff = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireStaff = (0, exports.requireRole)(['staff']);
exports.requireCommissioner = (0, exports.requireRole)(['commissioner']);
exports.requireAdminOrCommissioner = (0, exports.requireRole)(['admin', 'commissioner']);
