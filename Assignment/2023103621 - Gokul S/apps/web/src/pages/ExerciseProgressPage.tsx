import React, { useState, useEffect } from 'react';
import { TrendingUp, Dumbbell, Trophy, Award, BarChart2 } from 'lucide-react';
import { exercisesApi } from '../api/client';
import { Exercise } from '../types';
import { formatWeight, displayWeightNum } from '../utils/units';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { format } from 'date-fns';

export const ExerciseProgressPage: React.FC = () => {
  const { user } = useAuth();
  const unit = user?.unit_preference || 'kg';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'max_weight' | 'volume' | 'e1rm'>('max_weight');

  // Load exercise list
  useEffect(() => {
    const fetchEx = async () => {
      try {
        const res = await exercisesApi.getExercises();
        setExercises(res.exercises);
        if (res.exercises.length > 0) {
          setSelectedExerciseId(res.exercises[0].id);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    };
    fetchEx();
  }, []);

  // Fetch history for selected exercise
  useEffect(() => {
    if (!selectedExerciseId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await exercisesApi.getHistory(selectedExerciseId);
        setHistoryData(res.history || []);
        setExerciseDetail(res.exercise || null);
      } catch (err) {
        console.error('Failed to fetch progress history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedExerciseId]);

  // Format and aggregate Chart Data points chronologically by unique calendar date
  const aggregatedMap: Record<string, { date: string; max_weight_kg: number; total_volume_kg: number; estimated_1rm_kg: number; count: number }> = {};

  // Sort history chronologically (oldest to newest)
  const sortedHistory = [...historyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedHistory.forEach((item) => {
    const dateKey = format(new Date(item.date), 'MMM d, yyyy');
    const displayLabel = format(new Date(item.date), 'MMM d');

    if (!aggregatedMap[dateKey]) {
      aggregatedMap[dateKey] = {
        date: displayLabel,
        max_weight_kg: item.max_weight_kg,
        total_volume_kg: item.total_volume_kg,
        estimated_1rm_kg: item.estimated_1rm_kg,
        count: 1
      };
    } else {
      // Aggregate for same date: peak max weight, total volume sum, peak e1rm
      aggregatedMap[dateKey].max_weight_kg = Math.max(aggregatedMap[dateKey].max_weight_kg, item.max_weight_kg);
      aggregatedMap[dateKey].total_volume_kg += item.total_volume_kg;
      aggregatedMap[dateKey].estimated_1rm_kg = Math.max(aggregatedMap[dateKey].estimated_1rm_kg, item.estimated_1rm_kg);
      aggregatedMap[dateKey].count += 1;
    }
  });

  const chartData = Object.values(aggregatedMap).map((entry) => ({
    date: entry.date,
    max_weight: displayWeightNum(entry.max_weight_kg, unit),
    volume: displayWeightNum(entry.total_volume_kg, unit),
    e1rm: displayWeightNum(entry.estimated_1rm_kg, unit)
  }));

  const allTimePR = historyData.reduce((max, h) => Math.max(max, h.max_weight_kg), 0);
  const allTimeMaxVolume = historyData.reduce((max, h) => Math.max(max, h.total_volume_kg), 0);
  const latestPerformance = historyData.length > 0 ? historyData[0] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" /> Strength & Progress Chart
          </h1>
          <p className="text-xs text-slate-400">Track weight PRs, total volume, and estimated 1RM over time</p>
        </div>
      </div>

      {/* Exercise Picker Dropdown */}
      <div className="glass-card p-4 rounded-3xl border border-[#262a3a]">
        <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
          Select Exercise to Analyze
        </label>
        <select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl glass-input text-sm bg-[#181b26] font-bold text-slate-100"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.muscle_group})
            </option>
          ))}
        </select>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-[#262a3a] text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Max Weight PR
          </p>
          <p className="text-xl font-extrabold text-amber-400">
            {formatWeight(allTimePR, unit)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-[#262a3a] text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" /> Max Volume
          </p>
          <p className="text-xl font-extrabold text-cyan-400">
            {formatWeight(allTimeMaxVolume, unit)}
          </p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-[#262a3a] text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Dumbbell className="w-3.5 h-3.5 text-slate-300" /> Sessions Logged
          </p>
          <p className="text-xl font-extrabold text-slate-100">
            {historyData.length}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card rounded-3xl p-6 border border-[#262a3a] space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="font-extrabold text-base text-slate-100">
            {exerciseDetail?.name || 'Progress Chart'}
          </h3>

          {/* Metric Selector Pills */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMetric('max_weight')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                metric === 'max_weight'
                  ? 'bg-[#9D00FF] text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Max Weight
            </button>
            <button
              onClick={() => setMetric('volume')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                metric === 'volume'
                  ? 'bg-[#9D00FF] text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setMetric('e1rm')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                metric === 'e1rm'
                  ? 'bg-[#9D00FF] text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Est. 1RM
            </button>
          </div>
        </div>

        {/* Recharts Render */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Loading chart data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm text-center px-4">
            No logged workout history found for this exercise yet. Log a workout containing {exerciseDetail?.name} to unlock progress tracking!
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262a3a" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12141c',
                    borderColor: '#9D00FF',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${value} ${unit}`, metric.replace('_', ' ').toUpperCase()]}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#9D00FF"
                  strokeWidth={3}
                  dot={{ fill: '#9D00FF', r: 5 }}
                  activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Historical Performance Entries List */}
      {historyData.length > 0 && (
        <div className="glass-card rounded-3xl p-5 border border-[#262a3a] space-y-4">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Performance History</h3>
          <div className="space-y-2">
            {historyData.map((h, idx) => (
              <div
                key={h.workout_id + idx}
                className="p-3.5 bg-[#181b26] rounded-2xl border border-slate-800/80 flex justify-between items-center text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-100">{h.workout_title}</h4>
                  <p className="text-slate-400 text-[11px]">{format(new Date(h.date), 'PPP')}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-extrabold text-cyan-400 text-sm">
                    {formatWeight(h.max_weight_kg, unit)}
                  </p>
                  <p className="text-[10px] text-slate-400">Vol: {formatWeight(h.total_volume_kg, unit)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
