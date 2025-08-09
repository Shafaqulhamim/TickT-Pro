import React, { useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUserCircle, FaUserTie } from 'react-icons/fa';
import TicketDetails from './TicketDetails';

type Ticket = {
  id: number;
  title: string;
  description: string;
  engineer: string;
  customer: string;
  location: string;
  date: string;
  deadline?: string;
  status?: string; // Add status
};

type TicketListProps = {
  tickets: Ticket[];
  loading?: boolean;
  error?: string | null;
};

const TicketList: React.FC<TicketListProps> = ({ tickets, loading, error }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const userRole = localStorage.getItem('role');

  // Filtering logic
  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'active') return ticket.status !== 'closed';
    if (filter === 'closed') return ticket.status === 'closed';
    return true;
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!tickets.length) return <div>No tickets found.</div>;

  if (selectedTicket) {
    return (
      <TicketDetails
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  return (
    <div>
      {/* FILTER BUTTONS */}
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-[#7B8794] text-white' : 'bg-gray-300 text-black'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-[#7B8794] text-white' : 'bg-gray-300 text-black'}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'closed' ? 'bg-[#7B8794] text-white' : 'bg-gray-300 text-black'}`}
          onClick={() => setFilter('closed')}
        >
          Closed
        </button>
      </div>
      {/* TICKET LIST */}
      <div className="flex flex-col gap-6">
        {filteredTickets.length === 0 ? (
          <div>No tickets found for this filter.</div>
        ) : (
          filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-gray-300 rounded-xl px-8 py-6 flex flex-col gap-2 cursor-pointer hover:bg-gray-400 transition"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">{ticket.title}</div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 text-gray-700">
                    <FaUserCircle /> {ticket.customer}
                  </span>
                  <span className="flex items-center gap-2 text-gray-700">
                    <FaUserTie /> {ticket.engineer}
                  </span>
                </div>
              </div>
              <div className="text-gray-700">{ticket.description}</div>
              <div className="flex items-center gap-6 mt-2">
                <span className="flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt /> {ticket.location}
                </span>
                <span className="flex items-center gap-2 text-gray-700">
                  <FaCalendarAlt />
                  {ticket.deadline ? (
                    <span
                      className={`ml-1 font-semibold ${
                        new Date(ticket.deadline) < new Date() ? 'text-red-500' : 'text-black'
                      }`}
                    >
                      {new Date(ticket.deadline).toLocaleDateString()}
                    </span>
                  ) : ticket.date ? (
                    <span className="ml-1">{new Date(ticket.date).toLocaleDateString()}</span>
                  ) : null}
                </span>
                {/* Show ticket status if you want */}
                {ticket.status && (
                  <span className="ml-2 text-sm px-3 py-1 rounded bg-gray-200 border border-gray-400">
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TicketList;
