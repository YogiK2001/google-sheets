const path = require('path');
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
app.use(express.static(path.join(__dirname, '../client/build')));

const activeUsers = new Map();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinSpreadsheet', ({ spreadsheetId, userId, username }) => {
        socket.join(spreadsheetId);
        activeUsers.set(socket.id, { userId, username, spreadsheetId });
        io.to(spreadsheetId).emit('userJoined', { userId, username });
    })

    socket.on('updateCursor', ({ spreadsheetId, position }) => {
        const user = activeUsers.get(socket.id);
        if (user) {
            socket.to(spreadsheetId).emit('cursorMoved', { userId: user.userId, username: user.username, position });
        }
    });


    socket.on('cellUpdate', ({ spreadsheetId, cellId, value }) => {
        const user = activeUsers.get(socket.id);
        if (user) {
            socket.to(spreadsheetId).emit('cellUpdated', { userId: user.userId, username: user.username, cellId, value });
        }
    });

    socket.on('disconnect', () => {
        const user = activeUsers.get(socket.id);
        if (user) {
            io.to(user.spreadsheetId).emit('userLeft', { userId: user.userId, username: user.username });
            activeUsers.delete(socket.id);
        }
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
