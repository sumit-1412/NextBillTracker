"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const deliverySchema = new mongoose_1.default.Schema({
    property: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
    },
    staff: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deliveryDate: {
        type: Date,
        default: Date.now,
    },
    dataSource: {
        type: String,
        enum: ['owner', 'family', 'tenant', 'not_found'],
        required: true,
    },
    receiverName: String,
    receiverMobile: String,
    photoUrl: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    remarks: String,
    correctionStatus: {
        type: String,
        enum: ['None', 'Pending', 'Approved', 'Rejected'],
        default: 'None',
    }
}, { timestamps: true });
const Delivery = mongoose_1.default.model('Delivery', deliverySchema);
exports.default = Delivery;
