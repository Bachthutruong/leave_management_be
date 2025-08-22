import express from 'express';
import { body, validationResult } from 'express-validator';
import { authAdmin, authEmployee } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';
import moment from 'moment';

const router = express.Router();

// Get all leave requests (admin)
router.get('/', authAdmin, async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;
    let filter: any = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate as string) };
      filter.endDate = { $lte: new Date(endDate as string) };
    }
    const leaveRequests = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests by employee (employee)
router.get('/my-requests', authEmployee, async (req: any, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ employeeId: req.employee.employeeId }).sort({ createdAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave request by ID
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create leave request (employee)
router.post('/', authEmployee, uploadMultiple, [
  body('leaveType').isIn(['full_day', 'half_day', 'hourly']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { leaveType, startDate, endDate, startTime, endTime, reason, halfDayType } = req.body;
    if (new Date(startDate) > new Date(endDate)) return res.status(400).json({ message: 'Start date cannot be after end date' });
    if (leaveType === 'hourly' && (!startTime || !endTime)) return res.status(400).json({ message: 'Start time and end time are required for hourly leave' });
    if (leaveType === 'half_day' && !halfDayType) return res.status(400).json({ message: 'Half day type is required' });
    const employee = await Employee.findOne({ employeeId: req.employee.employeeId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const attachments = req.files ? req.files.map((file: any) => file.filename) : [];
    const leaveRequest = new LeaveRequest({
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin create leave for any employee
router.post('/admin', authAdmin, [
  body('employeeId').notEmpty(),
  body('leaveType').isIn(['full_day', 'half_day', 'hourly']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { employeeId, leaveType, startDate, endDate, startTime, endTime, reason, halfDayType } = req.body;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const leaveRequest = new LeaveRequest({
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin update details (dates/type/reason)
router.put('/:id/details', authAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    const { leaveType, halfDayType, startDate, endDate, startTime, endTime, reason } = req.body;
    if (leaveType) leaveRequest.leaveType = leaveType;
    if (halfDayType || halfDayType === null) leaveRequest.halfDayType = halfDayType;
    if (startDate) leaveRequest.startDate = startDate;
    if (endDate) leaveRequest.endDate = endDate;
    if (startTime !== undefined) leaveRequest.startTime = startTime;
    if (endTime !== undefined) leaveRequest.endTime = endTime;
    if (reason !== undefined) leaveRequest.reason = reason;
    await leaveRequest.save();
    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update leave request status (admin)
router.put('/:id', authAdmin, [
  body('status').isIn(['pending', 'approved', 'rejected'])
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { status, rejectionReason } = req.body;
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    leaveRequest.status = status;
    leaveRequest.approvedBy = req.admin.username;
    leaveRequest.approvedAt = new Date();
    if (status === 'rejected') leaveRequest.rejectionReason = rejectionReason;
    await leaveRequest.save();
    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete leave request (admin)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    await leaveRequest.deleteOne();
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Company calendar
router.get('/calendar/company', async (req, res) => {
  try {
    const { year, month } = req.query;
    let filter: any = { status: 'approved' };
    if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      const startDate = moment(`${year}-${monthStr}-01`).startOf('month').toDate();
      const endDate = moment(`${year}-${monthStr}-01`).endOf('month').toDate();
      filter.startDate = { $lte: endDate };
      filter.endDate = { $gte: startDate };
    }
    const leaveRequests = await LeaveRequest.find(filter)
      .select('employeeName department leaveType halfDayType startDate endDate startTime endTime')
      .sort({ startDate: 1 });
    
    // Group by date
    const calendarEvents: any = {};
    leaveRequests.forEach(request => {
      const startDate = moment(request.startDate);
      const endDate = moment(request.endDate);
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Statistics summary (month/year)
router.get('/statistics/summary', authAdmin, async (req, res) => {
  try {
    const { year, month, quarter, employeeId } = req.query as any;
    let filter: any = { status: 'approved' };
    if (year && quarter) {
      const q = parseInt(quarter);
      const startMonth = (q - 1) * 3 + 1;
      const startMonthStr = String(startMonth).padStart(2, '0');
      const startDate = moment(`${year}-${startMonthStr}-01`).startOf('month').toDate();
      const endDate = moment(startDate).add(2, 'months').endOf('month').toDate();
      filter.startDate = { $lte: endDate };
      filter.endDate = { $gte: startDate };
    } else if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      const startDate = moment(`${year}-${monthStr}-01`).startOf('month').toDate();
      const endDate = moment(`${year}-${monthStr}-01`).endOf('month').toDate();
      filter.startDate = { $lte: endDate };
      filter.endDate = { $gte: startDate };
    } else if (year) {
      const startDate = moment(`${year}-01-01`).startOf('year').toDate();
      const endDate = moment(`${year}-12-31`).endOf('year').toDate();
      filter.startDate = { $lte: endDate };
      filter.endDate = { $gte: startDate };
    }
    if (employeeId) filter.employeeId = employeeId;
    const leaveRequests = await LeaveRequest.find(filter);
    const statistics = leaveRequests.reduce((acc: any, request) => {
      const empId = request.employeeId as unknown as string;
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
      const daysDiff = moment(request.endDate).diff(moment(request.startDate), 'days') + 1;
      if (request.leaveType === 'full_day') {
        acc[empId].totalDays += daysDiff;
        acc[empId].fullDays += daysDiff;
      } else if (request.leaveType === 'half_day') {
        acc[empId].totalDays += daysDiff * 0.5;
        acc[empId].halfDays += daysDiff * 0.5;
      } else if (request.leaveType === 'hourly') {
        if (request.startTime && request.endTime) {
          const hoursDiff = moment(request.endTime, 'HH:mm').diff(moment(request.startTime, 'HH:mm'), 'hours', true);
          acc[empId].totalHours += hoursDiff * daysDiff;
          acc[empId].hourlyLeaves += hoursDiff * daysDiff;
        }
      }
      return acc;
    }, {});
    res.json(Object.values(statistics));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
