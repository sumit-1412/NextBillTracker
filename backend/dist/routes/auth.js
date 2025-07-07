"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// POST /api/auth/login
router.post('/login', authController_1.login);
// POST /api/auth/register
router.post('/register', authController_1.register);
// GET /api/auth/me - Get current user (protected)
router.get('/me', auth_1.auth, authController_1.getCurrentUser);
exports.default = router;
