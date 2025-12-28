
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  History, 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Download,
  Database,
  UserCheck,
  FileText,
  UploadCloud,
  X,
  Camera,
  FileSpreadsheet
} from 'lucide-react';
import { Worker, DailyLog } from './types';
import Dashboard from './components/Dashboard';
import WorkerManager from './components/WorkerManager';
import LogForm from './components/LogForm';
import HistoryView from './components/HistoryView';
import WorkerReport from './components/WorkerReport';
import ImageScanner from './components/ImageScanner';
import ExcelImporter from './components/ExcelImporter';

const STORAGE_KEY = 'moushaf_data_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workers' | 'logs' | 'history' | 'worker-details'>('dashboard');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWorkers(parsed.workers || []);
        setLogs(parsed.logs || []);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ workers, logs }));
  }, [workers, logs]);

  const addWorker = (worker: Worker) => setWorkers(prev => [...prev, worker]);
  const deleteWorker = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العامل؟')) {
      setWorkers(prev => prev.filter(w => w.id !== id));
      setLogs(prev => prev.filter(l => l.workerId !== id));
      if (selectedWorkerId === id) setSelectedWorkerId(null);
    }
  };

  const handleBulkLogs = (newLogs: DailyLog[]) => {
    setLogs(prev => [...newLogs, ...prev]);
    setActiveTab('history');
    alert(`تم بنجاح إضافة ${newLogs.length} سجل جديد.`);
  };

  const exportBackup = () => {
    const dataStr = JSON.stringify({ workers, logs, exportDate: new Date().toISOString() });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `moushaf_backup_${new Date().toLocaleDateString()}.json`);
    linkElement.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.workers && parsed.logs) {
          setWorkers(parsed.workers);
          setLogs(parsed.logs);
          alert('تم استعادة البيانات بنجاح!');
        }
      } catch (err) {
        alert('ملف غير صالح');
      }
    };
    reader.readAsText(file);
  };

  const handleViewWorker = (id: string) => {
    setSelectedWorkerId(id);
    setActiveTab('worker-details');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-tajawal text-right">
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-indigo-700 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg no-print">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          مُصحف اليوميات
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowExcelImport(true)} className="bg-emerald-500 p-2 rounded-lg shadow-inner"><FileSpreadsheet className="w-5 h-5" /></button>
          <button onClick={() => setActiveTab('logs')} className="bg-white p-2 rounded-lg text-indigo-700"><PlusCircle className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-indigo-950 text-white min-h-screen p-6 sticky top-0 no-print">
        <div className="mb-10 text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-900/50">
            <Wallet className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black">مُصحف PRO</h1>
          <p className="text-indigo-400 text-xs mt-1 uppercase tracking-widest font-bold">نظام الإدارة المتكامل</p>
        </div>

        <nav className="space-y-3 flex-1">
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="لوحة التحكم" />
          <SidebarLink active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={<Users />} label="إدارة العمال" />
          <SidebarLink active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<PlusCircle />} label="تسجيل يدوي" />
          <SidebarLink active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="السجل العام" />
          
          <div className="pt-4 pb-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-t border-white/10 mt-4">أدوات الاستيراد</div>
          <SidebarLink active={showExcelImport} onClick={() => setShowExcelImport(true)} icon={<FileSpreadsheet className="text-emerald-400" />} label="استيراد Excel" />
          <SidebarLink active={showScanner} onClick={() => setShowScanner(true)} icon={<Camera className="text-amber-400" />} label="ماسح الكشوف" />
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="text-xs font-bold text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-tighter">
              <UploadCloud className="w-3 h-3" /> النسخ الاحتياطي
            </h4>
            <div className="flex gap-2">
              <button onClick={exportBackup} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-[10px] font-bold transition-all text-center">تصدير</button>
              <label className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-all">
                استعادة
                <input type="file" className="hidden" onChange={importBackup} accept=".json" />
              </label>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="hidden md:flex justify-between items-center mb-10 no-print">
          <div>
            <h2 className="text-3xl font-black text-slate-800">
              {activeTab === 'dashboard' && 'الرئيسية'}
              {activeTab === 'workers' && 'فريق العمل'}
              {activeTab === 'logs' && 'تسجيل بيانات'}
              {activeTab === 'history' && 'كافة المعاملات'}
              {activeTab === 'worker-details' && 'تقرير العامل المفصل'}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
              <FileText className="w-4 h-4" />
              <span>نظام موثق لإدارة {workers.length} عاملاً نشطاً</span>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setShowExcelImport(true)} className="bg-white border border-emerald-200 px-6 py-3 rounded-xl font-bold text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-sm">
               <FileSpreadsheet className="w-5 h-5" /> استيراد Excel
             </button>
             <button onClick={() => setActiveTab('logs')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
               <PlusCircle className="w-5 h-5" /> سجل جديد
             </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard workers={workers} logs={logs} onViewWorker={handleViewWorker} />}
        {activeTab === 'workers' && (
          <WorkerManager 
            workers={workers} 
            addWorker={addWorker} 
            deleteWorker={deleteWorker} 
            selectedWorkerId={selectedWorkerId}
            setSelectedWorkerId={handleViewWorker}
          />
        )}
        {activeTab === 'logs' && (
          <LogForm 
            workers={workers} 
            addLog={(l) => { setLogs(p => [l, ...p]); setActiveTab('dashboard'); }} 
            initialWorkerId={selectedWorkerId}
            onSuccess={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'history' && <HistoryView logs={logs} workers={workers} deleteLog={(id) => setLogs(p => p.filter(l => l.id !== id))} />}
        {activeTab === 'worker-details' && selectedWorkerId && (
          <WorkerReport 
            worker={workers.find(w => w.id === selectedWorkerId)!} 
            logs={logs.filter(l => l.workerId === selectedWorkerId)} 
            onClose={() => setActiveTab('workers')}
          />
        )}

        {/* Modals */}
        {showScanner && (
          <ImageScanner 
            workers={workers} 
            onDataSaved={handleBulkLogs} 
            onClose={() => setShowScanner(false)} 
          />
        )}
        {showExcelImport && (
          <ExcelImporter 
            workers={workers} 
            onDataSaved={handleBulkLogs} 
            onClose={() => setShowExcelImport(false)} 
          />
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-3 z-50 no-print shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]">
        <MobileNavLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="لوحة" />
        <MobileNavLink active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={<Users />} label="عمال" />
        <div className="relative -mt-8">
           <button onClick={() => setActiveTab('logs')} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200"><PlusCircle /></button>
        </div>
        <MobileNavLink active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="سجل" />
        <MobileNavLink active={showExcelImport} onClick={() => setShowExcelImport(true)} icon={<FileSpreadsheet />} label="Excel" />
      </nav>
    </div>
  );
};

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950' : 'text-indigo-300 hover:bg-white/5'}`}>
    {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
    <span>{label}</span>
  </button>
);

const MobileNavLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
    {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
