
import React, { useState } from 'react';
import { Worker } from '../types';
// Fixed: Added 'Users' to the import list from 'lucide-react'
import { UserPlus, Trash2, User, Briefcase, CreditCard, Clock, Users } from 'lucide-react';

interface Props {
  workers: Worker[];
  addWorker: (worker: Worker) => void;
  deleteWorker: (id: string) => void;
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
}

const WorkerManager: React.FC<Props> = ({ workers, addWorker, deleteWorker, selectedWorkerId, setSelectedWorkerId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    dailyRate: '',
    hourlyRate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dailyRate) return;

    const newWorker: Worker = {
      id: crypto.randomUUID(),
      name: formData.name,
      role: formData.role || 'عامل',
      dailyRate: parseFloat(formData.dailyRate),
      hourlyRate: parseFloat(formData.hourlyRate) || 0,
      createdAt: Date.now()
    };

    addWorker(newWorker);
    setFormData({ name: '', role: '', dailyRate: '', hourlyRate: '' });
    setShowAddForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">الطاقم ({workers.length})</h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          {showAddForm ? 'إلغاء' : 'إضافة عامل جديد'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 mb-8 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم العامل</label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="مثال: أحمد محمد"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">التخصص / المسمى</label>
              <div className="relative">
                <Briefcase className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="مثال: نحات، صنايعي، كودما..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">سعر اليومية (ج.م)</label>
              <div className="relative">
                <CreditCard className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={formData.dailyRate}
                  onChange={e => setFormData({...formData, dailyRate: e.target.value})}
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">سعر الساعة الإضافية (ج.م)</label>
              <div className="relative">
                <Clock className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={formData.hourlyRate}
                  onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            تأكيد الإضافة
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workers.map(worker => (
          <div 
            key={worker.id}
            onClick={() => setSelectedWorkerId(worker.id)}
            className={`group relative bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedWorkerId === worker.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-transparent shadow-sm hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                selectedWorkerId === worker.id ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {worker.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-800">{worker.name}</h4>
                <p className="text-sm text-slate-500">{worker.role}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteWorker(worker.id); }}
                className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">سعر اليومية</p>
                <p className="font-bold text-slate-700">{worker.dailyRate} <span className="text-xs font-normal">ج.م</span></p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">الساعة الإضافية</p>
                <p className="font-bold text-slate-700">{worker.hourlyRate} <span className="text-xs font-normal">ج.م</span></p>
              </div>
            </div>
          </div>
        ))}

        {workers.length === 0 && !showAddForm && (
          <div className="col-span-full py-16 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-slate-600 font-bold">لا يوجد عمال مسجلين</h4>
            <p className="text-slate-400 text-sm">ابدأ بإضافة أول عامل في الطاقم الخاص بك.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerManager;
