export function calculateAttendanceNeeded(currentPercentage, targetPercentage, attended, total) {
  const current = Number(currentPercentage) || Number(attended) / Number(total) * 100;
  const target = Number(targetPercentage) || 75;

  if (total <= 0) {
    return { result: null, error: 'Total classes must be greater than zero.' };
  }

  const needed = (target * (attended + total) - 100 * attended) / (100 - target);

  if (!Number.isFinite(needed) || needed < 0) {
    return { result: 0, error: null };
  }

  return {
    result: Math.ceil(needed),
    error: null,
  };
}

export function calculateAttendanceAfterExtraClasses(attended, total, extraClasses) {
  const numerator = attended + extraClasses;
  const denominator = total + extraClasses;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

export function calculateGradeFromTotal(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function calculateAverage(subjectList) {
  if (!subjectList || !subjectList.length) return 0;
  const total = subjectList.reduce((sum, item) => sum + Number(item.total || 0), 0);
  return Number((total / subjectList.length).toFixed(2));
}

export function calculateFinalExamNeeded(currentTotal, maxMarks, targetGrade) {
  const targetScore = targetGrade === 'A' ? 90 : targetGrade === 'B' ? 80 : 70;
  const required = targetScore - currentTotal;
  return Math.max(0, required);
}

export function calculateDateDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
