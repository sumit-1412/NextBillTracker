"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const propertySchema = new mongoose_1.default.Schema({
    propertyId: {
        type: String,
        required: true,
        unique: true,
    },
    ward: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Ward',
        required: true,
    },
    mohalla: {
        type: String,
        required: true,
    },
    ownerName: {
        type: String,
        required: true,
    },
    fatherName: String,
    address: {
        type: String,
        required: true,
    },
    houseNo: String,
    mobileNo: String,
    propertyType: String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
        }
    },
    deliveryStatus: {
        type: String,
        enum: ['Pending', 'Delivered', 'Not Found'],
        default: 'Pending',
    },
    lastDelivery: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Delivery',
    }
}, { timestamps: true });
const Property = mongoose_1.default.model('Property', propertySchema);
exports.default = Property;
