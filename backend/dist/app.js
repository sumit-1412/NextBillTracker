"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const wards_1 = __importDefault(require("./routes/wards"));
const properties_1 = __importDefault(require("./routes/properties"));
const deliveries_1 = __importDefault(require("./routes/deliveries"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || '';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/wards', wards_1.default);
app.use('/api/properties', properties_1.default);
app.use('/api/deliveries', deliveries_1.default);
// Root route
app.get('/', (req, res) => {
    res.send('API is running');
});
// Connect to MongoDB and start server
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
