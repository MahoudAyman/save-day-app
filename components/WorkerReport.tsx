
import React from 'react';
import { Worker, DailyLog } from '../types';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Wallet, 
  TrendingUp, 
  Download, 
  Printer, 
  BarChart2,
  CheckCircle,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

interface Props {
  worker: Worker;
  logs: DailyLog[];
  onClose: () => void;
}

const WorkerReport: React.FC<Props> = ({ worker, logs, onClose }) => {
  const totalEarned = logs.reduce((acc, l) => acc + l.totalEarnings, 0);
  const totalAdvanced = logs.reduce((acc, l) => acc + l.advanceAmount, 0);
  const totalOT = logs.reduce((acc, l) => acc + l.otHours, 0);
  const daysWorked = logs.filter(l => l.isPresent).length;
  const balance = totalEarned - totalAdvanced;

  const chartData = logs.slice().reverse().map(l => ({
    date: l.date,
    earned: l.totalEarnings,
    advanced: l.advanceAmount
  }));

  const exportExcel = () => {
    const data = logs.map(l => ({
      'التاريخ': l.date,
      'المهمة': l.taskName,
      'ساعات إضافي': l.otHours,
      'اليومية': l.totalEarnings,
      'السلفة': l.advanceAmount,
      'الصافي': l.totalEarnings - l.advanceAmount,
      'ملاحظات': l.note
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير العامل");
    XLSX.writeFile(wb, `تقرير_${worker.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between no-print">
        <button onClick={onClose} className="flex items-center gap-2 text-indigo-600 font-bold hover:translate-x-1 transition-transform">
          <ArrowRight className="w-5 h-5" /> الرجوع للقائمة
        </button>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-100">
            <Download className="w-5 h-5" /> تصدير Excel
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200">
            <Printer className="w-5 h-5" /> طباعة PDF
          </button>
        </div>
      </div>

      {/* Header Profile */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 rounded-br-[80px] -z-10 opacity-50"></div>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-200">
            {worker.name.charAt(0)}
          </div>
          <div className="text-center md:text-right flex-1">
            <h1 className="text-4xl font-black text-slate-800 mb-2">{worker.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500">
              <span className="flex items-center gap-1.5 font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /> {worker.role}</span>
              <span className="flex items-center gap-1.5 font-bold border-r pr-4 border-slate-200"><Calendar className="w-4 h-4" /> منذ {new Date(worker.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="bg-indigo-950 text-white p-6 rounded-3xl min-w-[240px] shadow-xl shadow-indigo-900/20">
             <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">الرصيد المتبقي</p>
             <h2 className="text-4xl font-black">{balance.toLocaleString()} <span className="text-sm font-normal opacity-60">ج.م</span></h2>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="إجمالي المستحق" value={totalEarned} icon={<TrendingUp className="text-emerald-500" />} color="emerald" />
        <MiniStat label="إجمالي السلف" value={totalAdvanced} icon={<Wallet className="text-rose-500" />} color="rose" />
        <MiniStat label="ساعات إضافي" value={totalOT} icon={<Clock className="text-amber-500" />} color="amber" suffix="ساعة" />
        <MiniStat label="أيام العمل" value={daysWorked} icon={<Calendar className="text-indigo-500" />} color="indigo" suffix="يوم" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-indigo-500" /> تحليل الأداء المالي
             </h3>
             <div className="flex gap-4 text-xs font-bold">
                <span className="flex items-center gap-2 text-indigo-600"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> المكتسب</span>
                <span className="flex items-center gap-2 text-rose-500"><div className="w-3 h-3 rounded-full bg-rose-400"></div> السلف</span>
             </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="workerChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="earned" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#workerChart)" />
                <Area type="monotone" dataKey="advanced" stroke="#fb7185" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latest Transactions */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
             <FileText className="w-6 h-6 text-indigo-500" /> آخر النشاطات
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {logs.slice(0, 10).map(log => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase">{log.date}</span>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.isPresent ? 'حاضر' : 'غائب'}
                   </span>
                </div>
                <h4 className="font-bold text-slate-700 text-sm mb-3">{log.taskName}</h4>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                   <div className="flex gap-3">
                      <span className="text-xs font-black text-indigo-600">+{log.totalEarnings}</span>
                      {log.advanceAmount > 0 && <span className="text-xs font-black text-rose-500">-{log.advanceAmount}</span>}
                   </div>
                   <span className="text-xs font-black text-slate-800">{(log.totalEarnings - log.advanceAmount)} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; suffix?: string }> = ({ label, value, icon, color, suffix = 'ج.م' }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-${color}-50`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-800">{value.toLocaleString()} <span className="text-[10px] font-normal opacity-50">{suffix}</span></h4>
    </div>
  </div>
);

export default WorkerReport;
