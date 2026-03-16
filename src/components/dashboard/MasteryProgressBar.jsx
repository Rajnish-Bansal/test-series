import { getMasteryColor } from '../../utils/MasteryCalculations';

export default function MasteryProgressBar({ percentage, label = "Subject Readiness", subLabel }) {
  const color = getMasteryColor(percentage);
  
  return (
    <div className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h2>
          {subLabel && <p className="text-slate-500 text-xs font-medium">{subLabel}</p>}
        </div>
        <div className="text-right">
          <span className="text-4xl font-black tabular-nums" style={{ color }}>{percentage}%</span>
        </div>
      </div>
      
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full shadow-lg"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}44`
          }}
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
        </div>
      </div>
      
      <div className="flex justify-between mt-3">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Beginner</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Advanced</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Master</span>
      </div>
    </div>
  );
}
