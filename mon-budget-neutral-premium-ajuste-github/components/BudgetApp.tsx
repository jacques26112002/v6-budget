'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness, CalendarDays,
  Building2, CalendarRange, CreditCard, Lightbulb, PiggyBank,
  Check, ChevronLeft, ChevronRight, CircleDollarSign, Download,
  Home, Landmark, Menu, Moon, MoreHorizontal, Plus, ReceiptText, Repeat2,
  Search, Settings, ShieldCheck, ShoppingBasket, Sparkles, Sun, Target,
  Trash2, TrendingDown, TrendingUp, Upload, Utensils, WalletCards, X
} from 'lucide-react';
import { db, seedDatabase } from '@/lib/db';
import type { Account, Category, Goal, Transaction, TxType } from '@/lib/types';
import { monthSummary } from '@/lib/calculations';

type Tab = 'home' | 'transactions' | 'calendar' | 'accounts' | 'stats' | 'settings';
type Modal = 'transaction' | 'category' | 'goal' | 'account' | null;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const money = (value: number, currency = 'CAD') => new Intl.NumberFormat('fr-CA', {
  style: 'currency', currency, maximumFractionDigits: 2
}).format(Number.isFinite(value) ? value : 0);
const monthName = (month: string) => new Intl.DateTimeFormat('fr-CA', {
  month: 'long', year: 'numeric'
}).format(new Date(`${month}-02T12:00:00`));
const shortDate = (date: string) => new Intl.DateTimeFormat('fr-CA', {
  day: 'numeric', month: 'short'
}).format(new Date(`${date}T12:00:00`));

const nav = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'calendar', label: 'Calendrier', icon: CalendarRange },
  { id: 'accounts', label: 'Comptes', icon: CreditCard },
  { id: 'stats', label: 'Analyses', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings }
] as const;

export default function BudgetApp() {
  const [tab, setTab] = useState<Tab>('home');
  const [month, setMonth] = useState(currentMonth());
  const [modal, setModal] = useState<Modal>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    seedDatabase();
    const script = document.createElement('script');
    script.src = '/register-sw.js';
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toArray(), []) || [];
  const currency = String(settings.find(s => s.key === 'currency')?.value || 'CAD');
  const monthlyGoal = Number(settings.find(s => s.key === 'monthlyGoal')?.value || 1000);
  const theme = String(settings.find(s => s.key === 'theme')?.value || 'light');

  useEffect(() => document.documentElement.setAttribute('data-theme', theme), [theme]);

  const monthTransactions = transactions.filter(t => t.date.startsWith(month));
  const summary = useMemo(() => monthSummary(transactions, month, monthlyGoal), [transactions, month, monthlyGoal]);

  const changeMonth = (delta: number) => {
    const [year, value] = month.split('-').map(Number);
    const next = new Date(year, value - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const pageTitle: Record<Tab, string> = {
    home: 'Bonjour Jacques', transactions: 'Transactions', calendar: 'Calendrier financier',
    accounts: 'Comptes et patrimoine', stats: 'Analyses', settings: 'Paramètres'
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-icon"><Landmark size={22}/></div><div><strong>Mon Budget</strong><span>Gestion personnelle</span></div></div>
      <nav>{nav.map(item => <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => { setTab(item.id); setMobileMenu(false); }}/>)}</nav>
      <div className="secure-box"><ShieldCheck size={19}/><div><b>100 % privé</b><span>Les données restent sur votre appareil.</span></div></div>
    </aside>

    <main className="content">
      <header className="header">
        <button className="mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Menu"><Menu/></button>
        <div><p className="overline">VUE D’ENSEMBLE</p><h1>{pageTitle[tab]}</h1>{tab === 'home' && <span className="subtitle">Vos finances, simplement et clairement.</span>}</div>
        <div className="header-actions"><button className="round-button"><Bell size={19}/><i/></button><button className="add-button" onClick={() => setModal('transaction')}><Plus size={18}/> Nouvelle transaction</button></div>
      </header>

      {tab !== 'settings' && <MonthSelector month={month} onPrev={() => changeMonth(-1)} onNext={() => changeMonth(1)}/>} 
      {tab === 'home' && <Dashboard summary={summary} transactions={monthTransactions} categories={categories} currency={currency} monthlyGoal={monthlyGoal} onAdd={() => setModal('transaction')}/>} 
      {tab === 'transactions' && <TransactionsView transactions={monthTransactions} categories={categories} currency={currency}/>} 
      {tab === 'calendar' && <CalendarView transactions={monthTransactions} categories={categories} month={month} currency={currency}/>}
      {tab === 'accounts' && <AccountsView accounts={accounts} transactions={transactions} currency={currency} onAdd={() => setModal('account')}/>}
      {tab === 'stats' && <StatsView transactions={transactions} categories={categories} month={month} currency={currency}/>} 
      {tab === 'settings' && <SettingsView transactions={transactions} categories={categories} goals={goals} accounts={accounts} currency={currency} monthlyGoal={monthlyGoal} theme={theme}/>} 
    </main>

    <nav className="bottom-nav">{nav.filter(item => ['home','transactions','calendar','accounts','stats'].includes(item.id)).map(item => <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)}/>)}</nav>
    <button className="floating-add" onClick={() => setModal('transaction')} aria-label="Ajouter"><Plus/></button>
    {mobileMenu && <button className="menu-backdrop" onClick={() => setMobileMenu(false)} aria-label="Fermer le menu"/>}

    {modal === 'transaction' && <TransactionModal categories={categories} accounts={accounts} onClose={() => setModal(null)}/>} 
    {modal === 'category' && <CategoryModal onClose={() => setModal(null)}/>} 
    {modal === 'goal' && <GoalModal onClose={() => setModal(null)}/>} 
    {modal === 'account' && <AccountModal onClose={() => setModal(null)}/>}
  </div>;
}

function NavButton({ item, active, onClick }: { item: typeof nav[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}><Icon size={20}/><span>{item.label}</span></button>;
}

function MonthSelector({ month, onPrev, onNext }: { month: string; onPrev: () => void; onNext: () => void }) {
  return <div className="period-row"><div className="month-selector"><button onClick={onPrev}><ChevronLeft/></button><div><CalendarDays size={17}/><b>{monthName(month)}</b></div><button onClick={onNext}><ChevronRight/></button></div><span className="sync-status"><Check size={14}/> Sauvegardé automatiquement</span></div>;
}

function Dashboard({ summary, transactions, categories, currency, monthlyGoal, onAdd }: {
  summary: ReturnType<typeof monthSummary>; transactions: Transaction[]; categories: Category[];
  currency: string; monthlyGoal: number; onAdd: () => void;
}) {
  const budgetProgress = monthlyGoal > 0 ? Math.max(0, Math.min(100, summary.balance / monthlyGoal * 100)) : 0;
  const previousMonth = new Date(); previousMonth.setMonth(previousMonth.getMonth() - 1);
  const categoryData = categories.filter(c => c.type === 'expense').map(c => ({
    name: c.name, color: c.color,
    value: transactions.filter(t => t.type === 'expense' && t.categoryId === c.id).reduce((a, b) => a + b.amount, 0)
  })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);

  return <>
    <section className="balance-card">
      <div className="balance-copy"><span className="pill"><Sparkles size={14}/> Disponible à dépenser</span><h2 className={summary.available < 0 ? 'loss' : ''}>{money(summary.available, currency)}</h2><p>{summary.available >= 0 ? <>Vous pouvez dépenser <b>{money(summary.dailyAvailable, currency)}</b> par jour pendant les {summary.remainingDays} prochains jours.</> : <>Il manque <b>{money(Math.abs(summary.available), currency)}</b> pour atteindre votre objectif ce mois-ci.</>}</p><button onClick={onAdd}><Plus size={17}/> Ajouter une dépense</button></div>
      <div className="progress-ring" style={{ '--progress': `${budgetProgress * 3.6}deg` } as React.CSSProperties}><div><b>{budgetProgress.toFixed(0)} %</b><span>de l’objectif</span></div></div>
      <div className="decor decor-one"/><div className="decor decor-two"/>
    </section>

    <section className="metric-grid">
      <Metric icon={ArrowUpRight} className="income" label="Revenus" value={money(summary.income, currency)} trend="Ce mois"/>
      <Metric icon={ArrowDownRight} className="expense" label="Dépenses" value={money(summary.expenses, currency)} trend={`${transactions.filter(t => t.type === 'expense').length} opérations`}/>
      <Metric icon={PigIcon} className="saving" label="Épargne actuelle" value={money(summary.balance, currency)} trend={`${summary.savingsRate.toFixed(1)} % des revenus`}/>
      <Metric icon={Target} className="target" label="Objectif" value={money(monthlyGoal, currency)} trend={summary.balance >= monthlyGoal ? 'Objectif atteint' : `${money(monthlyGoal - summary.balance, currency)} restant`}/>
    </section>

    <SmartInsights summary={summary} transactions={transactions} categories={categories} currency={currency} monthlyGoal={monthlyGoal}/>

    <section className="dashboard-grid">
      <Panel title="Répartition des dépenses" subtitle="Vos principales catégories">
        {categoryData.length ? <div className="donut-layout"><ResponsiveContainer width="55%" height={260}><PieChart><Pie data={categoryData} dataKey="value" innerRadius={66} outerRadius={96} paddingAngle={4} stroke="none">{categoryData.map(x => <Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip formatter={v => money(Number(v), currency)} contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 12px 30px #0002' }}/></PieChart></ResponsiveContainer><div className="legend">{categoryData.slice(0, 5).map(x => <div key={x.name}><i style={{ background: x.color }}/><span>{x.name}</span><b>{money(x.value, currency)}</b></div>)}</div></div> : <EmptyState text="Ajoutez vos premières dépenses pour afficher la répartition."/>}
      </Panel>
      <Panel title="Transactions récentes" subtitle="Derniers mouvements" action={<button className="text-button">Tout voir <ChevronRight size={15}/></button>}><TransactionList transactions={transactions.slice(0, 6)} categories={categories} currency={currency}/></Panel>
    </section>
  </>;
}

function SmartInsights({ summary, transactions, categories, currency, monthlyGoal }: { summary: ReturnType<typeof monthSummary>; transactions: Transaction[]; categories: Category[]; currency: string; monthlyGoal: number }) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const top = categories.map(category => ({ category, amount: expenses.filter(t => t.categoryId === category.id).reduce((sum,t)=>sum+t.amount,0) })).sort((a,b)=>b.amount-a.amount)[0];
  const recurring = expenses.filter(t => t.recurring).reduce((sum,t)=>sum+t.amount,0);
  const projectedVariable = summary.elapsedDays > 0 ? expenses.filter(t => t.expenseType !== 'fixed').reduce((sum,t)=>sum+t.amount,0) / summary.elapsedDays * summary.daysInMonth : 0;
  const fixed = expenses.filter(t => t.expenseType === 'fixed').reduce((sum,t)=>sum+t.amount,0);
  const forecast = summary.income - fixed - projectedVariable;
  const insights = [
    summary.available >= 0 ? `Vous gardez une marge de ${money(summary.available,currency)} après votre objectif.` : `Réduisez vos dépenses de ${money(Math.abs(summary.available),currency)} pour atteindre votre objectif.`,
    top?.amount ? `${top.category.name} est votre première catégorie ce mois-ci avec ${money(top.amount,currency)}.` : 'Ajoutez quelques dépenses pour obtenir une analyse personnalisée.',
    recurring > 0 ? `Vos paiements récurrents représentent ${money(recurring,currency)} ce mois-ci.` : `Aucun paiement récurrent n’est encore enregistré.`,
    forecast >= monthlyGoal ? `Prévision de fin de mois : objectif atteignable, avec environ ${money(forecast,currency)} d’épargne.` : `Prévision de fin de mois : l’épargne estimée est de ${money(forecast,currency)}.`
  ];
  return <section className="insights-card"><div className="insights-heading"><div className="insights-icon"><Lightbulb/></div><div><span className="pill">Analyse intelligente</span><h3>Vos priorités du mois</h3></div></div><div className="insights-list">{insights.map((text,index)=><div key={text}><span>{index+1}</span><p>{text}</p></div>)}</div></section>;
}

function PigIcon() { return <WalletCards size={21}/>; }
function Metric({ icon: Icon, className, label, value, trend }: { icon: React.ElementType; className: string; label: string; value: string; trend: string }) {
  return <article className="metric-card"><div className={`metric-symbol ${className}`}><Icon size={21}/></div><div className="metric-label"><span>{label}</span><button><MoreHorizontal size={18}/></button></div><strong>{value}</strong><small>{trend}</small></article>;
}
function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-header"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><div><WalletCards/></div><b>Rien à afficher</b><p>{text}</p></div>; }

function TransactionList({ transactions, categories, currency }: { transactions: Transaction[]; categories: Category[]; currency: string }) {
  if (!transactions.length) return <EmptyState text="Les transactions de la période apparaîtront ici."/>;
  return <div className="transaction-list">{transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId);
    return <div className="transaction-row" key={t.id}>
      <div className="transaction-icon" style={{ background: `${category?.color || '#71717a'}18`, color: category?.color || '#71717a' }}>{t.type === 'income' ? <BriefcaseBusiness size={20}/> : category?.name === 'Épicerie' ? <ShoppingBasket size={20}/> : category?.name === 'Restaurants' ? <Utensils size={20}/> : <ReceiptText size={20}/>}</div>
      <div className="transaction-name"><b>{t.title}</b><span>{category?.name || 'Autre'} · {shortDate(t.date)}{t.recurring ? ' · Récurrent' : ''}</span></div>
      <strong className={t.type === 'income' ? 'gain' : ''}>{t.type === 'income' ? '+' : '−'}{money(t.amount, currency)}</strong>
      <button className="delete-icon" onClick={() => t.id && db.transactions.delete(t.id)} title="Supprimer"><Trash2 size={16}/></button>
    </div>;
  })}</div>;
}

function TransactionsView({ transactions, categories, currency }: { transactions: Transaction[]; categories: Category[]; currency: string }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | TxType>('all');
  const filtered = transactions.filter(t => (filter === 'all' || t.type === filter) && (`${t.title} ${categories.find(c => c.id === t.categoryId)?.name || ''}`).toLowerCase().includes(query.toLowerCase()));
  return <Panel title="Toutes les transactions" subtitle={`${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une transaction"/></div><div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Toutes</button><button className={filter === 'income' ? 'active' : ''} onClick={() => setFilter('income')}>Revenus</button><button className={filter === 'expense' ? 'active' : ''} onClick={() => setFilter('expense')}>Dépenses</button></div></div>
    <TransactionList transactions={filtered} categories={categories} currency={currency}/>
  </Panel>;
}

function BudgetView({ transactions, categories, currency, onAdd }: { transactions: Transaction[]; categories: Category[]; currency: string; onAdd: () => void }) {
  const expenses = categories.filter(c => c.type === 'expense' && !c.hidden);
  const totalBudget = expenses.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  return <>
    <section className="budget-summary"><div><span>Budget total</span><strong>{money(totalBudget, currency)}</strong></div><div><span>Dépensé</span><strong>{money(totalSpent, currency)}</strong></div><div><span>Reste disponible</span><strong className={totalBudget - totalSpent < 0 ? 'danger-text' : ''}>{money(totalBudget - totalSpent, currency)}</strong></div><button className="secondary-button" onClick={onAdd}><Plus size={17}/> Nouvelle catégorie</button></section>
    <Panel title="Budgets par catégorie" subtitle="Suivez vos limites de dépenses">
      <div className="budget-list">{expenses.map(c => {
        const spent = transactions.filter(t => t.type === 'expense' && t.categoryId === c.id).reduce((a, b) => a + b.amount, 0);
        const percent = c.budget ? spent / c.budget * 100 : 0;
        return <div className="budget-item" key={c.id}><div className="budget-icon" style={{ background: `${c.color}18`, color: c.color }}>{c.name[0]}</div><div className="budget-info"><div><b>{c.name}</b><span>{money(spent, currency)} sur {money(c.budget || 0, currency)}</span></div><div className="bar"><i style={{ width: `${Math.min(percent, 100)}%`, background: percent > 100 ? 'var(--danger)' : c.color }}/></div><small className={percent > 100 ? 'danger-text' : ''}>{percent > 100 ? `Budget dépassé de ${money(spent - (c.budget || 0), currency)}` : `${Math.round(percent)} % utilisé · ${money(Math.max(0, (c.budget || 0) - spent), currency)} restant`}</small></div></div>;
      })}</div>
    </Panel>
  </>;
}

function GoalsView({ goals, summary, currency, onAdd }: { goals: Goal[]; summary: ReturnType<typeof monthSummary>; currency: string; onAdd: () => void }) {
  return <><section className="goal-hero"><div><span className="pill"><Target size={14}/> Objectif du mois</span><h2>{money(Math.max(0, summary.balance), currency)}</h2><p>Montant actuellement disponible pour épargner ou investir.</p></div><div className="goal-hero-stats"><div><span>Reste à dépenser</span><b>{money(summary.available, currency)}</b></div><div><span>Budget quotidien</span><b>{money(summary.dailyAvailable, currency)}</b></div><div><span>Taux d’épargne</span><b>{summary.savingsRate.toFixed(1)} %</b></div></div></section>
    <Panel title="Mes objectifs" subtitle="Construisez vos projets" action={<button className="secondary-button" onClick={onAdd}><Plus size={16}/> Ajouter</button>}>
      {goals.length ? <div className="goal-grid">{goals.map(g => { const pct = Math.min(100, g.current / g.target * 100); const remaining = Math.max(0, g.target - g.current); const months = g.monthlyTarget > 0 ? Math.ceil(remaining / g.monthlyTarget) : 0; return <article className="goal-card" key={g.id}><div className="goal-top"><div className="goal-symbol"><Target/></div><button onClick={() => g.id && db.goals.delete(g.id)}><Trash2 size={16}/></button></div><h3>{g.name}</h3><p>{money(g.current, currency)} sur {money(g.target, currency)}</p><div className="bar large"><i style={{ width: `${pct}%` }}/></div><div className="goal-bottom"><b>{pct.toFixed(0)} %</b><span>{months ? `≈ ${months} mois restants` : `${money(remaining, currency)} restant`}</span></div></article>; })}</div> : <EmptyState text="Créez un objectif : fonds d’urgence, voyage, investissement ou mise de fonds."/>}
    </Panel></>;
}

function StatsView({ transactions, categories, month, currency }: { transactions: Transaction[]; categories: Category[]; month: string; currency: string }) {
  const [year] = month.split('-');
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, '0')}`;
    const list = transactions.filter(t => t.date.startsWith(key));
    return { month: new Intl.DateTimeFormat('fr-CA', { month: 'short' }).format(new Date(Number(year), index, 1)), revenus: list.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0), dépenses: list.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0) };
  });
  const annualIncome = monthly.reduce((a, b) => a + b.revenus, 0), annualExpenses = monthly.reduce((a, b) => a + b.dépenses, 0);
  const current = transactions.filter(t => t.date.startsWith(month));
  const byCategory = categories.filter(c => c.type === 'expense').map(c => ({ name: c.name, value: current.filter(t => t.type === 'expense' && t.categoryId === c.id).reduce((a, b) => a + b.amount, 0), color: c.color })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  return <>
    <section className="analytics-strip"><div><span>Revenus annuels</span><b>{money(annualIncome, currency)}</b></div><div><span>Dépenses annuelles</span><b>{money(annualExpenses, currency)}</b></div><div><span>Épargne annuelle</span><b>{money(annualIncome - annualExpenses, currency)}</b></div><div><span>Taux d’épargne</span><b>{annualIncome ? ((annualIncome - annualExpenses) / annualIncome * 100).toFixed(1) : 0} %</b></div></section>
    <section className="dashboard-grid"><Panel title="Revenus et dépenses" subtitle={`Vue annuelle ${year}`}><ResponsiveContainer width="100%" height={310}><BarChart data={monthly} barGap={3}><CartesianGrid vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={45}/><Tooltip formatter={v => money(Number(v), currency)} contentStyle={{ borderRadius: 14, border: 'none' }}/><Bar dataKey="revenus" fill="var(--success)" radius={[6, 6, 0, 0]}/><Bar dataKey="dépenses" fill="var(--accent)" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></Panel>
    <Panel title="Tendance du solde" subtitle="Évolution mensuelle"><ResponsiveContainer width="100%" height={310}><AreaChart data={monthly.map(x => ({ ...x, solde: x.revenus - x.dépenses }))}><defs><linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={.35}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={45}/><Tooltip formatter={v => money(Number(v), currency)} contentStyle={{ borderRadius: 14, border: 'none' }}/><Area type="monotone" dataKey="solde" stroke="var(--accent)" strokeWidth={3} fill="url(#balanceGradient)"/></AreaChart></ResponsiveContainer></Panel></section>
    <Panel title="Catégories les plus coûteuses" subtitle={monthName(month)}>{byCategory.length ? <div className="ranking">{byCategory.slice(0, 6).map((x, i) => <div key={x.name}><b>#{i + 1}</b><i style={{ background: x.color }}/><span>{x.name}</span><strong>{money(x.value, currency)}</strong></div>)}</div> : <EmptyState text="Ajoutez des dépenses pour obtenir des analyses détaillées."/>}</Panel>
  </>;
}


function CalendarView({ transactions, categories, month, currency }: { transactions: Transaction[]; categories: Category[]; month: string; currency: string }) {
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array.from({ length: offset + days }, (_, index) => index < offset ? null : index - offset + 1);
  return <Panel title="Calendrier financier" subtitle="Visualisez les entrées et sorties prévues chaque jour">
    <div className="calendar-weekdays">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(day => <b key={day}>{day}</b>)}</div>
    <div className="calendar-grid">{cells.map((day, index) => {
      if (!day) return <div key={`empty-${index}`} className="calendar-cell empty"/>;
      const date = `${month}-${String(day).padStart(2,'0')}`;
      const items = transactions.filter(t => t.date === date);
      const net = items.reduce((total, item) => total + (item.type === 'income' ? item.amount : -item.amount), 0);
      return <div key={date} className={`calendar-cell ${items.length ? 'has-items' : ''}`}><span className="calendar-day">{day}</span>{items.slice(0,2).map(item => {
        const category = categories.find(c => c.id === item.categoryId);
        return <div className={`calendar-event ${item.type}`} key={item.id}><i style={{background:category?.color}}/>{item.title}</div>;
      })}{items.length > 2 && <small>+{items.length - 2} autres</small>}{items.length > 0 && <strong className={net < 0 ? 'negative' : ''}>{money(net,currency)}</strong>}</div>;
    })}</div>
  </Panel>;
}

function AccountsView({ accounts, transactions, currency, onAdd }: { accounts: Account[]; transactions: Transaction[]; currency: string; onAdd: () => void }) {
  const balanceFor = (account: Account) => account.openingBalance + transactions.filter(t => t.accountId === account.id).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const total = accounts.reduce((sum, account) => sum + balanceFor(account), 0);
  return <>
    <section className="net-worth-card"><div><span className="pill"><PiggyBank size={14}/> Patrimoine suivi</span><h2>{money(total,currency)}</h2><p>Somme de vos comptes, liquidités et placements enregistrés.</p></div><button className="secondary-button light" onClick={onAdd}><Plus size={17}/> Ajouter un compte</button></section>
    <section className="account-grid">{accounts.map(account => <article className="account-card" key={account.id}><div className="account-card-top"><div className="account-logo" style={{background:account.color}}><Building2/></div><span>{account.institution || 'Compte personnel'}</span></div><h3>{account.name}</h3><strong>{money(balanceFor(account),currency)}</strong><small>{({checking:'Compte courant',savings:'Épargne',credit:'Carte de crédit',investment:'Placement',cash:'Comptant'} as Record<string,string>)[account.type]}</small></article>)}</section>
    <Panel title="Vue d’ensemble" subtitle="Répartition de votre patrimoine"><div className="wealth-bars">{accounts.map(account => { const value = Math.max(0,balanceFor(account)); const pct = total > 0 ? value/total*100 : 0; return <div key={account.id}><span><b>{account.name}</b><em>{money(value,currency)}</em></span><div className="bar"><i style={{width:`${pct}%`,background:account.color}}/></div></div>; })}</div></Panel>
  </>;
}

function SettingsView({ transactions, categories, goals, accounts, currency, monthlyGoal, theme }: { transactions: Transaction[]; categories: Category[]; goals: Goal[]; accounts: Account[]; currency: string; monthlyGoal: number; theme: string }) {
  const importRef = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), transactions, categories, goals, accounts }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `mon-budget-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  };
  const importData = async (file?: File) => {
    if (!file) return; try { const data = JSON.parse(await file.text()); await db.transaction('rw', db.transactions, db.categories, db.goals, db.accounts, async () => { if (Array.isArray(data.transactions)) await db.transactions.bulkPut(data.transactions); if (Array.isArray(data.categories)) await db.categories.bulkPut(data.categories); if (Array.isArray(data.goals)) await db.goals.bulkPut(data.goals); if (Array.isArray(data.accounts)) await db.accounts.bulkPut(data.accounts); }); alert('Sauvegarde importée avec succès.'); } catch { alert('Ce fichier ne semble pas être une sauvegarde valide.'); }
  };
  return <div className="settings-grid">
    <Panel title="Préférences" subtitle="Personnalisez votre expérience"><label className="field"><span>Devise</span><select value={currency} onChange={e => db.settings.put({ key: 'currency', value: e.target.value })}><option value="CAD">Dollar canadien (CAD)</option><option value="EUR">Euro (EUR)</option><option value="USD">Dollar américain (USD)</option></select></label><label className="field"><span>Objectif mensuel d’épargne</span><input type="number" min="0" step="50" value={monthlyGoal} onChange={e => db.settings.put({ key: 'monthlyGoal', value: Number(e.target.value) })}/></label><div className="theme-setting"><span>Apparence</span><div><button className={theme === 'light' ? 'active' : ''} onClick={() => db.settings.put({ key: 'theme', value: 'light' })}><Sun size={17}/> Clair</button><button className={theme === 'dark' ? 'active' : ''} onClick={() => db.settings.put({ key: 'theme', value: 'dark' })}><Moon size={17}/> Sombre</button></div></div></Panel>
    <Panel title="Sauvegarde" subtitle="Gardez une copie de vos données"><div className="settings-actions"><button className="secondary-button" onClick={exportData}><Download size={17}/> Exporter en JSON</button><button className="secondary-button" onClick={() => importRef.current?.click()}><Upload size={17}/> Importer une sauvegarde</button><input ref={importRef} type="file" accept="application/json" hidden onChange={e => importData(e.target.files?.[0])}/></div><div className="info-box"><ShieldCheck/><p><b>Vos données sont locales.</b><br/>Elles ne sont envoyées vers aucun serveur. Pensez à exporter une sauvegarde régulièrement.</p></div></Panel>
    <Panel title="Installer sur iPhone" subtitle="Utilisez le site comme une application"><ol className="install-steps"><li><span>1</span>Ouvrez le site dans Safari.</li><li><span>2</span>Appuyez sur le bouton Partager.</li><li><span>3</span>Choisissez « Sur l’écran d’accueil ».</li><li><span>4</span>Appuyez sur « Ajouter ».</li></ol></Panel>
    <Panel title="Zone sensible" subtitle="Actions irréversibles"><button className="danger-button" onClick={async () => { if (confirm('Supprimer définitivement toutes vos données ?')) { await db.transactions.clear(); await db.goals.clear(); } }}><Trash2 size={17}/> Effacer les transactions et objectifs</button></Panel>
  </div>;
}

function ModalShell({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal"><div className="modal-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button onClick={onClose}><X/></button></div>{children}</div></div>;
}

function TransactionModal({ categories, accounts, onClose }: { categories: Category[]; accounts: Account[]; onClose: () => void }) {
  const [type, setType] = useState<TxType>('expense');
  const available = categories.filter(c => c.type === type);
  const [form, setForm] = useState(() => ({ title: '', amount: '', date: new Date().toISOString().slice(0, 10), categoryId: String(categories.find(c => c.type === 'expense')?.id || ''), accountId: String(accounts[0]?.id || ''), expenseType: 'variable', recurring: false, note: '' }));
  const changeType = (nextType: TxType) => {
    setType(nextType);
    setForm(current => ({ ...current, categoryId: String(categories.find(c => c.type === nextType)?.id || '') }));
  };
  const submit = async (e: React.FormEvent) => { e.preventDefault(); const categoryId = Number(form.categoryId || available[0]?.id); if (!form.title.trim() || !Number(form.amount) || !categoryId) return; await db.transactions.add({ title: form.title.trim(), amount: Number(form.amount), date: form.date, type, categoryId, accountId: Number(form.accountId) || undefined, expenseType: type === 'expense' ? form.expenseType as 'fixed' | 'variable' : undefined, frequency: form.recurring ? 'monthly' : 'unique', recurring: form.recurring, note: form.note, createdAt: new Date().toISOString() }); onClose(); };
  return <ModalShell title="Nouvelle transaction" description="Ajoutez un revenu ou une dépense." onClose={onClose}><form onSubmit={submit}><div className="segmented"><button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => changeType('expense')}><TrendingDown/> Dépense</button><button type="button" className={type === 'income' ? 'active' : ''} onClick={() => changeType('income')}><TrendingUp/> Revenu</button></div><div className="form-grid"><label className="field full"><span>Libellé</span><input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={type === 'expense' ? 'Ex. Courses de la semaine' : 'Ex. Salaire'}/></label><label className="field"><span>Montant</span><div className="amount-input"><CircleDollarSign/><input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00"/></div></label><label className="field"><span>Date</span><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></label><label className="field"><span>Catégorie</span><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>{available.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label className="field"><span>Compte</span><select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>{accounts.map(a => <option value={a.id} key={a.id}>{a.name}</option>)}</select></label>{type === 'expense' && <label className="field"><span>Type de dépense</span><select value={form.expenseType} onChange={e => setForm({ ...form, expenseType: e.target.value })}><option value="variable">Variable</option><option value="fixed">Fixe</option></select></label>}<label className="field full"><span>Note (optionnelle)</span><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ajouter une précision…"/></label></div><label className="toggle-row"><div><Repeat2/><span><b>Transaction récurrente</b><small>Se répète tous les mois</small></span></div><input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })}/></label><button className="submit-button">Enregistrer la transaction</button></form></ModalShell>;
}

function CategoryModal({ onClose }: { onClose: () => void }) {
  const colors = ['#315c4d', '#527566', '#9a7441', '#9b625d', '#687b78', '#7d716f', '#777972'];
  const [form, setForm] = useState({ name: '', budget: '', color: colors[0] });
  return <ModalShell title="Nouvelle catégorie" description="Créez une limite adaptée à votre quotidien." onClose={onClose}><form onSubmit={async e => { e.preventDefault(); if (!form.name.trim()) return; await db.categories.add({ name: form.name.trim(), type: 'expense', icon: 'ReceiptText', color: form.color, budget: Number(form.budget) || 0 }); onClose(); }}><label className="field"><span>Nom de la catégorie</span><input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex. Sport"/></label><label className="field"><span>Budget mensuel</span><input type="number" min="0" step="10" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="0"/></label><div className="color-picker"><span>Couleur</span><div>{colors.map(color => <button key={color} type="button" style={{ background: color }} className={form.color === color ? 'selected' : ''} onClick={() => setForm({ ...form, color })}>{form.color === color && <Check/>}</button>)}</div></div><button className="submit-button">Créer la catégorie</button></form></ModalShell>;
}

function GoalModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', target: '', current: '', monthlyTarget: '', deadline: '' });
  return <ModalShell title="Nouvel objectif" description="Donnez un cap concret à votre épargne." onClose={onClose}><form onSubmit={async e => { e.preventDefault(); if (!form.name.trim() || !Number(form.target)) return; await db.goals.add({ name: form.name.trim(), target: Number(form.target), current: Number(form.current) || 0, monthlyTarget: Number(form.monthlyTarget) || 0, deadline: form.deadline || undefined, status: 'active' }); onClose(); }}><div className="form-grid"><label className="field full"><span>Nom de l’objectif</span><input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex. Fonds d’urgence"/></label><label className="field"><span>Montant cible</span><input type="number" min="1" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}/></label><label className="field"><span>Déjà accumulé</span><input type="number" min="0" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })}/></label><label className="field"><span>Contribution mensuelle</span><input type="number" min="0" value={form.monthlyTarget} onChange={e => setForm({ ...form, monthlyTarget: e.target.value })}/></label><label className="field"><span>Date cible</span><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}/></label></div><button className="submit-button">Créer l’objectif</button></form></ModalShell>;
}

function AccountModal({ onClose }: { onClose: () => void }) {
  const [form,setForm] = useState({name:'',type:'checking',openingBalance:'',institution:'',color:'#315c4d'});
  return <ModalShell title="Nouveau compte" description="Ajoutez un compte bancaire, une carte ou un placement." onClose={onClose}><form onSubmit={async e => { e.preventDefault(); if(!form.name.trim()) return; await db.accounts.add({name:form.name.trim(),type:form.type as Account['type'],openingBalance:Number(form.openingBalance)||0,institution:form.institution.trim()||undefined,color:form.color}); onClose(); }}><div className="form-grid"><label className="field full"><span>Nom du compte</span><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex. Compte Banque Nationale"/></label><label className="field"><span>Type</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="checking">Compte courant</option><option value="savings">Épargne</option><option value="credit">Carte de crédit</option><option value="investment">Placement</option><option value="cash">Comptant</option></select></label><label className="field"><span>Solde initial</span><input type="number" step="0.01" value={form.openingBalance} onChange={e=>setForm({...form,openingBalance:e.target.value})}/></label><label className="field full"><span>Institution (optionnel)</span><input value={form.institution} onChange={e=>setForm({...form,institution:e.target.value})} placeholder="Ex. Banque Nationale"/></label></div><button className="submit-button">Ajouter le compte</button></form></ModalShell>;
}
