"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const cloudinaryUpload_1 = require("../middleware/cloudinaryUpload");
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
const Employee_1 = __importDefault(require("../models/Employee"));
const moment_1 = __importDefault(require("moment"));
const router = express_1.default.Router();
// Get all leave requests (admin)
router.get('/', auth_1.authAdmin, async (req, res) => {
    try {
        const { status, employeeId, startDate, endDate } = req.query;
        let filter = {};
        if (status)
            filter.status = status;
        if (employeeId)
            filter.employeeId = employeeId;
        if (startDate && endDate) {
            filter.startDate = { $gte: new Date(startDate) };
            filter.endDate = { $lte: new Date(endDate) };
        }
        const leaveRequests = await LeaveRequest_1.default.find(filter).sort({ createdAt: -1 });
        res.json(leaveRequests);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Get leave requests by employee (employee)
router.get('/my-requests', auth_1.authEmployee, async (req, res) => {
    try {
        const leaveRequests = await LeaveRequest_1.default.find({ employeeId: req.employee.employeeId }).sort({ createdAt: -1 });
        res.json(leaveRequests);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Get leave request by ID
router.get('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest_1.default.findById(req.params.id);
        if (!leaveRequest)
            return res.status(404).json({ message: 'Leave request not found' });
        res.json(leaveRequest);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Create leave request (employee)
router.post('/', auth_1.authEmployee, cloudinaryUpload_1.uploadMultipleToCloudinary, [
    (0, express_validator_1.body)('leaveType').isIn(['full_day', 'half_day', 'hourly']).withMessage('Invalid leave type'),
    (0, express_validator_1.body)('startDate').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('endDate').isISO8601().withMessage('Valid end date is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { leaveType, startDate, endDate, startTime, endTime, reason, halfDayType } = req.body;
        if (new Date(startDate) > new Date(endDate))
            return res.status(400).json({ message: 'Start date cannot be after end date' });
        if (leaveType === 'hourly' && (!startTime || !endTime))
            return res.status(400).json({ message: 'Start time and end time are required for hourly leave' });
        if (leaveType === 'half_day' && !halfDayType)
            return res.status(400).json({ message: 'Half day type is required' });
        const employee = await Employee_1.default.findOne({ employeeId: req.employee.employeeId });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        // Process Cloudinary uploads
        const attachments = req.files ? req.files.map((file) => ({
            url: file.path, // Cloudinary URL
            publicId: file.filename, // Cloudinary public ID
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        })) : [];
        const leaveRequest = new LeaveRequest_1.default({
            employeeId: req.employee.employeeId,
            employeeName: employee.name,
            department: employee.department,
            leaveType,
            halfDayType: leaveType === 'half_day' ? halfDayType : undefined,
            startDate,
            endDate,
            startTime: leaveType === 'hourly' ? startTime : undefined,
            endTime: leaveType === 'hourly' ? endTime : undefined,
            reason,
            attachments
        });
        await leaveRequest.save();
        res.status(201).json(leaveRequest);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error creating leave request:', errorMessage);
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Admin create leave for any employee
router.post('/admin', auth_1.authAdmin, [
    (0, express_validator_1.body)('employeeId').notEmpty(),
    (0, express_validator_1.body)('leaveType').isIn(['full_day', 'half_day', 'hourly']),
    (0, express_validator_1.body)('startDate').isISO8601(),
    (0, express_validator_1.body)('endDate').isISO8601(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { employeeId, leaveType, startDate, endDate, startTime, endTime, reason, halfDayType } = req.body;
        const employee = await Employee_1.default.findOne({ employeeId });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        const leaveRequest = new LeaveRequest_1.default({
            employeeId,
            employeeName: employee.name,
            department: employee.department,
            leaveType,
            halfDayType: leaveType === 'half_day' ? halfDayType : undefined,
            startDate,
            endDate,
            startTime: leaveType === 'hourly' ? startTime : undefined,
            endTime: leaveType === 'hourly' ? endTime : undefined,
            reason,
            attachments: []
        });
        await leaveRequest.save();
        res.status(201).json(leaveRequest);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Admin update details (dates/type/reason)
router.put('/:id/details', auth_1.authAdmin, async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest_1.default.findById(req.params.id);
        if (!leaveRequest)
            return res.status(404).json({ message: 'Leave request not found' });
        const { leaveType, halfDayType, startDate, endDate, startTime, endTime, reason } = req.body;
        if (leaveType)
            leaveRequest.leaveType = leaveType;
        if (halfDayType || halfDayType === null)
            leaveRequest.halfDayType = halfDayType;
        if (startDate)
            leaveRequest.startDate = startDate;
        if (endDate)
            leaveRequest.endDate = endDate;
        if (startTime !== undefined)
            leaveRequest.startTime = startTime;
        if (endTime !== undefined)
            leaveRequest.endTime = endTime;
        if (reason !== undefined)
            leaveRequest.reason = reason;
        await leaveRequest.save();
        res.json(leaveRequest);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Update leave request status (admin)
router.put('/:id', auth_1.authAdmin, [
    (0, express_validator_1.body)('status').isIn(['pending', 'approved', 'rejected'])
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { status, rejectionReason } = req.body;
        const leaveRequest = await LeaveRequest_1.default.findById(req.params.id);
        if (!leaveRequest)
            return res.status(404).json({ message: 'Leave request not found' });
        leaveRequest.status = status;
        leaveRequest.approvedBy = req.admin.username;
        leaveRequest.approvedAt = new Date();
        if (status === 'rejected')
            leaveRequest.rejectionReason = rejectionReason;
        await leaveRequest.save();
        res.json(leaveRequest);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Delete specific attachment from leave request
router.delete('/:id/attachments/:publicId', auth_1.authAdmin, async (req, res) => {
    try {
        const { id, publicId } = req.params;
        const leaveRequest = await LeaveRequest_1.default.findById(id);
        if (!leaveRequest)
            return res.status(404).json({ message: 'Leave request not found' });
        // Find and remove attachment
        const attachmentIndex = leaveRequest.attachments.findIndex(att => att.publicId === publicId);
        if (attachmentIndex === -1)
            return res.status(404).json({ message: 'Attachment not found' });
        // Delete from Cloudinary
        try {
            await (0, cloudinaryUpload_1.deleteFromCloudinary)(publicId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error deleting file from Cloudinary:', errorMessage);
        }
        // Remove from database
        leaveRequest.attachments.splice(attachmentIndex, 1);
        await leaveRequest.save();
        res.json({ message: 'Attachment deleted successfully' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting attachment:', errorMessage);
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Delete leave request (admin)
router.delete('/:id', auth_1.authAdmin, async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest_1.default.findById(req.params.id);
        if (!leaveRequest)
            return res.status(404).json({ message: 'Leave request not found' });
        // Delete attachments from Cloudinary
        if (leaveRequest.attachments && leaveRequest.attachments.length > 0) {
            for (const attachment of leaveRequest.attachments) {
                try {
                    await (0, cloudinaryUpload_1.deleteFromCloudinary)(attachment.publicId);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    console.error('Error deleting file from Cloudinary:', errorMessage);
                }
            }
        }
        await leaveRequest.deleteOne();
        res.json({ message: 'Leave request deleted successfully' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting leave request:', errorMessage);
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Company calendar
router.get('/calendar/company', async (req, res) => {
    try {
        const { year, month } = req.query;
        let filter = { status: 'approved' };
        if (year && month) {
            const monthStr = String(month).padStart(2, '0');
            const startDate = (0, moment_1.default)(`${year}-${monthStr}-01`).startOf('month').toDate();
            const endDate = (0, moment_1.default)(`${year}-${monthStr}-01`).endOf('month').toDate();
            filter.startDate = { $lte: endDate };
            filter.endDate = { $gte: startDate };
        }
        const leaveRequests = await LeaveRequest_1.default.find(filter)
            .select('employeeName department leaveType halfDayType startDate endDate startTime endTime')
            .sort({ startDate: 1 });
        // Group by date
        const calendarEvents = {};
        leaveRequests.forEach(request => {
            const startDate = (0, moment_1.default)(request.startDate);
            const endDate = (0, moment_1.default)(request.endDate);
            const daysDiff = endDate.diff(startDate, 'days');
            for (let i = 0; i <= daysDiff; i++) {
                const currentDate = startDate.clone().add(i, 'days');
                const dateStr = currentDate.format('YYYY-MM-DD');
                if (!calendarEvents[dateStr]) {
                    calendarEvents[dateStr] = {
                        date: dateStr,
                        events: []
                    };
                }
                calendarEvents[dateStr].events.push({
                    employeeId: request.employeeId,
                    employeeName: request.employeeName,
                    department: request.department,
                    leaveType: request.leaveType,
                    halfDayType: request.halfDayType,
                    startTime: request.startTime,
                    endTime: request.endTime
                });
            }
        });
        res.json(Object.values(calendarEvents));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
// Statistics summary (month/year)
router.get('/statistics/summary', auth_1.authAdmin, async (req, res) => {
    try {
        const { year, month, quarter, employeeId } = req.query;
        let filter = { status: 'approved' };
        if (year && quarter) {
            const q = parseInt(quarter);
            const startMonth = (q - 1) * 3 + 1;
            const startMonthStr = String(startMonth).padStart(2, '0');
            const startDate = (0, moment_1.default)(`${year}-${startMonthStr}-01`).startOf('month').toDate();
            const endDate = (0, moment_1.default)(startDate).add(2, 'months').endOf('month').toDate();
            filter.startDate = { $lte: endDate };
            filter.endDate = { $gte: startDate };
        }
        else if (year && month) {
            const monthStr = String(month).padStart(2, '0');
            const startDate = (0, moment_1.default)(`${year}-${monthStr}-01`).startOf('month').toDate();
            const endDate = (0, moment_1.default)(`${year}-${monthStr}-01`).endOf('month').toDate();
            filter.startDate = { $lte: endDate };
            filter.endDate = { $gte: startDate };
        }
        else if (year) {
            const startDate = (0, moment_1.default)(`${year}-01-01`).startOf('year').toDate();
            const endDate = (0, moment_1.default)(`${year}-12-31`).endOf('year').toDate();
            filter.startDate = { $lte: endDate };
            filter.endDate = { $gte: startDate };
        }
        if (employeeId)
            filter.employeeId = employeeId;
        const leaveRequests = await LeaveRequest_1.default.find(filter);
        const statistics = leaveRequests.reduce((acc, request) => {
            const empId = request.employeeId;
            const employeeName = request.employeeName;
            const department = request.department;
            if (!acc[empId]) {
                acc[empId] = {
                    employeeId: empId,
                    employeeName,
                    department,
                    totalDays: 0,
                    totalHours: 0,
                    fullDays: 0,
                    halfDays: 0,
                    hourlyLeaves: 0
                };
            }
            const daysDiff = (0, moment_1.default)(request.endDate).diff((0, moment_1.default)(request.startDate), 'days') + 1;
            if (request.leaveType === 'full_day') {
                acc[empId].totalDays += daysDiff;
                acc[empId].fullDays += daysDiff;
            }
            else if (request.leaveType === 'half_day') {
                acc[empId].totalDays += daysDiff * 0.5;
                acc[empId].halfDays += daysDiff * 0.5;
            }
            else if (request.leaveType === 'hourly') {
                if (request.startTime && request.endTime) {
                    const hoursDiff = (0, moment_1.default)(request.endTime, 'HH:mm').diff((0, moment_1.default)(request.startTime, 'HH:mm'), 'hours', true);
                    acc[empId].totalHours += hoursDiff * daysDiff;
                    acc[empId].hourlyLeaves += hoursDiff * daysDiff;
                }
            }
            return acc;
        }, {});
        res.json(Object.values(statistics));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: 'Server error', error: errorMessage });
    }
});
exports.default = router;
//# sourceMappingURL=leaveRequests.js.map