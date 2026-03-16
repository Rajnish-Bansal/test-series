import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, CheckCircle, Circle, Target } from 'lucide-react';

export default function TopicCard({ topic, index, weight, badge, accuracy = 0, subtopics = [], onStartTest }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (acc) => {
    if (acc >= 80) return 'text-green-500';
    if (acc >= 60) return 'text-yellow-500';
    if (acc >= 40) return 'text-orange-500';
    if (acc > 0) return 'text-red-500';
    return 'text-slate-300';
  };

  const getProgressBg = (acc) => {
    if (acc >= 80) return 'bg-green-500';
    if (acc >= 60) return 'bg-yellow-500';
    if (acc >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Parent Level: Topic Card Header */}
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-shrink-0 mr-4 flex flex-col items-center justify-center w-12 h-12 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-lg font-black text-slate-800 leading-none">{String(index).padStart(2, '0')}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              weight === 3 ? 'bg-red-100 text-red-600' : 
              weight === 2 ? 'bg-orange-100 text-orange-600' : 
              'bg-blue-100 text-blue-600'
            }`}>
              {badge}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-tight mb-3">{topic.name}</h3>
          
          {/* Mastery Bar */}
          <div className="space-y-1.5 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Mastery</span>
              <span className={`text-sm font-black whitespace-nowrap ${getStatusColor(accuracy)}`}>
                {accuracy}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${getProgressBg(accuracy)}`}
                style={{ width: `${accuracy}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const subtopicTags = subtopics.map(ch => ch.name);
              onStartTest && onStartTest(topic.topic_id, topic.name, subtopicTags);
            }}
            className="p-3 bg-upsc-blue hover:bg-upsc-blue-dark text-white rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold hidden sm:inline">Start Test</span>
          </button>
          
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Child Level: Subtopic List (Accordion) */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 bg-slate-50/50 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtopics Breakdown</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subtopics.map((subtopic) => (
              <div 
                key={subtopic.id}
                onClick={(e) => e.stopPropagation()} // Prevent parent collapse/test
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-300 w-5">{subtopic.id}</span>
                  <span className="text-sm font-semibold text-slate-700">{subtopic.name}</span>
                </div>
                
                {/* Subtopic status badge (Mocked status for MVP) */}
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${
                    accuracy > 70 ? 'bg-green-50 text-green-600 border border-green-100' :
                    accuracy > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                    'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {accuracy > 70 ? (
                      <><CheckCircle className="w-3 h-3" /> Mastered</>
                    ) : accuracy > 0 ? (
                      <><Target className="w-3 h-3" /> Learning</>
                    ) : (
                      <><Circle className="w-3 h-3" /> Unread</>
                    )}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Start test for ONLY this specific subtopic
                      onStartTest && onStartTest(topic.topic_id, subtopic.name, []);
                    }}
                    className="p-1.5 bg-white hover:bg-upsc-blue hover:text-white text-slate-400 border border-slate-200 rounded-lg transition-all shadow-sm"
                    title={`Start ${subtopic.name} Test`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
