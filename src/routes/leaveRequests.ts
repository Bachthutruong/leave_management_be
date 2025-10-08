import express from 'express';
import { body, validationResult } from 'express-validator';
import { authAdmin, authEmployee } from '../middleware/auth';
import { uploadMultipleToCloudinary, deleteFromCloudinary } from '../middleware/cloudinaryUpload';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';
import moment from 'moment';

const router = express.Router();

// Get all leave requests (admin)
router.get('/', authAdmin, async (req, res) => {
  try {
    const { status, phone, startDate, endDate } = req.query;
    let filter: any = {};
    if (status) filter.status = status;
    if (phone) filter.phone = phone;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate as string) };
      filter.endDate = { $lte: new Date(endDate as string) };
    }
    const leaveRequests = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Get leave requests by employee (employee)
router.get('/my-requests', authEmployee, async (req: any, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ phone: req.employee.phone }).sort({ createdAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Get leave request by ID
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    res.json(leaveRequest);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Create leave request (employee)
router.post('/', authEmployee, uploadMultipleToCloudinary, [
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
    const employee = await Employee.findOne({ phone: req.employee.phone });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    // Process Cloudinary uploads
    const attachments = req.files ? req.files.map((file: any) => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    })) : [];
    
    const leaveRequest = new LeaveRequest({
      phone: req.employee.phone,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating leave request:', errorMessage);
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Update own leave request (employee)
router.put('/my/:id', authEmployee, uploadMultipleToCloudinary, async (req: any, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    // Only owner can edit
    if (String(leaveRequest.phone) !== String(req.employee.phone)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Only allow editing when status is pending
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ được sửa đơn ở trạng thái chờ duyệt (pending).' });
    }

    const { leaveType, halfDayType, startDate, endDate, startTime, endTime, reason, replaceAttachments } = req.body;
    if (leaveType) leaveRequest.leaveType = leaveType;
    if (leaveType === 'half_day') {
      if (halfDayType !== undefined) leaveRequest.halfDayType = halfDayType;
    } else {
      leaveRequest.halfDayType = undefined;
    }
    if (startDate) leaveRequest.startDate = startDate;
    if (endDate) leaveRequest.endDate = endDate;
    if (startTime !== undefined) leaveRequest.startTime = startTime;
    if (endTime !== undefined) leaveRequest.endTime = endTime;
    if (reason !== undefined) leaveRequest.reason = reason;

    // Handle removing specific attachments if requested
    // Accept removePublicIds as JSON array or comma-separated string
    let removePublicIds: string[] = [];
    if (req.body.removePublicIds) {
      try {
        removePublicIds = Array.isArray(req.body.removePublicIds)
          ? req.body.removePublicIds
          : JSON.parse(req.body.removePublicIds);
      } catch {
        removePublicIds = String(req.body.removePublicIds).split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    if (removePublicIds.length > 0 && Array.isArray(leaveRequest.attachments)) {
      leaveRequest.attachments = leaveRequest.attachments.filter((att: any) => !removePublicIds.includes(att.publicId));
    }

    // New uploads
    const newAttachments = req.files ? req.files.map((file: any) => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    if (newAttachments.length > 0) {
      if (replaceAttachments === 'true') {
        leaveRequest.attachments = newAttachments;
      } else {
        leaveRequest.attachments = [...(leaveRequest.attachments || []), ...newAttachments];
      }
    }

    await leaveRequest.save();
    res.json(leaveRequest);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Admin create leave for any employee
router.post('/admin', authAdmin, [
  body('phone').notEmpty(),
  body('leaveType').isIn(['full_day', 'half_day', 'hourly']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { phone, leaveType, startDate, endDate, startTime, endTime, reason, halfDayType } = req.body;
    const employee = await Employee.findOne({ phone });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const leaveRequest = new LeaveRequest({
      phone,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Delete specific attachment from leave request
router.delete('/:id/attachments/:publicId', authAdmin, async (req, res) => {
  try {
    const { id, publicId } = req.params;
    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    
    // Find and remove attachment
    const attachmentIndex = leaveRequest.attachments.findIndex(att => att.publicId === publicId);
    if (attachmentIndex === -1) return res.status(404).json({ message: 'Attachment not found' });
    
    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(publicId);
            } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Error deleting file from Cloudinary:', errorMessage);
        }
    
    // Remove from database
    leaveRequest.attachments.splice(attachmentIndex, 1);
    await leaveRequest.save();
    
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error deleting attachment:', errorMessage);
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Delete leave request (admin)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    
    // Delete attachments from Cloudinary
    if (leaveRequest.attachments && leaveRequest.attachments.length > 0) {
      for (const attachment of leaveRequest.attachments) {
        try {
          await deleteFromCloudinary(attachment.publicId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Error deleting file from Cloudinary:', errorMessage);
        }
      }
    }
    
    await leaveRequest.deleteOne();
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error deleting leave request:', errorMessage);
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Company calendar (admin and department heads)
router.get('/calendar/company', authEmployee, async (req: any, res) => {
  try {
    const { year, month } = req.query as any;
    // Only admins (via admin token) or department heads (employee token with role) can view company calendar
    const isDepartmentHead = req.employee && (req.employee.role === 'department_head');
    if (!isDepartmentHead) {
      return res.status(403).json({ message: 'Forbidden: department head only' });
    }

    // Department head should see all statuses
    let filter: any = {};
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
          phone: request.phone,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Company calendar for admins
router.get('/calendar/company-admin', authAdmin, async (req, res) => {
  try {
    const { year, month } = req.query as any;
    // Admin should see all statuses
    let filter: any = {};
    if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      const startDate = moment(`${year}-${monthStr}-01`).startOf('month').toDate();
      const endDate = moment(`${year}-${monthStr}-01`).endOf('month').toDate();
      filter.startDate = { $lte: endDate };
      filter.endDate = { $gte: startDate };
    }
    const leaveRequests = await LeaveRequest.find(filter)
      .select('employeeName department leaveType halfDayType startDate endDate startTime endTime phone')
      .sort({ startDate: 1 });
    const calendarEvents: any = {};
    leaveRequests.forEach(request => {
      const startDate = moment(request.startDate);
      const endDate = moment(request.endDate);
      const daysDiff = endDate.diff(startDate, 'days');
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = startDate.clone().add(i, 'days');
        const dateStr = currentDate.format('YYYY-MM-DD');
        if (!calendarEvents[dateStr]) {
          calendarEvents[dateStr] = { date: dateStr, events: [] };
        }
        calendarEvents[dateStr].events.push({
          phone: request.phone,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Personal calendar (employee sees own requests - all statuses)
router.get('/calendar/my', authEmployee, async (req: any, res) => {
  try {
    const { year, month } = req.query as any;
    let filter: any = { phone: req.employee.phone };
    if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      const startDate = moment(`${year}-${monthStr}-01`).startOf('month').toDate();
      const endDate = moment(`${year}-${monthStr}-01`).endOf('month').toDate();
      filter.startDate = { $lte: endDate };
      filter.endDate = { $gte: startDate };
    }
    const leaveRequests = await LeaveRequest.find(filter)
      .select('employeeName department leaveType halfDayType startDate endDate startTime endTime phone')
      .sort({ startDate: 1 });
    const calendarEvents: any = {};
    leaveRequests.forEach(request => {
      const startDate = moment(request.startDate);
      const endDate = moment(request.endDate);
      const daysDiff = endDate.diff(startDate, 'days');
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = startDate.clone().add(i, 'days');
        const dateStr = currentDate.format('YYYY-MM-DD');
        if (!calendarEvents[dateStr]) {
          calendarEvents[dateStr] = { date: dateStr, events: [] };
        }
        calendarEvents[dateStr].events.push({
          phone: request.phone,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Department Head - list all leave requests (similar to admin list)
router.get('/list/company', authEmployee, async (req: any, res) => {
  try {
    if (!req.employee || req.employee.role !== 'department_head') {
      return res.status(403).json({ message: 'Forbidden: department head only' });
    }
    const { status, startDate, endDate } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate) };
      filter.endDate = { $lte: new Date(endDate) };
    }
    const leaveRequests = await LeaveRequest.find(filter).sort({ createdAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

// Statistics summary (month/year)
router.get('/statistics/summary', authAdmin, async (req, res) => {
  try {
    const { year, month, quarter, phone } = req.query as any;
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
    if (phone) filter.phone = phone;
    const leaveRequests = await LeaveRequest.find(filter);
    const statistics = leaveRequests.reduce((acc: any, request) => {
      const empPhone = request.phone as unknown as string;
      const employeeName = request.employeeName;
      const department = request.department;
      if (!acc[empPhone]) {
        acc[empPhone] = { 
          phone: empPhone, 
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
        acc[empPhone].totalDays += daysDiff;
        acc[empPhone].fullDays += daysDiff;
      } else if (request.leaveType === 'half_day') {
        acc[empPhone].totalDays += daysDiff * 0.5;
        acc[empPhone].halfDays += daysDiff * 0.5;
      } else if (request.leaveType === 'hourly') {
        if (request.startTime && request.endTime) {
          const hoursDiff = moment(request.endTime, 'HH:mm').diff(moment(request.startTime, 'HH:mm'), 'hours', true);
          acc[empPhone].totalHours += hoursDiff * daysDiff;
          acc[empPhone].hourlyLeaves += hoursDiff * daysDiff;
        }
      }
      return acc;
    }, {});
    res.json(Object.values(statistics));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

export default router;
