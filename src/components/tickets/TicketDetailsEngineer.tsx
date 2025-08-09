import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaUserCog } from "react-icons/fa";
import TicketComments from './TicketComments';


type Comment = {
  author: string;
  role: "system" | "engineer" | "customer" | "manager";
  text: string;
};

type TicketDetailsEngineerProps = {
  ticket: {
    id: string;
    title: string;
    description: string;
    engineer: string;
    customer: string;
    location: string;
    date: string;
    deadline?: string;
    equipment: string;
    status?: string;
    progress: string;
    comments: Comment[];
  };
  onEdit?: () => void;
};

const roleColors: Record<string, string> = {
  system: "text-[#7B8794]",
  engineer: "text-[#7B8794]",
  customer: "text-[#7B8794]",
  manager: "text-[#7B8794]",
};

const TicketDetailsEngineer: React.FC<TicketDetailsEngineerProps> = ({ ticket, onEdit }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState("");
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [status, setStatus] = useState(ticket.status ?? 'open');
  const [progress, setProgress] = useState(ticket.progress);

  // Fetch spare parts for this ticket
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
  }, [ticket.id]);

  const handleEquipmentNeeded = () => setShowDialog(true);
  const handleDialogClose = () => {
    setShowDialog(false);
    setEquipmentDetails("");
  };
  const handleDialogSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${ticket.id}/equipment-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ equipment_details: equipmentDetails }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit equipment request');
      }
      // Optionally handle response
      setShowDialog(false);
      setEquipmentDetails("");
      // Optionally show a success message
    } catch (err) {
      alert('Failed to submit equipment request');
    }
  };

  const handleCompleted = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'closed', progress: 'completed' }),
      });
      if (!response.ok) throw new Error('Failed to update status/progress');
      setStatus('closed');
      setProgress('completed');
      alert('Ticket marked as completed!');
    } catch (err) {
      alert('Failed to mark as completed');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#7B8794] py-3 px-8">
        <h1 className="text-center text-white text-2xl font-semibold">Ticket</h1>
      </header>

      {/* Ticket Card */}
      <div className="flex flex-col items-center mt-8">
        <div className="bg-gray-200 rounded-2xl p-8 w-full max-w-4xl shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">{ticket.title}</h2>
              <p className="mb-4">{ticket.description}</p>
              <div className="flex items-center gap-4 mb-2 text-base">
                <span className="flex items-center gap-1"><FaUserCog /> {ticket.engineer}</span>
                <span className="flex items-center gap-1"><FaUser /> {ticket.customer}</span>
                <span className="flex items-center gap-1"><FaMapMarkerAlt /> {ticket.location}</span>
                <span className="flex items-center gap-1">
  <FaCalendarAlt />
  {ticket.deadline
    ? new Date(ticket.deadline).toLocaleDateString('en-US')
    : ''}
</span>
              </div>
              <div className="mb-1">Equipment: {ticket.equipment}</div>
              <div className="mb-2">Status: {status}</div>
              <div className="mb-2">Progress: {progress}</div>
            </div>
            {/* <button
              className="text-[#7B8794] text-lg underline hover:text-[#5a6473] transition"
              onClick={onEdit}
            >
              Edit
            </button> */}
          </div>
          {status !== "closed" && (
  <div className="flex gap-4 mt-4">
    <button
      className="bg-[#7B8794] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#5a6473] transition"
      onClick={handleEquipmentNeeded}
    >
      Equipment Needed
    </button>
    <button
      className="bg-[#7B8794] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#5a6473] transition"
      onClick={handleCompleted}
    >
      Completed
    </button>
  </div>
)}

        </div>
      </div>

      {/* Equipment Needed Dialog */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Request Equipment</h2>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4"
              rows={4}
              placeholder="Describe the equipment needed..."
              value={equipmentDetails}
              onChange={e => setEquipmentDetails(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleDialogClose}
              >
                Cancel
              </button>
              <button
                className="bg-[#7B8794] text-white px-4 py-2 rounded hover:bg-[#5a6473]"
                onClick={handleDialogSubmit}
                disabled={!equipmentDetails.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Required Spare Parts Section */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-xl font-semibold mb-2">Required Spare Parts</div>
        {spareParts.length > 0 ? (
          <ul className="mb-4 list-disc pl-6">
            {spareParts.map((part: any, idx: number) => (
              <li key={idx}>
                {typeof part === 'string'
                  ? part
                  : part.name || part.part_name || JSON.stringify(part)}
                {/* {part._status && (
                  <span className="ml-2 text-sm text-gray-600">(Status: {part._status})</span>
                )} */}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-4 text-gray-600">No spare parts requested.</div>
        )}
      </div>

      {/* Comments */}
      <div className="max-w-4xl mx-auto mt-8">
        <TicketComments ticketId={Number(ticket.id)} currentUserId={Number(localStorage.getItem('userId')) || 0} />
      </div>
    </div>
  );
};

export default TicketDetailsEngineer;