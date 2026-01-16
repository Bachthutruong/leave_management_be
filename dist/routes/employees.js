"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const Employee_1 = __importDefault(require("../models/Employee"));
const multer_1 = __importDefault(require("multer"));
const xlsx = __importStar(require("xlsx"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
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
    (0, express_validator_1.body)('phone').notEmpty().withMessage('Phone is required'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('licensePlate').notEmpty().withMessage('License plate is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { phone, name, department, licensePlate, employeeId, position, email, status, joinDate, role } = req.body;
        // Check if phone already exists
        const existingEmployee = await Employee_1.default.findOne({ phone });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Phone already exists' });
        }
        // Check if employeeId already exists (if provided)
        if (employeeId) {
            const existingEmployeeId = await Employee_1.default.findOne({ employeeId });
            if (existingEmployeeId) {
                return res.status(400).json({ message: 'Employee ID already exists' });
            }
        }
        // Chỉ set các trường bắt buộc và các trường có giá trị
        const employeeData = {
            phone,
            name,
            department,
            licensePlate,
            status: status || 'active',
            role: role || 'employee'
        };
        // Chỉ thêm các trường optional nếu có giá trị
        if (employeeId && employeeId.trim())
            employeeData.employeeId = employeeId;
        if (position && position.trim())
            employeeData.position = position;
        if (email && email.trim())
            employeeData.email = email;
        if (joinDate && joinDate.trim())
            employeeData.joinDate = joinDate;
        const employee = new Employee_1.default(employeeData);
        await employee.save();
        res.status(201).json(employee);
    }
    catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Update employee
router.put('/:id', auth_1.authAdmin, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('licensePlate').notEmpty().withMessage('License plate is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, department, licensePlate, status, role } = req.body;
        const employee = await Employee_1.default.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Check if phone already exists for another employee
        const existingPhone = await Employee_1.default.findOne({ phone: req.body.phone, _id: { $ne: req.params.id } });
        if (existingPhone) {
            return res.status(400).json({ message: 'Phone already exists' });
        }
        employee.name = name;
        employee.department = department;
        employee.licensePlate = licensePlate;
        if (req.body.phone)
            employee.phone = req.body.phone;
        if (status)
            employee.status = status;
        if (role)
            employee.role = role;
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
// Import employees from Excel
router.post('/import', auth_1.authAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Get data as array of arrays to handle potential empty top rows or finding headers manually
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (!rawData || rawData.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        // Find header row
        let headerRowIndex = -1;
        let nameIdx = -1;
        let plateIdx = -1;
        let phoneIdx = -1;
        let deptIdx = -1;
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (!Array.isArray(row))
                continue;
            // Look for headers in this row
            const mappedRow = row.map(cell => String(cell).trim());
            const nIdx = mappedRow.findIndex(c => c === '姓名');
            const pIdx = mappedRow.findIndex(c => c === '車牌號碼');
            const phIdx = mappedRow.findIndex(c => c === '電話號碼' || c === '電話');
            const dIdx = mappedRow.findIndex(c => c === '部門' || c === '單位');
            if (nIdx !== -1 && pIdx !== -1) {
                headerRowIndex = i;
                nameIdx = nIdx;
                plateIdx = pIdx;
                phoneIdx = phIdx;
                deptIdx = dIdx;
                break;
            }
        }
        if (headerRowIndex === -1) {
            return res.status(400).json({
                message: 'Could not find header row. Please ensure columns "姓名", "車牌號碼" exist.'
            });
        }
        // Process data rows
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            // Skip empty rows
            if (!row || row.length === 0)
                continue;
            try {
                const name = nameIdx !== -1 ? row[nameIdx] : undefined;
                const licensePlate = plateIdx !== -1 ? row[plateIdx] : undefined;
                const phoneVal = phoneIdx !== -1 ? row[phoneIdx] : undefined;
                const phone = phoneVal ? String(phoneVal).trim() : undefined;
                const department = deptIdx !== -1 ? row[deptIdx] : undefined;
                // Skip rows that look completely empty or miss critical data
                if (!name && !licensePlate && !phone)
                    continue;
                if (!name || !licensePlate || !phone || !department) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Missing required fields. Found values - Name: ${name}, Phone: ${phone}, Dept: ${department}, Plate: ${licensePlate}`);
                    continue;
                }
                // Check if phone already exists
                const existingEmployee = await Employee_1.default.findOne({ phone });
                if (existingEmployee) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Phone ${phone} already exists`);
                    continue;
                }
                const newEmployee = new Employee_1.default({
                    name: String(name).trim(),
                    licensePlate: String(licensePlate).trim(),
                    phone,
                    department: String(department).trim(),
                    status: 'active',
                    role: 'employee'
                });
                await newEmployee.save();
                results.success++;
            }
            catch (err) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        res.json({
            message: 'Import process completed',
            results
        });
    }
    catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Server error during import' });
    }
});
exports.default = router;
//# sourceMappingURL=employees.js.map