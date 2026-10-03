import React, { useState } from 'react';
import { usePlants } from '../context/PlantContext';
import { PlantCard } from '../components/plants/PlantCard';
import { PlantFormModal } from '../components/plants/PlantFormModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { Plant, CareStatus, EnvironmentType } from '../types';
import { 
  Sprout, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Trash2, 
  Compass,
  CheckCircle2
} from 'lucide-react';

export const PlantsPage: React.FC = () => {
  const { 
    plants, 
    loading, 
    addPlant, 
    updatePlant, 
    deletePlantById, 
    waterPlantAction,
    loadDemoDataAction,
    clearDemoDataAction
  } = usePlants();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CareStatus>('all');
  const [envFilter, setEnvFilter] = useState<'all' | EnvironmentType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);

  // Filtered plants
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(search.toLowerCase()) ||
      plant.species.toLowerCase().includes(search.toLowerCase()) ||
      plant.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || plant.status === statusFilter;
    const matchesEnv = envFilter === 'all' || plant.environment === envFilter;

    return matchesSearch && matchesStatus && matchesEnv;
  });

  const hasDemoPlants = plants.some((p) => p.isDemo);

  const handleEditClick = (plant: Plant) => {
    setEditingPlant(plant);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingPlant) {
      await deletePlantById(deletingPlant.id);
      setDeletingPlant(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Botanical Collection
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your plants, watering intervals, environmental locations, and care statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hasDemoPlants ? (
            <button
              onClick={clearDemoDataAction}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sample Plants</span>
            </button>
          ) : (
            <button
              onClick={loadDemoDataAction}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-xl transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Plants</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingPlant(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold rounded-xl shadow-soft hover:shadow-soft-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by plant name, species, or room location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-white text-slate-700 font-medium"
          >
            <option value="all">All Care Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Care Due">Care Due</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Environment Filter */}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-white text-slate-700 font-medium"
          >
            <option value="all">All Environments</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>

          {(search || statusFilter !== 'all' || envFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setEnvFilter('all');
              }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Plant Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : filteredPlants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onWater={waterPlantAction}
              onEdit={handleEditClick}
              onDelete={(p) => setDeletingPlant(p)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-soft max-w-lg mx-auto">
          <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching plants found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Try adjusting your search criteria or add a new plant to your collection.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setEnvFilter('all');
              setEditingPlant(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-xs"
          >
            Add Plant Now
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      <PlantFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlant(null);
        }}
        initialData={editingPlant}
        title={editingPlant ? `Edit ${editingPlant.name}` : 'Add New Plant'}
        onSubmit={async (data) => {
          if (editingPlant) {
            await updatePlant({
              ...editingPlant,
              ...data,
            });
          } else {
            await addPlant(data);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingPlant)}
        title={`Delete ${deletingPlant?.name}?`}
        message="This will permanently delete this plant along with its scheduled tasks and logged care history. This action cannot be undone."
        confirmLabel="Delete Plant"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPlant(null)}
      />
    </div>
  );
};
