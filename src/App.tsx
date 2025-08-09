import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/auth/Login';
import CustomerDashboard from './components/dashboards/CustomerDashboard';
import EngineerDashboard from './components/dashboards/EngineerDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import LoadingSpinner from './components/common/LoadingSpinner';
import CreateTicketDialog from './components/tickets/CreateTicketDialog';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  const getDashboardComponent = () => {
    switch (user.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'engineer':
        return <EngineerDashboard />;
      case 'manager':
      case 'admin':
        return (
          <>
            <ManagerDashboard onCreateTicket={() => setDialogOpen(true)} />
            <CreateTicketDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
          </>
        );
      default:
        return <div className="p-8 text-center">Invalid user role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="*" element={getDashboardComponent()} />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;