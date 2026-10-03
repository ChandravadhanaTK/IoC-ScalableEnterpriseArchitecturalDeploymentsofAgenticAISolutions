import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Dumbbell, Filter } from 'lucide-react';
import { Exercise } from '../types';
import { exercisesApi } from '../api/client';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise
}) => {
  if (!isOpen) return null;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New exercise form
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('Chest');
  const [newEquipment, setNewEquipment] = useState('Barbell');

  const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await exercisesApi.getExercises(search, selectedMuscle);
      setExercises(res.exercises);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [search, selectedMuscle]);

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await exercisesApi.createCustom({
        name: newName.trim(),
        muscle_group: newMuscle,
        equipment: newEquipment
      });
      onSelectExercise(res.exercise);
      setIsCreating(false);
      onClose();
    } catch (err) {
      console.error('Failed to create exercise:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12141c] border border-[#262a3a] rounded-3xl w-full max-w-xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262a3a]">
          <h2 className="font-extrabold text-xl text-slate-100 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-cyan-400" />
            {isCreating ? 'Create Custom Exercise' : 'Select Exercise'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCreating ? (
          /* Custom Exercise Form */
          <form onSubmit={handleCreateCustom} className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Exercise Name
              </label>
              <input
                type="text"
                placeholder="e.g., Incline Cable Flye"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Muscle Group
                </label>
                <select
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-[#181b26]"
                >
                  {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Equipment
                </label>
                <select
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-[#181b26]"
                >
                  {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'].map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl transition shadow-glow"
              >
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          /* Exercise List View */
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search exercise by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Muscle Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {muscleGroups.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedMuscle === muscle
                      ? 'bg-cyan-500 text-black shadow-glow font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>

            {/* Custom exercise create button */}
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Create Custom Exercise
            </button>

            {/* Exercise Results */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Loading exercises...</div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No exercises found.</div>
              ) : (
                exercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      onSelectExercise(ex);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#181b26] hover:bg-[#202534] border border-slate-800 hover:border-cyan-500/40 text-left transition group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-cyan-400 text-sm transition">
                        {ex.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {ex.muscle_group} • {ex.equipment}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-500 group-hover:text-black flex items-center justify-center text-slate-300 transition">
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
