import React, { useState } from 'react';
import { Plant } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Droplet, MapPin, Calendar, ArrowRight, Bot, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface PlantCardProps {
  plant: Plant;
  onWater: (plant: Plant) => Promise<void>;
  onEdit?: (plant: Plant) => void;
  onDelete?: (plant: Plant) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onWater }) => {
  const [watering, setWatering] = useState(false);
  const navigate = useNavigate();

  const handleWaterClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setWatering(true);
      await onWater(plant);
    } finally {
      setWatering(false);
    }
  };

  const handleAskAI = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/assistant?plant=${encodeURIComponent(plant.name)}`);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-200 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner & Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 group-hover:text-forest-700 transition-colors text-base line-clamp-1">
                {plant.name}
              </h3>
              {plant.isDemo && (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded">
                  Sample
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 italic mt-0.5">{plant.species}</p>
          </div>
          <StatusBadge status={plant.status} />
        </div>

        {/* Plant Metadata Pills */}
        <div className="flex flex-wrap items-center gap-2 my-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-lg">
            <Compass className="w-3 h-3 text-forest-600" />
            <span className="capitalize">{plant.environment}</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-lg">
            <MapPin className="w-3 h-3 text-forest-600" />
            <span className="truncate max-w-[120px]">{plant.location || 'Home'}</span>
          </span>
        </div>

        {/* Schedule Info Grid */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Last Watered:</span>
            <span className="font-medium text-slate-700">{plant.lastWatered}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Next Due:</span>
            <span className={`font-semibold ${
              plant.status === 'Overdue' ? 'text-rose-600' :
              plant.status === 'Care Due' ? 'text-amber-600' : 'text-forest-700'
            }`}>
              {plant.nextWateringDate}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
            <span>Cycle: Every {plant.wateringFrequency} days</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleWaterClick}
            disabled={watering}
            title="Mark as Watered"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-soft transition-all disabled:opacity-50"
          >
            <Droplet className={`w-3.5 h-3.5 ${watering ? 'animate-bounce' : ''}`} />
            <span>{watering ? 'Updating...' : 'Water'}</span>
          </button>

          <button
            onClick={handleAskAI}
            title="Ask AI about this plant"
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-forest-700 hover:bg-white rounded-xl text-xs font-medium border border-transparent hover:border-slate-200 transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-forest-600" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        <Link
          to={`/plants/${plant.id}`}
          className="flex items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-800 hover:underline"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
