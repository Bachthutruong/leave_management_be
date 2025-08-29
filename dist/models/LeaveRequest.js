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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const LeaveRequestSchema = new mongoose_1.Schema({
    phone: {
        type: String,
        required: true,
        ref: 'Employee'
    },
    employeeName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    leaveType: {
        type: String,
        enum: ['full_day', 'half_day', 'hourly'],
        required: true
    },
    halfDayType: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: function () {
            return this.leaveType === 'half_day';
        }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: function () {
            return this.leaveType === 'hourly';
        }
    },
    endTime: {
        type: String,
        required: function () {
            return this.leaveType === 'hourly';
        }
    },
    reason: {
        type: String,
        trim: true
    },
    attachments: [{
            url: {
                type: String,
                required: true
            },
            publicId: {
                type: String,
                required: true
            },
            originalName: {
                type: String,
                required: true
            },
            size: {
                type: Number,
                required: true
            },
            mimetype: {
                type: String,
                required: true
            }
        }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: String
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('LeaveRequest', LeaveRequestSchema);
//# sourceMappingURL=LeaveRequest.js.map