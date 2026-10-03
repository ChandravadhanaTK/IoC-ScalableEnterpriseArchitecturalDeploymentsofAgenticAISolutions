import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Dumbbell, Flame, CheckCircle2 } from 'lucide-react';
import { workoutsApi } from '../api/client';
import { formatWeight } from '../utils/units';
import { useAuth } from '../context/AuthContext';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { Workout } from '../types';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { lastWorkoutSavedAt } = useWorkoutSession();
  const unit = user?.unit_preference || 'kg';

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [trainedDates, setTrainedDates] = useState<string[]>([]);
  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<any[] | null>(null);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<Workout | null>(null);

  const monthString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await workoutsApi.getCalendarDates(monthString);
      setTrainedDates(res.trainedDates || []);
      setWorkoutsByDate(res.workoutsByDate || {});
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [monthString, lastWorkoutSavedAt]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar Grid Generation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate monthly stats
  const totalMonthlyWorkouts = Object.values(workoutsByDate).reduce((acc, list) => acc + list.length, 0);
  const totalMonthlyVolumeKg = Object.values(workoutsByDate).reduce((acc, list) => {
    return acc + list.reduce((subSum, w) => subSum + (w.total_volume_kg || 0), 0);
  }, 0);

  const handleDayClick = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayWorkouts = workoutsByDate[dateKey];
    if (dayWorkouts && dayWorkouts.length > 0) {
      setSelectedDateWorkouts(dayWorkouts);
    } else {
      setSelectedDateWorkouts(null);
    }
  };

  const handleViewFullWorkout = async (workoutId: string) => {
    try {
      const res = await workoutsApi.getWorkoutDetail(workoutId);
      setSelectedWorkoutDetail(res.workout);
    } catch (err) {
      console.error('Failed to view workout:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-cyan-400" /> Workout Calendar
          </h1>
          <p className="text-xs text-slate-400">Track your training consistency & trained days</p>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-[#262a3a] text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Days Trained</p>
          <p className="text-2xl font-extrabold text-cyan-400">{trainedDates.length}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-[#262a3a] text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Workouts</p>
          <p className="text-2xl font-extrabold text-slate-100">{totalMonthlyWorkouts}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-[#262a3a] text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Volume Lifted</p>
          <p className="text-sm font-extrabold text-cyan-400 pt-1">
            {formatWeight(totalMonthlyVolumeKg, unit)}
          </p>
        </div>
      </div>

      {/* Month Switcher & Grid Card */}
      <div className="glass-card rounded-3xl p-6 border border-[#262a3a] space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-xl text-slate-100">{monthName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-12" />;
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isTrained = trainedDates.includes(dateKey);
            const workoutCount = workoutsByDate[dateKey]?.length || 0;

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleDayClick(day)}
                className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition ${
                  isTrained
                    ? 'bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-cyan-300 font-extrabold shadow-glow'
                    : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-sm">{day}</span>
                {isTrained && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workouts Drawer */}
      {selectedDateWorkouts && (
        <div className="glass-card rounded-3xl p-5 border border-cyan-500/40 space-y-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Trained Session(s)
            </h3>
            <button
              onClick={() => setSelectedDateWorkouts(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="space-y-2">
            {selectedDateWorkouts.map((w) => (
              <div
                key={w.id}
                onClick={() => handleViewFullWorkout(w.id)}
                className="p-4 bg-[#181b26] hover:bg-[#202534] rounded-2xl border border-slate-800 flex justify-between items-center cursor-pointer transition"
              >
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{w.title}</h4>
                  <p className="text-xs text-slate-400">{w.exercise_count} exercises • {formatWeight(w.total_volume_kg, unit)}</p>
                </div>
                <span className="text-xs font-bold text-cyan-400">View Detail →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        workout={selectedWorkoutDetail}
        onClose={() => setSelectedWorkoutDetail(null)}
      />
    </div>
  );
};
