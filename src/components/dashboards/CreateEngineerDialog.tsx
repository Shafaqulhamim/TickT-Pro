import React, { useState } from 'react';

type CreateEngineerDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const CreateEngineerDialog: React.FC<CreateEngineerDialogProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  // const [photo, setPhoto] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');        // NEW FIELD
  const [address, setAddress] = useState('');    // NEW FIELD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  // const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setPhoto(e.target.files[0]);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          specialization,
          email,
          password,
          role: 'engineer',
          phone,      // Pass new field
          address,    // Pass new field
          // photo: photoUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to create engineer');
      }
      setLoading(false);
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl">
        <header className="bg-[#7B8794] py-4 px-8 rounded-t-lg flex justify-center items-center">
          <h1 className="text-center text-white text-2xl font-semibold font-[Quicksand] flex-1">Engineer</h1>
          <button onClick={onClose} className="text-white text-3xl font-bold">&times;</button>
        </header>
        <form className="flex flex-col gap-4 px-8 py-8 rounded-b-lg" onSubmit={handleSubmit}>
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Engineer Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Specialization & Department"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
          />
          {/* <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          /> */}
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <input
            className="w-full bg-gray-300 rounded px-4 py-2"
            placeholder="Address"
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="mt-4 bg-[#7B8794] text-white font-[Quicksand] text-xl rounded px-8 py-2 mx-auto"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEngineerDialog;
