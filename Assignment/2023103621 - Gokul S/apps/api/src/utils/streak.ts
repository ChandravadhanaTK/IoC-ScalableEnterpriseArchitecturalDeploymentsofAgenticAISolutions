export function calculateStreak(workoutDates: Date[]): { currentStreak: number; totalWorkouts: number } {
  if (workoutDates.length === 0) return { currentStreak: 0, totalWorkouts: 0 };

  // Format dates as YYYY-MM-DD strings in local/UTC terms
  const uniqueDateStrings = Array.from(
    new Set(
      workoutDates.map(d => {
        const iso = d.toISOString();
        return iso.split('T')[0];
      })
    )
  ).sort().reverse();

  if (uniqueDateStrings.length === 0) return { currentStreak: 0, totalWorkouts: workoutDates.length };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak is active if user logged today or yesterday
  const latestDateStr = uniqueDateStrings[0];
  if (latestDateStr !== todayStr && latestDateStr !== yesterdayStr) {
    return { currentStreak: 0, totalWorkouts: workoutDates.length };
  }

  let streak = 0;
  let currentDate = new Date(latestDateStr);

  for (const dateStr of uniqueDateStrings) {
    const d = new Date(dateStr);
    const diffTime = Math.abs(currentDate.getTime() - d.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak += 1;
      currentDate = d;
    } else {
      break;
    }
  }

  return { currentStreak: streak, totalWorkouts: workoutDates.length };
}
