import { useState, useEffect, useMemo } from 'react';
import { Target, Info, AlertCircle, Search, Loader2 } from 'lucide-react';
import TopicCard from './TopicCard';
import MasteryProgressBar from './MasteryProgressBar';
import { calculateWeightedMastery } from '../../utils/MasteryCalculations';

export default function SubjectMasteryDashboard({ cumulativeStats = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [structureData, setStructureData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStructureData(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch subjects:', err))
      .finally(() => setLoading(false));
  }, []);
  
  // derivation logic for accuracy per topic
  const getTopicAccuracy = (topicName) => {
    const polityStats = cumulativeStats?.Polity?.microTags || {};
    let sumAcc = 0;
    let count = 0;
    
    Object.entries(polityStats).forEach(([tag, stats]) => {
      if (tag.includes(topicName) || topicName.includes(tag)) {
        const total = stats.correct + (stats.incorrect || 0);
        if (total > 0) {
          sumAcc += (stats.correct / total) * 100;
          count++;
        }
      }
    });
    
    return count > 0 ? Math.round(sumAcc / count) : 0;
  };

  const dashboardData = useMemo(() => {
    if (!structureData) return { allTopics: [], filteredTopics: [], overallMastery: 0 };
    
    const polityData = structureData.find(s => s.name === 'Polity');
    if (!polityData) return { allTopics: [], filteredTopics: [], overallMastery: 0 };

    let allTopics = [];
    
    polityData.modules.forEach(module => {
      const moduleSubtopics = module.topics.map(t => {
        const name = typeof t === 'string' ? t : t.name;
        const weight = t?.weight || (typeof t === 'object' ? t.weight : 1.0) || 1.0;
        return { name, weight };
      });

      // Simple average weight for the module card
      const avgWeight = moduleSubtopics.reduce((acc, t) => acc + t.weight, 0) / (moduleSubtopics.length || 1);
      const priority = avgWeight >= 3 ? 'High Yield' : avgWeight >= 2 ? 'Medium Yield' : 'Low Yield';
      const badge = avgWeight >= 3 ? '🔥 High Yield' : avgWeight >= 2 ? '⚡ Medium Yield' : '🌱 Low Yield';

      const accuracy = getTopicAccuracy(module.name);
      
      allTopics.push({ 
        topic_id: module.name,
        name: module.name, 
        accuracy, 
        weight: Math.round(avgWeight), 
        badge,
        subtopics: moduleSubtopics
      });
    });

    const filteredTopics = searchTerm 
      ? allTopics.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : allTopics;

    const overallMastery = calculateWeightedMastery(allTopics);

    return { allTopics, filteredTopics, overallMastery };
  }, [cumulativeStats, searchTerm, structureData]);

  const handleStartTest = (topicId, topicName, subtopicTags = []) => {
    // Navigate to exam with subject and topic (Level 2)
    window.location.href = `/exam?subject=Polity&topic=${encodeURIComponent(topicName)}`;
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      {/* Topics Header & Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-upsc-blue" />
            Topic-wise Test
          </h2>
          
          <div className="relative group min-w-0 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-upsc-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Filter topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-upsc-blue/20 focus:border-upsc-blue transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-upsc-blue" />
          </div>
        ) : dashboardData.filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {dashboardData.filteredTopics.map((topic) => {
              // Re-calculate visual index based on original sorted list
              const actualIndex = dashboardData.allTopics.findIndex(t => t.topic_id === topic.topic_id) + 1;
              return (
                <TopicCard 
                  key={topic.topic_id}
                  index={actualIndex}
                  topic={topic}
                  weight={topic.weight}
                  badge={topic.badge}
                  accuracy={topic.accuracy}
                  subtopics={topic.subtopics}
                  onStartTest={handleStartTest}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No topics match "{searchTerm}"</h3>
            <p className="text-slate-400 text-sm">Try searching for a different keyword or subtopic name.</p>
          </div>
        )}
      </div>
    </div>
  );
}
