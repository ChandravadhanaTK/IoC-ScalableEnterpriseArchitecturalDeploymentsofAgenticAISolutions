import { UnitPreference } from '../types';

export const KG_TO_LB = 2.20462;

export function formatWeight(weightKg: number, unit: UnitPreference): string {
  if (unit === 'lb') {
    const lbs = Math.round(weightKg * KG_TO_LB * 10) / 10;
    return `${lbs} lbs`;
  }
  return `${Math.round(weightKg * 10) / 10} kg`;
}

export function displayWeightNum(weightKg: number, unit: UnitPreference): number {
  if (unit === 'lb') {
    return Math.round(weightKg * KG_TO_LB * 10) / 10;
  }
  return Math.round(weightKg * 10) / 10;
}

export function inputToKg(weightInput: number, unit: UnitPreference): number {
  if (unit === 'lb') {
    return Math.round((weightInput / KG_TO_LB) * 100) / 100;
  }
  return weightInput;
}
