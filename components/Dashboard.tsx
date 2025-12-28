
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Worker, DailyLog } from '../types';
import { DollarSign, Clock, Users, TrendingUp, Wallet, ChevronLeft } from 'lucide-react';

interface Props {
  workers: Worker[];
  logs: DailyLog[];
  onViewWorker: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ workers, logs, onViewWorker }) => {
  const totalEarnings = logs.reduce((acc, log) => acc + log.totalEarnings, 0);
  const totalAdvances = logs.reduce((acc, log) => acc + log.advanceAmount, 0);
  const totalOT = logs.reduce((acc, log) => acc + log.otHours, 0);
  const netRemaining = totalEarnings - totalAdvances;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dailyLogs = logs.filter(l => l.date === dateStr);
    return {
      name: dateStr,
      earnings: dailyLogs.reduce((acc, l) => acc + l.totalEarnings, 0),
      advances: dailyLogs.reduce((acc, l) => acc + l.advanceAmount, 0),
    };
  }).reverse();

  const workerSummary = workers.map(w => {
    const wLogs = logs.filter(l => l.workerId === w.id);
    const earned = wLogs.reduce((acc, l) => acc + l.totalEarnings, 0);
    const advanced = wLogs.reduce((acc, l) => acc + l.advanceAmount, 0);
    return { id: w.id, name: w.name, role: w.role, earned, advanced, balance: earned - advanced };
  }).sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الأرباح" value={totalEarnings} icon={<DollarSign />} color="emerald" trend="+15%" />
        <StatCard title="إجمالي السلف" value={totalAdvances} icon={<Wallet />} color="rose" trend="+2%" />
        <StatCard title="صافي المستحقات" value={netRemaining} icon={<TrendingUp />} color="indigo" />
        <StatCard title="ساعات إضافية" value={totalOT} icon={<Clock />} color="amber" suffix="ساعة" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Analytics */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-800">التدفق المالي الأسبوعي</h3>
              <p className="text-slate-400 text-sm font-bold">مقارنة بين إجمالي اليوميات والسلف الموزعة</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-xs font-black text-indigo-600">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-100"></span> أرباح
               </div>
               <div className="flex items-center gap-2 text-xs font-black text-rose-500">
                  <span className="w-3 h-3 bg-rose-400 rounded-full shadow-lg shadow-rose-100"></span> سلف
               </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontFamily: 'Tajawal'}} />
                <Area type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#dashboardGradient)" />
                <Area type="monotone" dataKey="advances" stroke="#fb7185" strokeWidth={3} fill="transparent" strokeDasharray="10 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Worker Balances */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800">أرصدة العمال</h3>
            <Users className="w-6 h-6 text-slate-200" />
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[420px] pr-2">
            {workerSummary.length === 0 ? (
              <div className="py-20 text-center text-slate-300 font-bold italic">لا يوجد سجلات حالياً</div>
            ) : workerSummary.map((w) => (
              <div 
                key={w.id} 
                onClick={() => onViewWorker(w.id)}
                className="group flex items-center justify-between p-4 rounded-3xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl font-black text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{w.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{w.role}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-indigo-600">{w.balance.toLocaleString()}</p>
                  <ChevronLeft className="w-4 h-4 text-slate-300 inline-block mr-2 group-hover:text-indigo-600 translate-x-1 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; suffix?: string; icon: React.ReactNode; trend?: string; color: string }> = ({ title, value, suffix = 'ج.م', icon, trend, color }) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-3xl transition-colors ${colors[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8" })}
        </div>
        {trend && (
          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full ring-1 ring-emerald-100">{trend}</span>
        )}
      </div>
      <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-slate-800">
        {value.toLocaleString()} <span className="text-sm font-normal text-slate-300">{suffix}</span>
      </h4>
    </div>
  );
};

export default Dashboard;
