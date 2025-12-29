const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // 1. Import http
const { Server } = require('socket.io'); // 2. Import Socket.io
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); // 3. Create HTTP server

// 4. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

// 5. Make 'io' accessible in your controllers
app.set('io', io);

// 6. Socket Connection Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Users join a room named after their Order ID for private updates
  socket.on('join_order_room', (orderId) => {
    socket.join(orderId);
    console.log(`User joined room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Food Token System API is running with WebSockets',
    timestamp: new Date().toISOString()
  });
});

// Error handling and 404s...
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// 7. IMPORTANT: Listen on 'server', not 'app'
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;