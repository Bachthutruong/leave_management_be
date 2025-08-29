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
  body('phone').notEmpty().withMessage('Phone is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('licensePlate').notEmpty().withMessage('License plate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, name, department, licensePlate, employeeId, position, email, status, joinDate } = req.body;

    // Check if phone already exists
    const existingEmployee = await Employee.findOne({ phone });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Phone already exists' });
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const existingEmployeeId = await Employee.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'Employee ID already exists' });
      }
    }

    // Chỉ set các trường bắt buộc và các trường có giá trị
    const employeeData: any = {
      phone,
      name,
      department,
      licensePlate,
      status: status || 'active'
    };
    
    // Chỉ thêm các trường optional nếu có giá trị
    if (employeeId && employeeId.trim()) employeeData.employeeId = employeeId;
    if (position && position.trim()) employeeData.position = position;
    if (email && email.trim()) employeeData.email = email;
    if (joinDate && joinDate.trim()) employeeData.joinDate = joinDate;
    
    const employee = new Employee(employeeData);

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update employee
router.put('/:id', authAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('licensePlate').notEmpty().withMessage('License plate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, department, licensePlate, status } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if phone already exists for another employee
    const existingPhone = await Employee.findOne({ phone: req.body.phone, _id: { $ne: req.params.id } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone already exists' });
    }

    employee.name = name;
    employee.department = department;
    employee.licensePlate = licensePlate;
    if (req.body.phone) employee.phone = req.body.phone;
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
