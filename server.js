const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const spreadsheetRoutes = require('./routes/spreadsheets');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/spreadsheets', spreadsheetRoutes);

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinSpreadsheet', (spreadsheetId) => {
        socket.join(spreadsheetId);
    })

    socket.on('cellUpdate', (data) => {
        socket.to(data.spreadsheetId).emit('cellUpdated', data);
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

