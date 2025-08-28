"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Department_1 = __importDefault(require("../models/Department"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all departments
router.get('/', auth_1.authAdmin, async (req, res) => {
    try {
        const departments = await Department_1.default.find().sort({ name: 1 });
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get active departments only
router.get('/active', async (req, res) => {
    try {
        const departments = await Department_1.default.find({ isActive: true }).sort({ name: 1 });
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get department by ID
router.get('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const department = await Department_1.default.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(department);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Create new department
router.post('/', auth_1.authAdmin, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Department name is required'),
    (0, express_validator_1.body)('code').notEmpty().withMessage('Department code is required'),
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, code, description } = req.body;
        // Check if department name already exists
        const existingName = await Department_1.default.findOne({ name });
        if (existingName) {
            return res.status(400).json({ message: 'Department name already exists' });
        }
        // Check if department code already exists
        const existingCode = await Department_1.default.findOne({ code });
        if (existingCode) {
            return res.status(400).json({ message: 'Department code already exists' });
        }
        const department = new Department_1.default({
            name,
            code: code.toUpperCase(),
            description
        });
        await department.save();
        res.status(201).json(department);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Update department
router.put('/:id', auth_1.authAdmin, [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Department name cannot be empty'),
    (0, express_validator_1.body)('code').optional().notEmpty().withMessage('Department code cannot be empty'),
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string'),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, code, description, isActive } = req.body;
        const department = await Department_1.default.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        // Check if name already exists (excluding current department)
        if (name && name !== department.name) {
            const existingName = await Department_1.default.findOne({ name, _id: { $ne: req.params.id } });
            if (existingName) {
                return res.status(400).json({ message: 'Department name already exists' });
            }
        }
        // Check if code already exists (excluding current department)
        if (code && code !== department.code) {
            const existingCode = await Department_1.default.findOne({ code, _id: { $ne: req.params.id } });
            if (existingCode) {
                return res.status(400).json({ message: 'Department code already exists' });
            }
        }
        // Update fields
        if (name)
            department.name = name;
        if (code)
            department.code = code.toUpperCase();
        if (description !== undefined)
            department.description = description;
        if (isActive !== undefined)
            department.isActive = isActive;
        await department.save();
        res.json(department);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete department
router.delete('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const department = await Department_1.default.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        // Check if department is being used by any employees
        const Employee = require('../models/Employee').default;
        const employeesUsingDepartment = await Employee.findOne({ department: department.name });
        if (employeesUsingDepartment) {
            return res.status(400).json({
                message: 'Cannot delete department. It is being used by employees.'
            });
        }
        await Department_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Department deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=departments.js.map