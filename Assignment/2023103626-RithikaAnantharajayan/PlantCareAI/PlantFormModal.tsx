import React, { useState, useEffect } from 'react';
import { Plant, EnvironmentType } from '../../types';
import { formatDate, addDays } from '../../services/plantService';
import { X, Sprout, AlertCircle } from 'lucide-react';

interface PlantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<void>;
  initialData?: Plant | null;
  title?: string;
}

export const PlantFormModal: React.FC<PlantFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Add New Plant',
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [environment, setEnvironment] = useState<EnvironmentType>('indoor');
  const [location, setLocation] = useState('');
  const [lastWatered, setLastWatered] = useState(formatDate(new Date()));
  const [wateringFrequency, setWateringFrequency] = useState(7);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSpecies(initialData.species);
      setEnvironment(initialData.environment);
      setLocation(initialData.location);
      setLastWatered(initialData.lastWatered);
      setWateringFrequency(initialData.wateringFrequency);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setSpecies('');
      setEnvironment('indoor');
      setLocation('');
      setLastWatered(formatDate(new Date()));
      setWateringFrequency(7);
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Plant name is required.');
      return;
    }
    if (!species.trim()) {
      setError('Species/type is required.');
      return;
    }
    if (wateringFrequency < 1) {
      setError('Watering frequency must be at least 1 day.');
      return;
    }

    try {
      setSubmitting(true);
      const nextWateringDate = addDays(lastWatered, wateringFrequency);

      await onSubmit({
        name: name.trim(),
        species: species.trim(),
        environment,
        location: location.trim() || 'Living Room',
        lastWatered,
        wateringFrequency: Number(wateringFrequency),
        nextWateringDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save plant. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-forest-50 text-forest-600">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Track and schedule proactive care for this plant</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plant Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Money Plant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Species / Type *
              </label>
              <input
                type="text"
                placeholder="e.g. Epipremnum aureum"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 bg-white"
              >
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Balcony, Living Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Watered Date *
              </label>
              <input
                type="date"
                value={lastWatered}
                onChange={(e) => setLastWatered(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Watering Frequency (Days) *
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={wateringFrequency}
                onChange={(e) => setWateringFrequency(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Care Notes & Tips (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Keep away from air vents; prefers indirect morning sunlight."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Plant' : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
