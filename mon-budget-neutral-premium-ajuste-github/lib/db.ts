import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Goal, Setting, Transaction } from './types';

class BudgetDatabase extends Dexie {
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  accounts!: EntityTable<Account, 'id'>;
  settings!: EntityTable<Setting, 'key'>;
  constructor() {
    super('monBudgetDB');
    this.version(1).stores({ categories: '++id,name,type', transactions: '++id,date,type,categoryId', goals: '++id,status', settings: 'key' });
    this.version(2).stores({ categories: '++id,name,type', transactions: '++id,date,type,categoryId,accountId', goals: '++id,status', accounts: '++id,name,type', settings: 'key' });
  }
}
export const db = new BudgetDatabase();

export async function seedDatabase() {
  if (!(await db.categories.count())) {
    const cats: Category[] = [
      { name: 'Salaire', type: 'income', icon: 'Briefcase', color: '#315c4d' },
      { name: 'Autres revenus', type: 'income', icon: 'PlusCircle', color: '#527566' },
      { name: 'Loyer', type: 'expense', icon: 'House', color: '#6f756b', budget: 900 },
      { name: 'Épicerie', type: 'expense', icon: 'ShoppingBasket', color: '#9a7441', budget: 500 },
      { name: 'Transport', type: 'expense', icon: 'Car', color: '#687b78', budget: 200 },
      { name: 'Restaurants', type: 'expense', icon: 'Utensils', color: '#9b625d', budget: 200 },
      { name: 'Loisirs', type: 'expense', icon: 'Gamepad2', color: '#7d716f', budget: 150 },
      { name: 'Abonnements', type: 'expense', icon: 'Repeat2', color: '#6d746f', budget: 100 },
      { name: 'Autres', type: 'expense', icon: 'Ellipsis', color: '#777972', budget: 300 }
    ];
    await db.categories.bulkAdd(cats);
  }
  if (!(await db.accounts.count())) {
    await db.accounts.bulkAdd([
      { name: 'Compte courant', type: 'checking', openingBalance: 0, color: '#315c4d', institution: 'Banque principale' },
      { name: 'Épargne', type: 'savings', openingBalance: 0, color: '#527566' },
      { name: 'Placements', type: 'investment', openingBalance: 0, color: '#9a7441' }
    ]);
  }
  await db.settings.bulkPut([
    { key: 'currency', value: (await db.settings.get('currency'))?.value || 'CAD' },
    { key: 'monthlyGoal', value: (await db.settings.get('monthlyGoal'))?.value || 1000 },
    { key: 'theme', value: (await db.settings.get('theme'))?.value || 'light' }
  ]);
}
