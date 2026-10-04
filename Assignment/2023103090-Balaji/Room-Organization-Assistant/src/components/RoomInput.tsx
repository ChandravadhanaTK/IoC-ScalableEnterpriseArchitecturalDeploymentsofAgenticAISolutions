import { useState } from 'react';

interface RoomInputProps {
  initialDescription: string;
  isLoading: boolean;
  onClose: () => void;
  onGenerate: (description: string) => Promise<void> | void;
}

export default function RoomInput({
  initialDescription,
  isLoading,
  onClose,
  onGenerate,
}: RoomInputProps) {
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = description.trim();

    if (!trimmed) {
      setError('Please describe the room before generating a cleanup plan.');
      return;
    }

    setError('');
    await onGenerate(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Room description</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Describe Your Room</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100">✕</button>
        </div>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={7}
          placeholder="My desk is messy, books are scattered on the floor, clothes are on my chair, and empty bottles are near my bed."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
        />

        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Generating...' : 'Generate Cleanup Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
