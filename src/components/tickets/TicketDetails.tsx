import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
import TicketComments from './TicketComments';

const TicketDetails: React.FC<{ ticket: any; onBack: () => void }> = ({ ticket, onBack }) => {
  const [selectedEngineer, setSelectedEngineer] = useState('');
const [currentDeadline, setCurrentDeadline] = useState(ticket.deadline);
const [editableDate, setEditableDate] = useState(ticket.deadline ? ticket.deadline.slice(0, 10) : (ticket.date ? ticket.date.slice(0, 10) : ''));
  // const [comment, setComment] = useState('');
  const [equipment, setEquipment] = useState<any>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
useEffect(() => {
  setCurrentDeadline(ticket.deadline);
  setEditableDate(ticket.deadline ? ticket.deadline.slice(0, 10) : (ticket.date ? ticket.date.slice(0, 10) : ''));
}, [ticket]);
  useEffect(() => {
    // Fetch single equipment using ticket.equipment_id
    const fetchEquipment = async () => {
      if (ticket.equipment_id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/equipment/${ticket.equipment_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setEquipment(data);
        } else {
          setEquipment(null);
        }
      }
    };
    fetchEquipment();
  }, [ticket]);

  useEffect(() => {
    // Fetch engineer list for dropdown
    const fetchEngineers = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/engineers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEngineers(data);
      } else {
        setEngineers([]);
      }
    };
    fetchEngineers();
  }, []);

  useEffect(() => {
    const fetchSpareParts = async () => {
      if (!ticket.id) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/equipment_requests?ticket_id=${ticket.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        let allParts: any[] = [];
        data.forEach((req: any) => {
          let details = req.equipment_details;
          if (typeof details === 'string') {
            try {
              const parsed = JSON.parse(details);
              if (Array.isArray(parsed)) {
                details = parsed;
              } else {
                details = [details];
              }
            } catch {
              details = [details];
            }
          } else if (details && !Array.isArray(details)) {
            details = [details];
          }
          if (Array.isArray(details)) {
            // Attach status to each part
            details = details.map((part: any) =>
              typeof part === 'object'
                ? { ...part, _status: req.status }
                : { name: part, _status: req.status }
            );
            allParts = allParts.concat(details);
          }
        });
        setSpareParts(allParts);
      } else {
        setSpareParts([]);
      }
    };
    fetchSpareParts();
  }, [ticket]);
  const handleUpdateDeadline = async () => {
  if (!editableDate) return;
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/tickets/${ticket.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deadline: editableDate }),
  });
  if (res.ok) {
    alert('Deadline updated!');
    setCurrentDeadline(editableDate); // update UI right away
  } else {
    alert('Failed to update deadline.');
  }
};
const getUSDate = (isoString: string | number | Date) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US');
};

  // Helper to check warranty
  const hasWarrantyLeft = (expiry: string) => {
    if (!expiry) return 'No';
    return new Date(expiry) > new Date() ? 'Yes' : 'No';
  };

  const handleUpdateEngineer = async () => {
  if (!selectedEngineer) return;
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/tickets/${ticket.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      engineer_id: selectedEngineer,
      progress: 'Engineer Assigned',
      status: 'active', // <-- Add this line!
    }),
  });
  if (res.ok) {
    alert('Engineer assigned and progress/status updated!');
    // Optionally, reload the ticket to update UI immediately:
    // You can refetch ticket data here if needed.
  } else {
    alert('Failed to update ticket.');
  }
};


  return (
    <div className="min-h-screen">
      <div className="flex justify-center mt-2">
        <div className="rounded-2xl p-8 max-w-4xl w-full bg-gray-300 bg-opacity-80" style={{ borderRadius: '24px' }}>
          <div className="text-2xl font-bold mb-2">{ticket.title}</div>
          <div className="mb-2 text-gray-800">{ticket.description}</div>
          <div className="flex items-center gap-6 mb-4">
            <span className="flex items-center gap-1 text-gray-700">
              <FaUserCircle /> {ticket.customer}
            </span>
            <span className="flex items-center gap-1 text-gray-700">
  <FaCalendarAlt
    className={
      currentDeadline && new Date(currentDeadline) < new Date()
        ? 'text-red-500'
        : 'text-[#7B8794]'
    }
  />
  {currentDeadline && (
    <span
      className={`font-semibold ml-2 ${
        new Date(currentDeadline) < new Date()
          ? 'text-red-500'
          : 'text-[#7B8794]'
      }`}
    >
      Deadline: {getUSDate(currentDeadline)}
    </span>
  )}
  <input
    type="date"
    className="border rounded px-2 py-1 ml-2"
    value={editableDate}
    onChange={e => setEditableDate(e.target.value)}
  />
  <button
    className="ml-2 bg-[#7B8794] text-white px-3 py-1 rounded hover:bg-[#5a6473] transition"
    onClick={handleUpdateDeadline}
    disabled={!editableDate || editableDate === (currentDeadline ? currentDeadline.slice(0, 10) : '')}
  >
    Save
  </button>
</span>


          </div>
          <table className="mb-4 border-collapse border border-gray-500">
            <thead>
              <tr>
                <th className="border border-gray-500 px-4 py-2 text-left">Product Name/List</th>
                <th className="border border-gray-500 px-4 py-2 text-left">Warranty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-500 px-4 py-2">
                  {equipment
                    ? equipment.name || equipment.product_name || 'No name'
                    : 'Equipment not found'}
                </td>
                <td className="border border-gray-500 px-4 py-2">
                  {equipment && equipment.warranty_expiry
                    ? hasWarrantyLeft(equipment.warranty_expiry)
                    : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mb-2">
            <span className="font-semibold">Progress:</span> {ticket.progress}
            {ticket.engineer_id && (
              <span className="ml-4">
                <span className="font-semibold">Assigned Engineer:</span>{' '}
                {
                  // Find engineer name from engineers list
                  engineers.find(e => e.id === ticket.engineer_id)?.name || 'N/A'
                }
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <select
              className="border border-gray-400 rounded px-3 py-2"
              value={selectedEngineer}
              onChange={e => setSelectedEngineer(e.target.value)}
            >
              <option value="">Assign Engineer: Engineer Selection</option>
              {engineers.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <button
              className="text-[#7B8794] underline font-semibold ml-2"
              onClick={handleUpdateEngineer}
            >
              Update
            </button>
            {/* <span className="ml-auto text-[#7B8794] underline font-semibold cursor-pointer">Edit</span> */}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-8">
        {/* Spare Parts Section */}
        <div className="text-xl font-semibold mb-2">Required Spare Parts</div>
        {spareParts.length > 0 ? (
          <ul className="mb-4 list-disc pl-6">
            {spareParts.map((part: any, idx: number) => (
              <li key={idx}>
                {typeof part === 'string'
                  ? part
                  : part.name || part.part_name || JSON.stringify(part)}
                {/* Show status if available */}
                {/* {part._status && (
                  <span className="ml-2 text-sm text-gray-600">(Status: {part._status})</span>
                )} */}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-4 text-gray-600">No spare parts requested.</div>
        )}
        {/* Comments Section */}
        {/* <div className="text-xl font-semibold mb-2">Comments</div> */}
        <TicketComments ticketId={ticket.id} currentUserId={Number(localStorage.getItem('userId')) || 0} />
        {/* <div className="space-y-2 mb-4">
          {(ticket.comments ?? []).map((c: any, i: number) => (
            <div key={i}>
              <span
                className={
                  c.type === 'system'
                    ? 'text-blue-700 font-semibold'
                    : c.type === 'engineer'
                    ? 'text-blue-900 font-semibold'
                    : c.type === 'customer'
                    ? 'text-blue-600 font-semibold'
                    : c.type === 'manager'
                    ? 'text-blue-800 font-semibold'
                    : ''
                }
              >
                {c.author}:
              </span>{' '}
              {c.text}
            </div>
          ))}
        </div> */}
        {/* <textarea
          className="w-full rounded-xl border border-gray-400 p-4 min-h-[60px] mb-4 bg-gray-200 bg-opacity-60"
          placeholder="Add a comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <button className="bg-[#7B8794] text-white px-8 py-2 rounded-lg text-lg font-semibold">
          Add a comment
        </button> */}
      </div>
      <button onClick={onBack} className="mb-4 text-[#7B8794] underline block mx-auto mt-6">Back</button>
    </div>
  );
};

export default TicketDetails;