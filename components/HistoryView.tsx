
import React, { useState } from 'react';
import { DailyLog, Worker } from '../types';
import { Search, Trash2, Calendar, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Clock, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  logs: DailyLog[];
  workers: Worker[];
  deleteLog: (id: string) => void;
}

const HistoryView: React.FC<Props> = ({ logs, workers, deleteLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'work' | 'advance' | 'overtime'>('all');

  const filteredLogs = logs.filter(log => {
    const worker = workers.find(w => w.id === log.workerId);
    const matchesSearch = (worker?.name.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          log.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'work') return matchesSearch && log.isPresent;
    if (filterType === 'advance') return matchesSearch && log.advanceAmount > 0;
    if (filterType === 'overtime') return matchesSearch && log.otHours > 0;
    return matchesSearch;
  });

  const exportToExcel = () => {
    const data = filteredLogs.map(l => ({
      'التاريخ': l.date,
      'العامل': workers.find(w => w.id === l.workerId)?.name || 'محذوف',
      'المهمة': l.taskName,
      'الحالة': l.isPresent ? 'حاضر' : 'غائب',
      'ساعات إضافي': l.otHours,
      'إجمالي اليومية': l.totalEarnings,
      'قيمة السلفة': l.advanceAmount,
      'الصافي': l.totalEarnings - l.advanceAmount,
      'ملاحظات': l.note
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "اليوميات");
    XLSX.writeFile(workbook, `moushaf_report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-center no-print">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ابحث في السجلات..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <FilterBtn active={filterType === 'all'} onClick={() => setFilterType('all')} label="الكل" />
          <FilterBtn active={filterType === 'overtime'} onClick={() => setFilterType('overtime')} label="إضافي فقط" color="amber" />
          <FilterBtn active={filterType === 'advance'} onClick={() => setFilterType('advance')} label="سلفيات" color="rose" />
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
            <FileSpreadsheet className="w-5 h-5" /> تصدير Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-6 py-5">التاريخ</th>
                <th className="px-6 py-5">العامل</th>
                <th className="px-6 py-5">المهمة</th>
                <th className="px-6 py-5">ساعات إضافي</th>
                <th className="px-6 py-5">المستحق</th>
                <th className="px-6 py-5">السلفة</th>
                <th className="px-6 py-5">الصافي</th>
                <th className="px-6 py-5 no-print text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map(log => {
                const worker = workers.find(w => w.id === log.workerId);
                const net = log.totalEarnings - log.advanceAmount;
                return (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-600 text-sm">{log.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700">
                          {worker?.name.charAt(0) || '?'}
                        </div>
                        <span className="font-black text-slate-800">{worker?.name || 'محذوف'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{log.taskName}</td>
                    <td className="px-6 py-4">
                      {log.otHours > 0 ? (
                        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-black text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {log.otHours} ساعة
                        </div>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-black">{log.totalEarnings}</td>
                    <td className="px-6 py-4 text-rose-500 font-black">{log.advanceAmount > 0 ? `-${log.advanceAmount}` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-xl font-black ${net >= 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
                        {net} ج.م
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center no-print">
                      <button onClick={() => deleteLog(log.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="py-24 text-center">
            <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">لا توجد بيانات متاحة</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterBtn: React.FC<{ active: boolean; onClick: () => void; label: string; color?: string }> = ({ active, onClick, label, color }) => {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-600 shadow-amber-100',
    rose: 'bg-rose-600 shadow-rose-100',
    default: 'bg-indigo-600 shadow-indigo-100'
  };
  return (
    <button onClick={onClick} className={`px-5 py-3 rounded-2xl text-sm font-black transition-all ${active ? `${colorMap[color || 'default']} text-white shadow-lg` : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
      {label}
    </button>
  );
};

export default HistoryView;
