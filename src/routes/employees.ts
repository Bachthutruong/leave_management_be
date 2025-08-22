import express from 'express';
import { body, validationResult } from 'express-validator';
import { authAdmin } from '../middleware/auth';
import Employee from '../models/Employee';

const router = express.Router();

// Get all employees
router.get('/', authAdmin, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee by ID
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new employee
router.post('/', authAdmin, [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, name, department, position, email, phone } = req.body;

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const employee = new Employee({
      employeeId,
      name,
      department,
      position,
      email,
      phone
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
router.put('/:id', authAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, department, position, email, phone, status } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if email already exists for another employee
    const existingEmail = await Employee.findOne({ email, _id: { $ne: req.params.id } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    employee.name = name;
    employee.department = department;
    employee.position = position;
    employee.email = email;
    employee.phone = phone;
    if (status) employee.status = status;

    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.deleteOne();
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employees by department
router.get('/department/:department', authAdmin, async (req, res) => {
  try {
    const employees = await Employee.find({ 
      department: req.params.department,
      status: 'active'
    }).sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
