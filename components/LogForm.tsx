
import React, { useState, useEffect } from 'react';
import { Worker, DailyLog } from '../types';
import { Calendar, User, Briefcase, Clock, Wallet, FileText, CheckCircle } from 'lucide-react';

interface Props {
  workers: Worker[];
  addLog: (log: DailyLog) => void;
  initialWorkerId: string | null;
  onSuccess: () => void;
}

const LogForm: React.FC<Props> = ({ workers, addLog, initialWorkerId, onSuccess }) => {
  const [workerId, setWorkerId] = useState(initialWorkerId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPresent, setIsPresent] = useState(true);
  const [taskName, setTaskName] = useState('');
  const [otHours, setOtHours] = useState('0');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialWorkerId) setWorkerId(initialWorkerId);
  }, [initialWorkerId]);

  const selectedWorker = workers.find(w => w.id === workerId);

  const calculateTotal = () => {
    if (!selectedWorker) return 0;
    const base = isPresent ? selectedWorker.dailyRate : 0;
    const ot = parseFloat(otHours) || 0;
    const otPay = ot * selectedWorker.hourlyRate;
    return base + otPay;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;

    const totalEarnings = calculateTotal();

    const newLog: DailyLog = {
      id: crypto.randomUUID(),
      workerId,
      date,
      taskName: taskName || 'عمل يومي',
      isPresent,
      otHours: parseFloat(otHours) || 0,
      otRate: selectedWorker?.hourlyRate || 0,
      advanceAmount: parseFloat(advanceAmount) || 0,
      note,
      totalEarnings
    };

    addLog(newLog);
    onSuccess();
  };

  if (workers.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl text-center">
        <h4 className="text-amber-800 font-bold mb-2 text-xl">لا يمكنك التسجيل حالياً</h4>
        <p className="text-amber-700">يجب عليك إضافة عمال أولاً قبل التمكن من تسجيل يومياتهم.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-indigo-600 p-8 text-white relative">
        <h3 className="text-2xl font-black mb-1">تسجيل يومية</h3>
        <p className="text-indigo-100 text-sm">أدخل تفاصيل العمل والسلف ليوم {date}</p>
        <CheckCircle className="absolute left-8 top-10 w-12 h-12 text-white/20" />
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Worker Select */}
          <div className="col-span-full">
            <label className="block text-sm font-bold text-slate-700 mb-2">اختر العامل</label>
            <div className="relative">
              <User className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <select 
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-slate-800"
                required
              >
                <option value="">-- اختر من القائمة --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ اليوم</label>
            <div className="relative">
              <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Attendance Toggle */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsPresent(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  isPresent ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                حضور
              </button>
              <button 
                type="button"
                onClick={() => setIsPresent(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  !isPresent ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                غائب
              </button>
            </div>
          </div>

          {/* Task / Project */}
          <div className="col-span-full">
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المشروع / المهمة</label>
            <div className="relative">
              <Briefcase className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="مثال: نحت الواجهة، صب الأرضيات..."
              />
            </div>
          </div>

          {/* OT Hours */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ساعات إضافية (س)</label>
            <div className="relative">
              <Clock className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                step="0.5"
                value={otHours}
                onChange={e => setOtHours(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>
          </div>

          {/* Advance Amount */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">سلفة اليوم (ج.م)</label>
            <div className="relative">
              <Wallet className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-rose-600"
              />
            </div>
          </div>

          {/* Note */}
          <div className="col-span-full">
            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات إضافية</label>
            <div className="relative">
              <FileText className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <textarea 
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="أي تفاصيل أخرى..."
              />
            </div>
          </div>
        </div>

        {/* Calculation Preview */}
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
           <div className="flex justify-between items-center mb-2">
             <span className="text-slate-600 font-medium">مستحق اليوم (+إضافي):</span>
             <span className="text-xl font-black text-indigo-700">{calculateTotal()} ج.م</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <span className="text-slate-500">مخصوم سلفة:</span>
             <span className="text-rose-500 font-bold">-{advanceAmount || 0} ج.م</span>
           </div>
           <div className="border-t border-indigo-200 mt-3 pt-3 flex justify-between items-center">
             <span className="text-slate-800 font-bold text-lg">صافي الربح المُرحل:</span>
             <span className="text-2xl font-black text-emerald-600">{(calculateTotal() - (parseFloat(advanceAmount) || 0))} ج.م</span>
           </div>
        </div>

        <button 
          type="submit" 
          disabled={!workerId}
          className={`w-full py-4 rounded-2xl font-black text-xl transition-all shadow-xl ${
            !workerId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          حفظ السجل الآن
        </button>
      </form>
    </div>
  );
};

export default LogForm;
