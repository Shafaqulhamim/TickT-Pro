import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getDatabase } from './database/pg.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import customerRoutes from './routes/customers.js';
import engineersRoutes from './routes/engineers.js';
import equipmentRoutes from './routes/equipment.js';
import equipmentRequestsRoutes from './routes/equipment_requests.js';
import notificationRoutes from './routes/notifications.js';
import ticketRoutes from './routes/tickets.js';
import userEquipmentsRoutes from './routes/user_equipments.js';
import userRoutes from './routes/users.js';
import { setupSocketHandlers } from './sockets/handlers.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
getDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/user_equipments', userEquipmentsRoutes);
app.use('/api/engineers', authenticateToken, engineersRoutes);
app.use('/api/comments', commentRoutes);


app.use('/api/equipment_requests', authenticateToken, equipmentRequestsRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Example Express route
app.put('/api/tickets/:id/status-progress', async (req, res) => {
  const { id } = req.params;
  const { status, progress } = req.body;
  // Update ticket in DB
  // Respond with 200 OK if successful
});

// Socket.IO setup
setupSocketHandlers(io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});

export { io };

