"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Position_1 = __importDefault(require("../models/Position"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all positions
router.get('/', auth_1.authAdmin, async (req, res) => {
    try {
        const positions = await Position_1.default.find().sort({ name: 1 });
        res.json(positions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get active positions only
router.get('/active', async (req, res) => {
    try {
        const positions = await Position_1.default.find({ isActive: true }).sort({ name: 1 });
        res.json(positions);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get position by ID
router.get('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const position = await Position_1.default.findById(req.params.id);
        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }
        res.json(position);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Create new position
router.post('/', auth_1.authAdmin, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Position name is required'),
    (0, express_validator_1.body)('code').notEmpty().withMessage('Position code is required'),
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, code, description } = req.body;
        // Check if position name already exists
        const existingName = await Position_1.default.findOne({ name });
        if (existingName) {
            return res.status(400).json({ message: 'Position name already exists' });
        }
        // Check if position code already exists
        const existingCode = await Position_1.default.findOne({ code });
        if (existingCode) {
            return res.status(400).json({ message: 'Position code already exists' });
        }
        const position = new Position_1.default({
            name,
            code: code.toUpperCase(),
            description
        });
        await position.save();
        res.status(201).json(position);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Update position
router.put('/:id', auth_1.authAdmin, [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Position name cannot be empty'),
    (0, express_validator_1.body)('code').optional().notEmpty().withMessage('Position code cannot be empty'),
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string'),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, code, description, isActive } = req.body;
        const position = await Position_1.default.findById(req.params.id);
        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }
        // Check if name already exists (excluding current position)
        if (name && name !== position.name) {
            const existingName = await Position_1.default.findOne({ name, _id: { $ne: req.params.id } });
            if (existingName) {
                return res.status(400).json({ message: 'Position name already exists' });
            }
        }
        // Check if code already exists (excluding current position)
        if (code && code !== position.code) {
            const existingCode = await Position_1.default.findOne({ code, _id: { $ne: req.params.id } });
            if (existingCode) {
                return res.status(400).json({ message: 'Position code already exists' });
            }
        }
        // Update fields
        if (name)
            position.name = name;
        if (code)
            position.code = code.toUpperCase();
        if (description !== undefined)
            position.description = description;
        if (isActive !== undefined)
            position.isActive = isActive;
        await position.save();
        res.json(position);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete position
router.delete('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const position = await Position_1.default.findById(req.params.id);
        if (!position) {
            return res.status(404).json({ message: 'Position not found' });
        }
        // Check if position is being used by any employees
        const Employee = require('../models/Employee').default;
        const employeesUsingPosition = await Employee.findOne({ position: position.name });
        if (employeesUsingPosition) {
            return res.status(400).json({
                message: 'Cannot delete position. It is being used by employees.'
            });
        }
        await Position_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Position deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=positions.js.map