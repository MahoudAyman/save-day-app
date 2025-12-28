
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, X, Save, Table as TableIcon, UserCheck } from 'lucide-react';
import { Worker, DailyLog } from '../types';

interface ExtractedRow {
  date: string;
  taskName: string;
  totalEarnings: number;
  advanceAmount: number;
  otHours: number;
}

interface Props {
  workers: Worker[];
  onDataSaved: (logs: DailyLog[]) => void;
  onClose: () => void;
}

const ImageScanner: React.FC<Props> = ({ workers, onDataSaved, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedRow[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (base64Data: string) => {
    if (!selectedWorkerId) {
      setError("يرجى اختيار العامل أولاً قبل معالجة الصورة");
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedData([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        أنت محاسب محترف متخصص في كشوف عمال الإنشاءات. 
        استخرج البيانات من صورة دفتر الحسابات المرفقة.
        الجدول يحتوي عادة على الأعمدة التالية: التاريخ، ملحوظة (مثل "يوميه + 6")، مستلم (اليومية)، مدفوع (السلفة).
        
        تعليمات هامة:
        1. استخرج التاريخ وحوله لتنسيق YYYY-MM-DD.
        2. من عمود الملحوظة، إذا وجدت نص مثل "يوميه + 6" استخرج الرقم 6 كـ otHours.
        3. استخرج المبالغ في خانة "مستلم" كـ totalEarnings.
        4. استخرج المبالغ في خانة "مدفوع" كـ advanceAmount.
        
        أعد البيانات فقط في صيغة JSON Array تحتوي على الكائنات التالية:
        { "date": string, "taskName": string, "totalEarnings": number, "advanceAmount": number, "otHours": number }
        
        لا تضف أي نص توضيحي، فقط مصفوفة الـ JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data.split(',')[1],
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                taskName: { type: Type.STRING },
                totalEarnings: { type: Type.NUMBER },
                advanceAmount: { type: Type.NUMBER },
                otHours: { type: Type.NUMBER }
              },
              required: ["date", "taskName", "totalEarnings", "advanceAmount", "otHours"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      if (result.length > 0) {
        setExtractedData(result);
      } else {
        setError("لم نتمكن من قراءة أي بيانات. تأكد أن الصورة واضحة والجدول ظاهر بالكامل.");
      }
    } catch (err) {
      console.error(err);
      setError("فشل الذكاء الاصطناعي في تحليل الصورة. يرجى التأكد من اتصال الإنترنت ووضوح الصورة.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToLogs = () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker) return;

    const newLogs: DailyLog[] = extractedData.map(row => ({
      id: crypto.randomUUID(),
      workerId: selectedWorkerId,
      date: row.date,
      taskName: row.taskName,
      isPresent: row.totalEarnings > 0,
      otHours: row.otHours,
      otRate: worker.hourlyRate,
      advanceAmount: row.advanceAmount,
      note: 'مستخرج من ماسح ضوئي',
      totalEarnings: row.totalEarnings
    }));

    onDataSaved(newLogs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
              <Camera className="w-8 h-8" /> الماسح الضوئي الذكي
            </h2>
            <p className="text-slate-500 text-sm font-bold">حول صور الدفاتر الورقية إلى بيانات رقمية في ثوانٍ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!preview ? (
            <div className="space-y-6">
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-bold text-slate-700 mb-3 text-center">أولاً: اختر العامل الذي تتبعه هذه الصورة</label>
                <div className="relative">
                  <UserCheck className="absolute right-4 top-3.5 w-5 h-5 text-indigo-500" />
                  <select 
                    value={selectedWorkerId}
                    onChange={e => setSelectedWorkerId(e.target.value)}
                    className="w-full pr-12 pl-4 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900 appearance-none shadow-inner"
                  >
                    <option value="">-- اختر العامل --</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div 
                onClick={() => selectedWorkerId && fileInputRef.current?.click()}
                className={`border-4 border-dashed rounded-[40px] p-16 text-center transition-all cursor-pointer ${
                  !selectedWorkerId ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50 border-slate-200' : 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                  <Upload className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">اضغط هنا لرفع صورة الكشف</h3>
                <p className="text-slate-500 text-sm">يمكنك تصوير الكشف بالكاميرا أو اختيار صورة من المعرض</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><TableIcon className="w-5 h-5 text-indigo-500" /> معاينة الصورة</h4>
                <div className="rounded-3xl overflow-hidden border-4 border-slate-100 shadow-lg sticky top-0">
                  <img src={preview} alt="Preview" className="w-full h-auto" />
                  <button 
                    onClick={() => {setPreview(null); setExtractedData([]);}}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white"
                  >
                    <X className="w-5 h-5 text-rose-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> النتائج المستخرجة</h4>
                
                {loading ? (
                  <div className="bg-slate-50 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 border border-slate-100 animate-pulse">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="font-bold text-slate-600">جاري تحليل البيانات بالذكاء الاصطناعي...</p>
                  </div>
                ) : error ? (
                  <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center text-rose-700 space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto" />
                    <p className="font-bold">{error}</p>
                    <button onClick={() => processImage(preview)} className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold">إعادة المحاولة</button>
                  </div>
                ) : extractedData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-inner max-h-[400px] overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                          <tr>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3">الملحوظة</th>
                            <th className="p-3">مستلم</th>
                            <th className="p-3">مدفوع</th>
                            <th className="p-3">إضافي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {extractedData.map((row, i) => (
                            <tr key={i} className="hover:bg-indigo-50/50">
                              <td className="p-3 font-bold">{row.date}</td>
                              <td className="p-3 text-slate-500">{row.taskName}</td>
                              <td className="p-3 text-emerald-600 font-black">{row.totalEarnings}</td>
                              <td className="p-3 text-rose-500 font-black">{row.advanceAmount}</td>
                              <td className="p-3 text-amber-600 font-black">{row.otHours}س</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button 
                      onClick={saveToLogs}
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                      <Save className="w-6 h-6" /> تأكيد وحفظ {extractedData.length} سجل
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageScanner;
