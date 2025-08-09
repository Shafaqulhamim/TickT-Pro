import React, { useEffect, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';

type Product = {
  id: number;
  name: string;
  warranty_expiry: string;
};

type Customer = {
  id: number;
  name: string;
  address: string; // changed from location to address
  email: string;
  products: Product[];
};

type Equipment = {
  id: number;
  name: string;
};

const CustomerDetailsPage: React.FC<{ customerId: number; onBack: () => void }> = ({ customerId, onBack }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [warrantyExpiry, setWarrantyExpiry] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/customers/${customerId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch customer');
        return res.json();
      })
      .then(data => setCustomer(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  // Fetch equipment list for dropdown when dialog opens
  useEffect(() => {
    if (showDialog) {
      const token = localStorage.getItem('token');
      fetch('/api/equipment', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => res.json())
        .then(data => setEquipmentList(data))
        .catch(() => setEquipmentList([]));
    }
  }, [showDialog]);

  const handleAddProduct = () => {
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setSelectedEquipmentId(null);
    setWarrantyExpiry('');
  };
  const handleDeleteProduct = async (productId: number) => {
  if (!window.confirm('Are you sure you want to remove this product from the customer?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/user_equipments/${productId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to delete product');
    // Refresh customer data
    setCustomer(prev =>
      prev
        ? { ...prev, products: prev.products.filter(p => p.id !== productId) }
        : prev
    );
  } catch (err) {
    alert('Failed to delete product');
  }
};


  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId || !customer || !warrantyExpiry) return;
    const token = localStorage.getItem('token');
    const purchaseDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    try {
      const res = await fetch('/api/user_equipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: customer.id,
          equipment_id: selectedEquipmentId,
          purchase_date: purchaseDate,
          warranty_expiry: warrantyExpiry,
        }),
      });
      if (!res.ok) throw new Error('Failed to add equipment');
      setShowDialog(false);
      setSelectedEquipmentId(null);
      setWarrantyExpiry('');
      // Optionally refresh customer data here
    } catch (err) {
      alert('Failed to add equipment');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#7B8794] py-4 px-8 flex items-center justify-between">
        <span className="text-white text-2xl font-[Quicksand] font-semibold">Customers</span>
        <div>
          <button className="text-white text-2xl mr-4" onClick={onBack}>&larr; Back</button>
          <button className="text-white text-4xl font-bold">+</button>
        </div>
      </div>
      <div className="p-8 flex flex-col items-start">
        <div className="flex items-center gap-8 mb-6">
          <FaUserCircle className="text-[120px] text-black" />
          <div>
            <div className="text-2xl font-bold font-[Quicksand]">{customer?.name || 'Customer Name'}</div>
            <div className="text-gray-700">{customer?.address || 'Address'}</div>
            <div className="text-gray-700">{customer?.email || 'Email'}</div>
          </div>
        </div>
        <div className="mb-2 font-semibold">Product List</div>
        <table className="mb-8 border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-4 py-2 text-left">Product Name</th>
              <th className="border border-gray-400 px-4 py-2 text-left">Warranty Expiry</th>
            </tr>
          </thead>
          <tbody>
  {(customer?.products || []).map(product => (
    <tr key={product.id}>
      <td className="border border-gray-400 px-4 py-2">{product.name}</td>
      <td className="border border-gray-400 px-4 py-2">
        {new Date(product.warranty_expiry).toLocaleDateString('en-US')}
      </td>
      <td className="border border-gray-400 px-4 py-2">
        <button
          className="text-red-600 font-semibold hover:text-red-800"
          title="Delete"
          onClick={() => handleDeleteProduct(product.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

        </table>
        <button
          className="mx-auto bg-[#7B8794] text-white text-2xl font-[Quicksand] rounded-lg px-12 py-2 mt-2"
          onClick={handleAddProduct}
        >
          Add New Product
        </button>
      </div>

      {/* Dialog Box */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleDialogSubmit}
            className="bg-white rounded-xl p-8 shadow-lg min-w-[320px] flex flex-col gap-4"
          >
            <h2 className="text-xl font-bold mb-2">Add Product</h2>
            <label className="font-medium mb-1">Select Equipment</label>
            <select
              className="border border-gray-400 rounded px-3 py-2"
              value={selectedEquipmentId ?? ''}
              onChange={e => setSelectedEquipmentId(Number(e.target.value))}
              required
            >
              <option value="" disabled>Select equipment</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
            <label className="font-medium mb-1 mt-2">Warranty Expiry Date</label>
            <input
              type="date"
              className="border border-gray-400 rounded px-3 py-2"
              value={warrantyExpiry}
              onChange={e => setWarrantyExpiry(e.target.value)}
              required
            />
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={handleDialogClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#7B8794] text-white px-4 py-2 rounded"
                disabled={!selectedEquipmentId || !warrantyExpiry}
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailsPage;