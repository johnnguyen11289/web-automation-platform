import { ITaskSchedule } from '../models/task.model';
import { addDays, addWeeks, addMonths, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';

export function calculateNextRun(schedule: ITaskSchedule): Date | null {
  if (!schedule) return null;

  const now = new Date();
  let nextRun: Date;

  switch (schedule.type) {
    case 'once':
      nextRun = schedule.startDate;
      break;

    case 'daily':
      nextRun = calculateNextDailyRun(schedule, now);
      break;

    case 'weekly':
      nextRun = calculateNextWeeklyRun(schedule, now);
      break;

    case 'monthly':
      nextRun = calculateNextMonthlyRun(schedule, now);
      break;

    default:
      return null;
  }

  return isBefore(nextRun, now) ? null : nextRun;
}

function calculateNextDailyRun(schedule: ITaskSchedule, now: Date): Date {
  const [hours, minutes] = schedule.time?.split(':').map(Number) || [0, 0];
  let nextRun = startOfDay(now);
  nextRun = setHours(nextRun, hours);
  nextRun = setMinutes(nextRun, minutes);

  if (isBefore(nextRun, now)) {
    nextRun = addDays(nextRun, 1);
  }

  return nextRun;
}

function calculateNextWeeklyRun(schedule: ITaskSchedule, now: Date): Date {
  const [hours, minutes] = schedule.time?.split(':').map(Number) || [0, 0];
  let nextRun = startOfDay(now);
  nextRun = setHours(nextRun, hours);
  nextRun = setMinutes(nextRun, minutes);

  if (!schedule.daysOfWeek?.length) return nextRun;

  const currentDay = now.getDay();
  const nextDay = schedule.daysOfWeek
    .sort((a, b) => a - b)
    .find(day => day > currentDay) || schedule.daysOfWeek[0];

  const daysToAdd = nextDay > currentDay
    ? nextDay - currentDay
    : 7 - currentDay + nextDay;

  nextRun = addDays(nextRun, daysToAdd);

  return nextRun;
}

function calculateNextMonthlyRun(schedule: ITaskSchedule, now: Date): Date {
  const [hours, minutes] = schedule.time?.split(':').map(Number) || [0, 0];
  let nextRun = startOfDay(now);
  nextRun = setHours(nextRun, hours);
  nextRun = setMinutes(nextRun, minutes);

  if (!schedule.daysOfMonth?.length) return nextRun;

  const currentDay = now.getDate();
  const nextDay = schedule.daysOfMonth
    .sort((a, b) => a - b)
    .find(day => day > currentDay) || schedule.daysOfMonth[0];

  if (nextDay > currentDay) {
    nextRun.setDate(nextDay);
  } else {
    nextRun = addMonths(nextRun, 1);
    nextRun.setDate(nextDay);
  }

  return nextRun;
} 