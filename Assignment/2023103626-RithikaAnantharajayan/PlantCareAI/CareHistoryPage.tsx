import React, { useState } from 'react';
import { usePlants } from '../context/PlantContext';
import { History, Search, Filter, Droplet, Sprout, Calendar, Sparkles } from 'lucide-react';

export const CareHistoryPage: React.FC = () => {
  const { records, plants } = usePlants();
  const [selectedPlantId, setSelectedPlantId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredRecords = records.filter((rec) => {
    const matchesPlant = selectedPlantId === 'all' || rec.plantId === selectedPlantId;
    const matchesSearch =
      rec.plantName.toLowerCase().includes(search.toLowerCase()) ||
      rec.action.toLowerCase().includes(search.toLowerCase()) ||
      (rec.notes && rec.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesPlant && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Care History Log
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete historical audit trail of all completed watering, soil checks, pruning, and fertilization events.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search care records by plant or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-slate-50/50"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-white font-medium text-slate-700"
          >
            <option value="all">All Plants ({records.length})</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Plant</th>
                  <th className="py-3.5 px-6">Action Performed</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Notes / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                        <Sprout className="w-3.5 h-3.5" />
                      </div>
                      <span>{r.plantName}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-forest-50 text-forest-700 border border-forest-100">
                        <Droplet className="w-3 h-3 text-blue-500" />
                        <span>{r.action}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{r.date}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {r.notes || 'Routine event.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No Care Activity Logged</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed watering and care tasks will automatically be archived here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
