import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, MapPin, User, Wrench, XCircle } from 'lucide-react';
import React from 'react';

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

interface TicketCardProps {
  ticket: Ticket;
  userRole: string;
  onUpdate: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, userRole, onUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
      case 'verified':
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // const getPriorityColor = (priority: string) => {
  //   switch (priority.toLowerCase()) {
  //     case 'high':
  //       return 'bg-red-100 text-red-800';
  //     case 'medium':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'low':
  //       return 'bg-green-100 text-green-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'assigned':
        return <User className="w-4 h-4" />;
      case 'accepted':
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
      case 'verified':
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
        </div>
        <div className="ml-4 flex flex-col items-end space-y-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
            {getStatusIcon(ticket.status)}
            <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
          </span>
          {/* <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority} Priority
          </span> */}
        </div>
      </div>

      {/* Equipment Info */}
      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Wrench className="w-4 h-4" />
          <span>{ticket.equipment_name}</span>
          {ticket.equipment_model && (
            <span className="text-gray-400">({ticket.equipment_model})</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <MapPin className="w-4 h-4" />
          <span>{ticket.location_name}</span>
        </div>
      </div>

      {/* Engineer Info (if assigned) */}
      {ticket.engineer_name && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Assigned to: {ticket.engineer_name}</span>
          </div>
          {ticket.engineer_phone && (
            <p className="text-xs text-blue-700 mt-1">Phone: {ticket.engineer_phone}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Created {formatDate(ticket.created_at)}</span>
        </div>
        <div className="text-xs text-gray-400">
          #{ticket.id}
        </div>
      </div>
    </motion.div>
  );
};

export default TicketCard;