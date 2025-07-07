"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const wardSchema = new mongoose_1.default.Schema({
    corporateName: {
        type: String,
        required: true,
    },
    wardName: {
        type: String,
        required: true,
    },
    mohallas: [{
            type: String,
        }],
}, { timestamps: true });
// Ensure the combination of corporateName and wardName is unique
wardSchema.index({ corporateName: 1, wardName: 1 }, { unique: true });
const Ward = mongoose_1.default.model('Ward', wardSchema);
exports.default = Ward;
