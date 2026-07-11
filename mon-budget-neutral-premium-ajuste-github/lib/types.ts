export type TxType = 'income' | 'expense';
export type Frequency = 'unique' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
export interface Category { id?: number; name: string; type: TxType; icon: string; color: string; budget?: number; hidden?: boolean; }
export interface Account { id?: number; name: string; type: AccountType; openingBalance: number; color: string; institution?: string; archived?: boolean; }
export interface Transaction { id?: number; title: string; amount: number; date: string; type: TxType; categoryId: number; accountId?: number; expenseType?: 'fixed' | 'variable'; frequency: Frequency; recurring: boolean; note?: string; createdAt: string; }
export interface Goal { id?: number; name: string; target: number; current: number; monthlyTarget: number; deadline?: string; status: 'active' | 'paused' | 'done'; }
export interface Setting { key: string; value: string | number | boolean; }
