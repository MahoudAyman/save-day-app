
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, X, Upload, CheckCircle2, AlertCircle, Save, Table as TableIcon, UserCheck } from 'lucide-react';
import { Worker, DailyLog } from '../types';

interface ExtractedRow {
  date: string;
  taskName: string;
  totalEarnings: number;
  advanceAmount: number;
  otHours: number;
  isPresent: boolean;
}

interface Props {
  workers: Worker[];
  onDataSaved: (logs: DailyLog[]) => void;
  onClose: () => void;
}

const ExcelImporter: React.FC<Props> = ({ workers, onDataSaved, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedRow[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // دالة ذكية لتحليل الملحوظات العربية
  const parseArabicNote = (note: string) => {
    const n = note || '';
    const isPresent = n.includes('يوميه') || n.includes('يومية') || n.includes('عامل');
    
    // استخراج الساعات الإضافية (مثلاً: يوميه + 6 أو ساعات 6)
    const otMatch = n.match(/(?:\+|\s)(\d+(?:\.\d+)?)/) || n.match(/ساعات\s*(\d+(?:\.\d+)?)/);
    const otHours = otMatch ? parseFloat(otMatch[1]) : 0;

    return { isPresent, otHours };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedWorkerId) {
      setError("يرجى اختيار العامل أولاً قبل رفع الملف");
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // تحويل البيانات مع الحفاظ على الترتيب الأبجدي للأعمدة A, B, C, D
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 'A', defval: '' });
        
        const processedRows: ExtractedRow[] = [];

        // تحليل الصفوف ابتداءً من صف البيانات (عادة بعد الصف 6 في تنسيق الإكسيل المرفق)
        jsonData.forEach((row, index) => {
          // نتخطى العناوين والصفوف الفارغة تماماً
          if (index < 5) return; 

          const dateStr = row['A']?.toString().trim();
          const note = row['B']?.toString().trim() || '';
          const received = parseFloat(row['C']) || 0; // خانة "مستلم" (أرباح العامل)
          const paid = parseFloat(row['D']) || 0;     // خانة "مدفوع" (سلفيات من العامل)

          if (dateStr && dateStr !== 'التاريخ' && dateStr !== 'الرصيد السابق') {
            const { isPresent, otHours } = parseArabicNote(note);
            
            processedRows.push({
              date: dateStr,
              taskName: note || (received > 0 ? 'يومية عمل' : 'سلفة مادية'),
              totalEarnings: received,
              advanceAmount: paid,
              otHours: otHours,
              isPresent: isPresent || received > 0
            });
          }
        });

        if (processedRows.length > 0) {
          setExtractedData(processedRows);
        } else {
          setError("لم نجد بيانات صالحة. تأكد أن العمود A للتاريخ، B للملحوظة، C للمستلم، D للمدفوع.");
        }
      } catch (err) {
        setError("فشل في قراءة ملف Excel. تأكد من سلامة الملف.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveToLogs = () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) return;

    const newLogs: DailyLog[] = extractedData.map(row => ({
      id: crypto.randomUUID(),
      workerId: selectedWorkerId,
      date: row.date,
      taskName: row.taskName,
      isPresent: row.isPresent,
      otHours: row.otHours,
      otRate: worker.hourlyRate,
      advanceAmount: row.advanceAmount,
      note: 'استيراد إكسيل ذكي',
      totalEarnings: row.totalEarnings
    }));

    onDataSaved(newLogs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-900">المستورد الذكي (Excel)</h2>
              <p className="text-slate-500 text-xs font-bold">تحليل اليوميات، السلف، والساعات من الملف مباشرة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-md mx-auto mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3 text-center">اختيار العامل لتنزيل البيانات في حسابه</label>
            <div className="relative">
              <UserCheck className="absolute right-4 top-3.5 w-5 h-5 text-emerald-500" />
              <select 
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-900 appearance-none shadow-sm"
              >
                <option value="">-- اختر العامل من القائمة --</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.role})</option>)}
              </select>
            </div>
          </div>

          {!extractedData.length ? (
            <div 
              onClick={() => selectedWorkerId && fileInputRef.current?.click()}
              className={`border-4 border-dashed rounded-[40px] p-16 text-center transition-all cursor-pointer group ${
                !selectedWorkerId ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50' : 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">اضغط لرفع ملف Excel</h3>
              <p className="text-slate-400 text-sm font-bold">تأكد أن الملف يحتوي على أعمدة (التاريخ، الملحوظة، مستلم، مدفوع)</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> تم تحليل {extractedData.length} صف من البيانات
                </h4>
                <button onClick={() => {setExtractedData([]); setFileName(null);}} className="text-rose-500 text-sm font-bold hover:underline">إلغاء ورفع ملف آخر</button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-inner max-h-[400px] overflow-y-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-black border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">الحالة (الملحوظة)</th>
                      <th className="p-4">مستلم (يومية)</th>
                      <th className="p-4">مدفوع (سلفة)</th>
                      <th className="p-4">إضافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {extractedData.map((row, i) => (
                      <tr key={i} className={`hover:bg-emerald-50/30 ${row.isPresent ? '' : 'bg-rose-50/20'}`}>
                        <td className="p-4 font-bold text-slate-600">{row.date}</td>
                        <td className="p-4 font-bold text-slate-500">
                           <span className={row.isPresent ? 'text-emerald-700' : 'text-rose-600'}>
                              {row.taskName}
                           </span>
                        </td>
                        <td className="p-4 text-emerald-600 font-black">{row.totalEarnings}</td>
                        <td className="p-4 text-rose-500 font-black">{row.advanceAmount}</td>
                        <td className="p-4">
                          {row.otHours > 0 ? (
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">
                              {row.otHours} ساعة
                            </span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button 
                onClick={saveToLogs}
                className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-7 h-7" /> اعتماد وحفظ البيانات في السجل
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-5 bg-rose-50 border-2 border-rose-100 rounded-[30px] text-rose-700 flex items-center gap-4 animate-shake">
              <AlertCircle className="w-8 h-8 shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImporter;
