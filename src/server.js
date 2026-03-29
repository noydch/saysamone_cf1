const dotenv = require('dotenv');
// Load env vars at the very top
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time frontend updates
const io = new Server(server, {
  cors: {
    origin: '*', // For dev, allow all
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Session support for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'cf-system-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Make io accessible to our router/controllers via req.app.get('io')
app.set('io', io);

// Socket.io connection Event
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Initialize queue worker (Disabled to avoid Redis connection errors on Render)
// const { initWorker } = require('./queues/commentQueue');
// const commentWorker = initWorker(io);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook/facebook', webhookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/comments', commentRoutes);

// Basic health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
