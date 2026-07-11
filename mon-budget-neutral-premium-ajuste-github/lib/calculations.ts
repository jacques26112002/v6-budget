import type { Transaction } from './types';
export const inMonth = (iso: string, month: string) => iso.slice(0, 7) === month;
export const sum = (items: Transaction[], type?: 'income'|'expense') => items.filter(x => !type || x.type === type).reduce((a,b)=>a+b.amount,0);
export function monthSummary(items: Transaction[], month: string, goal: number) {
  const selected = items.filter(t => inMonth(t.date, month));
  const income = sum(selected, 'income'); const expenses = sum(selected, 'expense');
  const balance = income - expenses; const available = balance - goal;
  const today = new Date(); const [y,m] = month.split('-').map(Number); const daysInMonth = new Date(y,m,0).getDate();
  const isCurrent = today.getFullYear()===y && today.getMonth()+1===m;
  const elapsedDays = isCurrent ? today.getDate() : daysInMonth;
  const remainingDays = Math.max(1, daysInMonth-elapsedDays+1);
  return { income, expenses, balance, available, dailyAvailable: available/remainingDays, savingsRate: income ? balance/income*100 : 0, remainingDays, elapsedDays, daysInMonth };
}
