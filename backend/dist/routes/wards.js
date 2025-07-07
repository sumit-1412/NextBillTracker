"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wardController_1 = require("../controllers/wardController");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../middleware/roles");
const router = express_1.default.Router();
// GET /api/wards - Get all wards (accessible by all authenticated users)
router.get('/', auth_1.auth, wardController_1.getAllWards);
// POST /api/wards - Create new ward (Admin only)
router.post('/', auth_1.auth, roles_1.requireAdmin, wardController_1.createWard);
// GET /api/wards/:id - Get ward by ID (accessible by all authenticated users)
router.get('/:id', auth_1.auth, wardController_1.getWardById);
// PUT /api/wards/:id - Update ward (Admin only)
router.put('/:id', auth_1.auth, roles_1.requireAdmin, wardController_1.updateWard);
// DELETE /api/wards/:id - Delete ward (Admin only)
router.delete('/:id', auth_1.auth, roles_1.requireAdmin, wardController_1.deleteWard);
exports.default = router;
