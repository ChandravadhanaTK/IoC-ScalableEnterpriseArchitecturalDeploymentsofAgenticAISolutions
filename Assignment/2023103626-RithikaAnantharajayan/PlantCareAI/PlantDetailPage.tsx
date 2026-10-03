import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePlants } from '../context/PlantContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlantFormModal } from '../components/plants/PlantFormModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { 
  Sprout, 
  Droplet, 
  Edit3, 
  Trash2, 
  Bot, 
  ArrowLeft, 
  MapPin, 
  Compass, 
  Calendar, 
  History, 
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';

export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plants, records, waterPlantAction, updatePlant, deletePlantById } = usePlants();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [watering, setWatering] = useState(false);
  const [waterNotes, setWaterNotes] = useState('');

  const plant = plants.find((p) => p.id === id);

  if (!plant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Plant Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">The requested botanical record does not exist or has been removed.</p>
        <Link
          to="/plants"
          className="inline-flex items-center gap-2 px-4 py-2 bg-forest-600 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Plants</span>
        </Link>
      </div>
    );
  }

  // Filter care records specifically for this plant
  const plantRecords = records.filter((r) => r.plantId === plant.id);

  const handleWater = async () => {
    try {
      setWatering(true);
      await waterPlantAction(plant, waterNotes.trim() || undefined);
      setWaterNotes('');
    } finally {
      setWatering(false);
    }
  };

  const handleDelete = async () => {
    await deletePlantById(plant.id);
    navigate('/plants');
  };

  const handleAskAI = () => {
    navigate(`/assistant?plant=${encodeURIComponent(plant.name)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Link */}
      <Link
        to="/plants"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Botanical Collection</span>
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-600 border border-forest-100 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sprout className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{plant.name}</h1>
                <StatusBadge status={plant.status} />
              </div>
              <p className="text-sm text-slate-500 italic mt-0.5">{plant.species}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
                  <Compass className="w-3 h-3 text-forest-600" />
                  <span className="capitalize">{plant.environment}</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
                  <MapPin className="w-3 h-3 text-forest-600" />
                  <span>{plant.location || 'Home'}</span>
                </span>
                {plant.isDemo && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg font-medium border border-amber-200/60">
                    Sample Data
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAskAI}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 rounded-xl border border-forest-200 transition-colors"
            >
              <Bot className="w-4 h-4 text-forest-600" />
              <span>Ask AI About This Plant</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Plant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Schedule & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <History className="w-4 h-4 text-forest-600" />
              <span>Last Watered Date</span>
            </div>
            <p className="text-base font-bold text-slate-800">{plant.lastWatered}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar className="w-4 h-4 text-forest-600" />
              <span>Next Care Date</span>
            </div>
            <p className={`text-base font-bold ${
              plant.status === 'Overdue' ? 'text-rose-600' :
              plant.status === 'Care Due' ? 'text-amber-600' : 'text-forest-700'
            }`}>
              {plant.nextWateringDate}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Clock className="w-4 h-4 text-forest-600" />
              <span>Watering Frequency</span>
            </div>
            <p className="text-base font-bold text-slate-800">Every {plant.wateringFrequency} Days</p>
          </div>
        </div>

        {/* Notes */}
        {plant.notes && (
          <div className="p-4 rounded-2xl bg-forest-50/40 border border-forest-100 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800 mb-1">
              <FileText className="w-3.5 h-3.5 text-forest-600" />
              <span>Care Instructions & Notes</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{plant.notes}</p>
          </div>
        )}

        {/* Quick Action: Mark as Watered Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-forest-50 to-emerald-50/50 border border-forest-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                <span>Mark Plant as Watered</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Automatically logs a care record, resets last-watered date to today, and recalculates future planner schedules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Optional notes..."
                value={waterNotes}
                onChange={(e) => setWaterNotes(e.target.value)}
                className="px-3 py-1.5 text-xs border border-forest-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 max-w-xs"
              />
              <button
                onClick={handleWater}
                disabled={watering}
                className="flex items-center gap-1.5 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 flex-shrink-0"
              >
                <Droplet className={`w-3.5 h-3.5 ${watering ? 'animate-bounce' : ''}`} />
                <span>{watering ? 'Recording...' : 'Record Watering'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Care Activities */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-forest-600" />
            <h2 className="text-lg font-bold text-slate-900">Care History for {plant.name}</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{plantRecords.length} records</span>
        </div>

        {plantRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Action</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 rounded-r-xl">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plantRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-forest-500"></span>
                      <span>{r.action}</span>
                    </td>
                    <td className="py-3 px-4">{r.date}</td>
                    <td className="py-3 px-4 text-slate-500">{r.notes || '�'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No past care activities recorded yet. Click "Record Watering" above to log the first care event.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <PlantFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={plant}
        title={`Edit ${plant.name}`}
        onSubmit={async (data) => {
          await updatePlant({
            ...plant,
            ...data,
          });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${plant.name}?`}
        message="Are you sure you want to delete this plant and its care schedule? This action cannot be undone."
        confirmLabel="Delete Plant"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
