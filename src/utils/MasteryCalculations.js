/**
 * Calculates the weighted mastery score for a subject based on topic accuracies and weights.
 * 
 * Mastery = Σ (TopicAccuracy * TopicWeight) / Σ (TopicWeight)
 * 
 * @param {Array} topics - Array of topic objects containing { accuracy, weight }
 * @returns {number} - The weighted mastery percentage (0-100)
 */
export const calculateWeightedMastery = (topics) => {
  if (!topics || topics.length === 0) return 0;

  let totalWeightedAccuracy = 0;
  let totalWeight = 0;

  topics.forEach(topic => {
    const accuracy = topic.accuracy || 0;
    const weight = topic.weight || 1;
    
    totalWeightedAccuracy += (accuracy * weight);
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;
  
  return Math.round(totalWeightedAccuracy / totalWeight);
};

/**
 * Returns a CSS class or hex color based on the mastery percentage.
 */
export const getMasteryColor = (percentage) => {
  if (percentage >= 80) return '#22c55e'; // green-500
  if (percentage >= 60) return '#eab308'; // yellow-500
  if (percentage >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

/**
 * Returns a yield label based on weight.
 */
export const getYieldLabel = (weight) => {
  if (weight >= 3) return 'High Yield';
  if (weight >= 2) return 'Medium Yield';
  return 'Low Yield';
};
