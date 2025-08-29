"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const Admin_1 = __importDefault(require("../models/Admin"));
const Employee_1 = __importDefault(require("../models/Employee"));
const router = express_1.default.Router();
// Admin login
router.post('/admin/login', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password } = req.body;
        const admin = await Admin_1.default.findOne({ username, isActive: true });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        const token = jsonwebtoken_1.default.sign({ id: admin._id, username: admin.username, role: admin.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
        res.json({
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Employee authentication by phone
router.post('/employee/auth', [
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { phone } = req.body;
        const employee = await Employee_1.default.findOne({ phone, status: 'active' });
        if (!employee) {
            return res.status(404).json({ message: 'Số điện thoại không tồn tại' });
        }
        const token = jsonwebtoken_1.default.sign({
            id: employee._id,
            phone: employee.phone,
            name: employee.name,
            department: employee.department
        }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
        res.json({
            token,
            employee: {
                id: employee._id,
                phone: employee.phone,
                name: employee.name,
                department: employee.department,
                licensePlate: employee.licensePlate
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map