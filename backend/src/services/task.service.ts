import { Task, TaskSchedule, TaskStatus } from '../types/task.types';
import { addHours, addDays, addWeeks, addMonths, setHours, setMinutes, setSeconds } from 'date-fns';

export class TaskService {
  // ... existing code ...

  private calculateNextRun(schedule: TaskSchedule): Date {
    const now = new Date();
    const startDate = new Date(schedule.startDate);

    switch (schedule.type) {
      case 'once':
        return startDate > now ? startDate : now;
      
      case 'every':
        if (!schedule.interval) {
          throw new Error('Interval is required for "every" schedule type');
        }
        const lastRun = schedule.lastRun || startDate;
        const nextRun = addHours(lastRun, schedule.interval);
        return nextRun > now ? nextRun : now;
      
      case 'daily':
        if (!schedule.time) {
          throw new Error('Time is required for "daily" schedule type');
        }
        const [hours, minutes] = schedule.time.split(':').map(Number);
        let nextDaily = setHours(setMinutes(startDate, minutes), hours);
        if (nextDaily <= now) {
          nextDaily = addDays(nextDaily, 1);
        }
        return nextDaily;
      
      case 'weekly':
        if (!schedule.time || !schedule.daysOfWeek?.length) {
          throw new Error('Time and daysOfWeek are required for "weekly" schedule type');
        }
        const [weekHours, weekMinutes] = schedule.time.split(':').map(Number);
        let nextWeekly = setHours(setMinutes(startDate, weekMinutes), weekHours);
        const currentDay = nextWeekly.getDay();
        const nextDay = schedule.daysOfWeek.find(day => day > currentDay) || schedule.daysOfWeek[0];
        const daysToAdd = nextDay - currentDay;
        nextWeekly = addDays(nextWeekly, daysToAdd);
        if (nextWeekly <= now) {
          nextWeekly = addWeeks(nextWeekly, 1);
        }
        return nextWeekly;
      
      case 'monthly':
        if (!schedule.time || !schedule.daysOfMonth?.length) {
          throw new Error('Time and daysOfMonth are required for "monthly" schedule type');
        }
        const [monthHours, monthMinutes] = schedule.time.split(':').map(Number);
        let nextMonthly = setHours(setMinutes(startDate, monthMinutes), monthHours);
        const currentDayOfMonth = nextMonthly.getDate();
        const nextDayOfMonth = schedule.daysOfMonth.find(day => day > currentDayOfMonth) || schedule.daysOfMonth[0];
        const daysToAddMonth = nextDayOfMonth - currentDayOfMonth;
        nextMonthly = addDays(nextMonthly, daysToAddMonth);
        if (nextMonthly <= now) {
          nextMonthly = addMonths(nextMonthly, 1);
        }
        return nextMonthly;
      
      default:
        throw new Error(`Unsupported schedule type: ${schedule.type}`);
    }
  }

  // ... rest of the service code ...
} 