import React, { useEffect, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import CreateCustomerDialog from './CreateCustomerDialog';
import CustomerDetailsPage from './CustomerDetailsPage';

type Customer = {
  id: number;
  name: string;
  location?: string;
  equipmentList?: string;
};

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Fetch customers function with defensive assignment
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users?role=customer', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line
  }, []);

  // Refresh customers after creating a new one
  const handleCreated = () => {
    setDialogOpen(false);
    fetchCustomers();
  };

  // If a customer is selected, show the details page
  if (selectedCustomerId !== null) {
    return (
      <CustomerDetailsPage
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-[#7B8794] py-3 px-8 flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">Customers</h1>
        <button
          className="text-white text-3xl font-bold"
          onClick={() => setDialogOpen(true)}
        >
          +
        </button>
      </header>
      {loading && <div className="p-4">Loading...</div>}
      {error && <div className="p-4 text-red-500">{error}</div>}
      <div className="flex flex-col gap-6 px-12 py-8">
        {(Array.isArray(customers) ? customers : []).map((customer) => (
          <div
            key={customer.id}
            className="flex items-center bg-gray-300 rounded-xl px-8 py-4 gap-6 max-w-4xl cursor-pointer hover:bg-gray-400 transition"
            onClick={() => setSelectedCustomerId(customer.id)}
          >
            <FaUserCircle className="text-6xl text-black" />
            <div>
              <div className="font-bold text-xl text-black">{customer.name}</div>
              <div className="text-black text-base">{customer.location || 'Location'}</div>
              <div className="text-black text-base">{customer.equipmentList || 'Equipment List'}</div>
            </div>
          </div>
        ))}
      </div>
      <CreateCustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default CustomerList;
