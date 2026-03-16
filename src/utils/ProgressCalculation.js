
/**
 * ProgressCalculation Service
 * Handles weighted accuracy calculations and threshold constraints.
 */

export const ProgressCalculation = {

    /**
     * Build weight index for O(1) lookup from structure data
     */
    buildWeightIndex: (structureData) => {
        const weightIndex = {};
        if (!Array.isArray(structureData)) return weightIndex;
        
        structureData.forEach(subject => {
            if (!subject.modules) return;
            subject.modules.forEach(module => {
                if (!module.topics) return;
                module.topics.forEach(topic => {
                    if (typeof topic === 'object') {
                        weightIndex[topic.name] = { weight: topic.weight, priority: topic.priority };
                    }
                });
            });
        });
        return weightIndex;
    },

    /**
     * Get weight for a specific subtopic
     */
    getWeight: (subject, subtopic, weightIndex = {}) => {
        // We only have weights for Polity right now
        if (subject !== 'Polity') return { weight: 1.0, priority: 'Normal' };

        // Strip "Ch X: " prefix if present for lookup
        const cleanTag = subtopic.replace(/^Ch \d+(-\d+)?: /, "");

        // Instant lookup using pre-calculated index
        return weightIndex[cleanTag] || { weight: 1.0, priority: 'Normal' };
    },

    /**
     * Calculate weighted progress
     * Returns { percentage, highYieldAccuracy }
     */
    calculateWeightedProgress: (subject, statsBySubtopic, systemStatsBySubtopic, weightIndex = {}) => {
        let totalWeightedPoints = 0;
        let earnedWeightedPoints = 0;

        let highYieldTotal = 0;
        let highYieldCorrect = 0;

        // Iterate through all subtopics in the subject
        Object.keys(systemStatsBySubtopic).forEach(tag => {
            const { weight, priority } = ProgressCalculation.getWeight(subject, tag, weightIndex);
            const totalQuestions = systemStatsBySubtopic[tag] || 0;

            // Stats for this tag (correct questions)
            const tagStats = statsBySubtopic[tag] || {};
            const correctCount = Array.isArray(tagStats.correctIds)
                ? tagStats.correctIds.length
                : (tagStats.correct || 0);

            // Weighted calculation
            totalWeightedPoints += totalQuestions * weight;
            earnedWeightedPoints += correctCount * weight;

            // Track High Yield (3x) separately for the 75% cap rule
            if (weight === 3.0) {
                highYieldTotal += totalQuestions;
                highYieldCorrect += correctCount;
            }
        });

        const rawPercentage = totalWeightedPoints > 0
            ? Math.round((earnedWeightedPoints / totalWeightedPoints) * 100)
            : 0;

        const highYieldAccuracy = highYieldTotal > 0
            ? Math.round((highYieldCorrect / highYieldTotal) * 100)
            : 0;

        // Apply Green Zone Logic: 
        // Cannot hit > 75% if High Yield (3x) accuracy is < 70%
        let finalPercentage = rawPercentage;
        if (rawPercentage > 75 && highYieldAccuracy < 70) {
            finalPercentage = 75;
        }

        return {
            percentage: finalPercentage,
            rawPercentage,
            highYieldAccuracy,
            isCapped: rawPercentage > 75 && highYieldAccuracy < 70
        };
    },

    /**
     * Get performance summary (Strong vs Weak)
     * Returns { strong: [], weak: [] }
     */
    getPerformanceSummary: (subject, statsBySubtopic, systemStatsBySubtopic, weightIndex = {}) => {
        const analysis = Object.keys(systemStatsBySubtopic).map(tag => {
            const tagTotal = systemStatsBySubtopic[tag] || 0;
            const tagStats = statsBySubtopic[tag] || {};
            const correctCount = Array.isArray(tagStats.correctIds)
                ? tagStats.correctIds.length
                : (tagStats.correct || 0);

            const accuracy = tagTotal > 0 ? (correctCount / tagTotal) * 100 : -1;
            const { weight } = ProgressCalculation.getWeight(subject, tag, weightIndex);

            return { tag, accuracy, weight, count: tagTotal };
        }).filter(item => item.count > 0); // Only topics with questions

        const strong = analysis
            .filter(item => item.accuracy >= 75)
            .sort((a, b) => b.accuracy - a.accuracy)
            .slice(0, 6);

        const weak = analysis
            .filter(item => item.accuracy >= 0 && item.accuracy < 60)
            .sort((a, b) => {
                // Prioritize 3x topics in weak list
                if (a.weight !== b.weight) return b.weight - a.weight;
                return a.accuracy - b.accuracy;
            })
            .slice(0, 6);

        return { strong, weak };
    }
};
