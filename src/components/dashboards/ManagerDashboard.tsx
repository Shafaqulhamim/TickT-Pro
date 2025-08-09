import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaCog, FaHome, FaMapMarkerAlt, FaUserCircle, FaUserTie } from 'react-icons/fa';
import CustomerList from '../customers/CustomerList';
import TicketList from '../tickets/TicketList';
import CreateEngineerDialog from './CreateEngineerDialog';
import EngineerList from './EngineerList';
import EqipmentList from './EqipmentList';

type Ticket = {
  id: number;
  title: string;
  description: string;
  engineer: string;
  customer: string;
  location: string;
  date: string;
  deadline: string;
};

type ManagerDashboardProps = {
  onCreateTicket: () => void;
};

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onCreateTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tickets' | 'customers' | 'engineers' | 'equipment'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineerDialogOpen, setEngineerDialogOpen] = useState(false);
  

  useEffect(() => {
    if (activeSection === 'dashboard' || activeSection === 'tickets') {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      fetch('/api/tickets/active', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tickets');
          return res.json();
        })
        .then(data => {
          setTickets(data);
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
    window.location.reload(); // or navigate to login page if using react-router
  };

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
              onClick={() => setActiveSection('dashboard')}
            >
              <FaHome className="text-xl" /> Home
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-2 rounded ${activeSection === 'tickets' ? 'bg-[#6B7686]' : ''} text-white font-medium`}
              onClick={() => setActiveSection('tickets')}
            >
              <FaCheckCircle className="text-xl" /> Tickets
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-2 rounded ${activeSection === 'engineers' ? 'bg-[#6B7686]' : ''} text-white font-medium`}
              onClick={() => setActiveSection('engineers')}
            >
              <FaUserCircle className="text-xl" /> Engineers
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-2 rounded ${activeSection === 'customers' ? 'bg-[#6B7686]' : ''} text-white font-medium`}
              onClick={() => setActiveSection('customers')}
            >
              <FaUserCircle className="text-xl" /> Customers
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-2 rounded ${activeSection === 'equipment' ? 'bg-[#6B7686]' : ''} text-white font-medium`}
              onClick={() => setActiveSection('equipment')}
            >
              <FaCog className="text-xl" /> Equipements
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
        {activeSection === 'dashboard' && (
          <>
            {/* Header */}
            <header className="bg-[#7B8794] py-3 px-8">
              <h1 className="text-center text-white text-2xl font-semibold">Home</h1>
            </header>
            {/* Active Tickets Section */}
            <section className="flex-1 px-12 py-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Tickets</h2>
                <button className="text-3xl text-gray-700 font-bold" onClick={onCreateTicket}>+</button>
              </div>
              {loading && <div>Loading...</div>}
              {error && <div className="text-red-500">{error}</div>}
              <div className="flex flex-col gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-gray-200 rounded-lg px-6 py-3 shadow flex flex-col">
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
              <div className="flex justify-end mt-6">
                <button className="bg-[#7B8794] text-white text-lg font-semibold px-10 py-2 rounded">See all</button>
              </div>
            </section>
          </>
        )}
        {activeSection === 'customers' && <CustomerList/>}
        {activeSection === 'engineers' && (
          <>
            <EngineerList onCreateEngineer={() => setEngineerDialogOpen(true)} />
            <CreateEngineerDialog
              open={engineerDialogOpen}
              onClose={() => setEngineerDialogOpen(false)}
              onCreated={() => setEngineerDialogOpen(false)}
            />
          </>
        )}
        {activeSection === 'equipment' && <EqipmentList />}
        {activeSection === 'tickets' && (
          <section className="flex-1 px-12 py-8">
            <header className="bg-[#7B8794] py-3 px-8 rounded-t-lg mb-6">
              <h1 className="text-center text-white text-2xl font-semibold">Tickets</h1>
            </header>
            <TicketList tickets={tickets} loading={loading} error={error} />
          </section>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;