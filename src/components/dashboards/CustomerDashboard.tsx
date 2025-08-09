import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../common/Header';
import TicketCard from '../tickets/TicketCard';
import CreateTicketDialog from '../tickets/CreateTicketDialog';
import { ticketsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  equipment_name: string;
  equipment_model: string;
  location_name: string;
  engineer_name?: string;
  engineer_phone?: string;
}

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tickets/customer', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    setShowCreateModal(false);
    toast.success('Ticket created successfully!');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.reload(); // or navigate to login page if using react-router
  };

  // const getStatusStats = () => {
  //   const stats = {
  //     total: tickets.length,
  //     pending: tickets.filter(t => t.status && ['pending', 'assigned'].includes(t.status.toLowerCase())).length,
  //     inProgress: tickets.filter(t => t.status && ['accepted', 'in_progress'].includes(t.status.toLowerCase())).length,
  //     completed: tickets.filter(t => t.status && ['completed', 'verified', 'resolved'].includes(t.status.toLowerCase())).length,
  //   };
  //   return stats;
  // };

  // const stats = getStatusStats();

  const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${bgColor} rounded-xl p-6 shadow-sm border border-gray-100`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Customer Dashboard" subtitle="Manage your service requests" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-24 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Log Out button in top-right */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-8 bg-[#6B7686] text-white font-semibold py-2 px-6 rounded text-lg hover:bg-[#5a6473] transition z-50"
      >
        Log Out
      </button>
      <Header 
        title="Customer Dashboard" 
        subtitle={`Welcome back, ${user?.name}! Manage your service requests here.`} 
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Tickets"
            value={stats.total}
            icon={Wrench}
            color="bg-blue-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-yellow-500"
            bgColor="bg-white"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={AlertTriangle}
            color="bg-orange-500"
            bgColor="bg-white"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="bg-green-500"
            bgColor="bg-white"
          />
        </div> */}

        {/* Action Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Service Tickets</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Create Ticket</span>
          </motion.button>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-600 mb-4">Create your first service ticket to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                userRole="customer"
                onUpdate={fetchTickets}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketDialog
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchTickets}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;