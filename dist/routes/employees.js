"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const Employee_1 = __importDefault(require("../models/Employee"));
const router = express_1.default.Router();
// Get all employees
router.get('/', auth_1.authAdmin, async (req, res) => {
    try {
        const employees = await Employee_1.default.find().sort({ createdAt: -1 });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get employee by ID
router.get('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const employee = await Employee_1.default.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Create new employee
router.post('/', auth_1.authAdmin, [
    (0, express_validator_1.body)('employeeId').notEmpty().withMessage('Employee ID is required'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('position').notEmpty().withMessage('Position is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { employeeId, name, department, position, email, phone } = req.body;
        // Check if employee ID already exists
        const existingEmployee = await Employee_1.default.findOne({ employeeId });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Employee ID already exists' });
        }
        // Check if email already exists
        const existingEmail = await Employee_1.default.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const employee = new Employee_1.default({
            employeeId,
            name,
            department,
            position,
            email,
            phone
        });
        await employee.save();
        res.status(201).json(employee);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Update employee
router.put('/:id', auth_1.authAdmin, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('position').notEmpty().withMessage('Position is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, department, position, email, phone, status } = req.body;
        const employee = await Employee_1.default.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Check if email already exists for another employee
        const existingEmail = await Employee_1.default.findOne({ email, _id: { $ne: req.params.id } });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        employee.name = name;
        employee.department = department;
        employee.position = position;
        employee.email = email;
        employee.phone = phone;
        if (status)
            employee.status = status;
        await employee.save();
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete employee
router.delete('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const employee = await Employee_1.default.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        await employee.deleteOne();
        res.json({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get employees by department
router.get('/department/:department', auth_1.authAdmin, async (req, res) => {
    try {
        const employees = await Employee_1.default.find({
            department: req.params.department,
            status: 'active'
        }).sort({ name: 1 });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=employees.js.map