import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaHome, FaMapMarkerAlt, FaUserCircle, FaUserTie } from 'react-icons/fa';
import TicketDetailsEngineer from '../tickets/TicketDetailsEngineer';

type Ticket = {
  id: number;
  title: string;
  description: string;
  engineer: string;
  customer: string;
  location: string;
  date: string;
  deadline?: string;
  status?: string;
  equipment?: string;
  progress?: string;
  comments?: {
    author: string;
    role: "system" | "engineer" | "customer" | "manager";
    text: string;
  }[];
};

const EngineerDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tickets'>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  useEffect(() => {
    if (activeSection === 'dashboard' || activeSection === 'tickets') {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      fetch('/api/tickets/engineer', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tickets');
          return res.json();
        })
        .then(data => {
          setTickets(Array.isArray(data.tickets) ? data.tickets : []);
          setLoading(false);
        })
        .catch(err => {
          setTickets([]);
          setError('Could not load tickets');
          setLoading(false);
          console.error('Tickets fetch error:', err);
        });
    }
  }, [activeSection]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.reload();
  };

  // Filtering logic
  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    if (filter === 'active') return ticket.progress !== 'completed' && ticket.status !== 'closed';
    if (filter === 'closed') return ticket.progress === 'completed' || ticket.status === 'closed';
    return true;
  });

  // Dummy data for details (replace with real ticket details/comments if needed)
  const getTicketDetails = (ticket: Ticket) => ({
    ...ticket,
    id: String(ticket.id),
    equipment: ticket.equipment || "Equipment Name/List",
    progress: ticket.progress || "Engineer Assigned",
    comments: ticket.comments || [
      { author: "System", role: "system", text: "Manager has updated the deadline from 10/04/2025 to 10/05/2025" },
      { author: "Engineer", role: "engineer", text: "Need new equipment." },
      { author: "Customer", role: "customer", text: "Work done." },
      { author: "Manager", role: "manager", text: "Approved." },
    ],
  });

  // Filter Buttons
  const FilterBar = (
    <div className="flex gap-2 mb-4">
      <button
        className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-[#7B8794] text-white' : 'bg-gray-300 text-black'}`}
        onClick={() => setFilter('all')}
      >All</button>
      <button
        className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-[#7B8794] text-white' : 'bg-gray-300 text-black'}`}
        onClick={() => setFilter('active')}
      >Active</button>
      <button
        className={`px-4 py-2 rounded ${filter === 'closed' ? 'bg-[#7B8794] text-white' : 'bg-gray-300 text-black'}`}
        onClick={() => setFilter('closed')}
      >Closed</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-[#7B8794] flex flex-col py-6 px-2 justify-between">
        <div>
          <button className="self-end mb-8 text-white text-2xl">&times;</button>
          <nav className="flex flex-col gap-2">
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-2 rounded ${activeSection === 'dashboard' ? 'bg-[#6B7686]' : ''} text-white font-medium`}
              onClick={() => { setActiveSection('dashboard'); setSelectedTicket(null); }}
            >
              <FaHome className="text-xl" /> Home
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-2 rounded ${activeSection === 'tickets' ? 'bg-[#6B7686]' : ''} text-white font-medium`}
              onClick={() => { setActiveSection('tickets'); setSelectedTicket(null); }}
            >
              <FaCheckCircle className="text-xl" /> Tickets
            </a>
          </nav>
        </div>
        <button
          className="mt-8 bg-[#6B7686] text-white font-semibold py-2 rounded text-lg hover:bg-[#5a6473] transition"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {selectedTicket ? (
          <TicketDetailsEngineer
            ticket={getTicketDetails(selectedTicket)}
            onEdit={() => {/* handle edit if needed */}}
          />
        ) : (
          <>
            {activeSection === 'dashboard' && (
              <>
                <header className="bg-[#7B8794] py-3 px-8">
                  <h1 className="text-center text-white text-2xl font-semibold">Home</h1>
                </header>
                <section className="flex-1 px-12 py-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
                  </div>
                  {FilterBar}
                  {loading && <div>Loading...</div>}
                  {error && <div className="text-red-500">{error}</div>}
                  <div className="flex flex-col gap-4">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-gray-200 rounded-lg px-6 py-3 shadow flex flex-col cursor-pointer hover:bg-gray-300 transition"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="font-bold text-lg text-gray-900">{ticket.title}</div>
                        <div className="text-gray-700 text-sm truncate">{ticket.description}</div>
                        <div className="flex items-center gap-6 mt-2 text-black text-sm">
                          <span className="flex items-center gap-1"><FaUserTie /> {ticket.engineer || 'Unassigned'}</span>
                          <span className="flex items-center gap-1"><FaUserCircle /> {ticket.customer}</span>
                          <span className="flex items-center gap-1"><FaMapMarkerAlt /> {ticket.location}</span>
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt />
                            {ticket.deadline
                              ? <span className="font-semibold ml-1">{new Date(ticket.deadline).toLocaleDateString()}</span>
                              : ticket.date
                                ? <span className="ml-1">{new Date(ticket.date).toLocaleDateString()}</span>
                                : null
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {activeSection === 'tickets' && (
              <section className="flex-1 px-12 py-8">
                <header className="bg-[#7B8794] py-3 px-8 rounded-t-lg mb-6">
                  <h1 className="text-center text-white text-2xl font-semibold">Tickets</h1>
                </header>
                {FilterBar}
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-500">{error}</div>}
                <div className="flex flex-col gap-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gray-200 rounded-lg px-6 py-3 shadow flex flex-col cursor-pointer hover:bg-gray-300 transition"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="font-bold text-lg text-gray-900">{ticket.title}</div>
                      <div className="text-gray-700 text-sm truncate">{ticket.description}</div>
                      <div className="flex items-center gap-6 mt-2 text-black text-sm">
                        <span className="flex items-center gap-1"><FaUserTie /> {ticket.engineer || 'Unassigned'}</span>
                        <span className="flex items-center gap-1"><FaUserCircle /> {ticket.customer}</span>
                        <span className="flex items-center gap-1"><FaMapMarkerAlt /> {ticket.location}</span>
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt />
                          {ticket.deadline
                            ? <span className="font-semibold ml-1">{new Date(ticket.deadline).toLocaleDateString()}</span>
                            : ticket.date
                              ? <span className="ml-1">{new Date(ticket.date).toLocaleDateString()}</span>
                              : null
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EngineerDashboard;
