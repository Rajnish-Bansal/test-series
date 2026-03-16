import connectToDatabase from '../lib/db.js';
import Session from '../models/Session.js';
import { verifyToken } from '../lib/authMiddleware.js';

export default async function handler(req, res) {
    await connectToDatabase();

    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { subject, topic: legacySubject } = req.query;
        const activeSubject = subject || legacySubject;
        const query = activeSubject ? { userId: decoded.id, $or: [{ subject: activeSubject }, { topic: activeSubject }] } : { userId: decoded.id };

        // Fetch all relevant sessions for this user
        const sessions = await Session.find(query).select('subject topic subtopic topicAccuracy isSectional answers');

        // Aggregate stats
        const cumulativeStats = {};
        
        sessions.forEach(session => {
            // 1. New Structure: Aggregate from session.answers
            if (session.answers && Array.isArray(session.answers)) {
                session.answers.forEach(ans => {
                    const subj = ans.subject || session.subject || session.topic;
                    const subtopic = ans.subtopic || ans.microTag || 'General';
                    if (!subj) return;

                    if (!cumulativeStats[subj]) {
                        cumulativeStats[subj] = { correctIds: [], attemptedIds: [], subtopics: {} };
                    }
                    if (!cumulativeStats[subj].subtopics[subtopic]) {
                        cumulativeStats[subj].subtopics[subtopic] = { correctIds: [], attemptedIds: [] };
                    }

                    const qId = ans.questionId || ans._id;
                    if (qId) {
                        if (!cumulativeStats[subj].attemptedIds.includes(qId)) {
                            cumulativeStats[subj].attemptedIds.push(qId);
                        }
                        if (!cumulativeStats[subj].subtopics[subtopic].attemptedIds.includes(qId)) {
                            cumulativeStats[subj].subtopics[subtopic].attemptedIds.push(qId);
                        }

                        if (ans.isCorrect) {
                            if (!cumulativeStats[subj].correctIds.includes(qId)) {
                                cumulativeStats[subj].correctIds.push(qId);
                            }
                            if (!cumulativeStats[subj].subtopics[subtopic].correctIds.includes(qId)) {
                                cumulativeStats[subj].subtopics[subtopic].correctIds.push(qId);
                            }
                        }
                    }
                });
            }
            // 2. Legacy Structure: Merge topicAccuracy (if answers array is missing or for backward compatibility)
            else if (session.topicAccuracy) {
                for (const [sSubj, stats] of session.topicAccuracy.entries()) {
                    const targetSubj = sSubj;
                    if (!cumulativeStats[targetSubj]) {
                        cumulativeStats[targetSubj] = { correctIds: [], attemptedIds: [], subtopics: {} };
                    }
                    
                    const legacyTags = stats.microTags || {};
                    for (const [tag, tagStats] of Object.entries(legacyTags)) {
                        if (!cumulativeStats[targetSubj].subtopics[tag]) {
                            cumulativeStats[targetSubj].subtopics[tag] = { correctIds: [], attemptedIds: [] };
                        }
                        
                        if (tagStats.correctIds) {
                            cumulativeStats[targetSubj].subtopics[tag].correctIds = Array.from(new Set([...cumulativeStats[targetSubj].subtopics[tag].correctIds, ...tagStats.correctIds]));
                            cumulativeStats[targetSubj].subtopics[tag].attemptedIds = Array.from(new Set([...cumulativeStats[targetSubj].subtopics[tag].attemptedIds, ...tagStats.attemptedIds]));
                            
                            // Also update subject-level sets
                            cumulativeStats[targetSubj].correctIds = Array.from(new Set([...cumulativeStats[targetSubj].correctIds, ...tagStats.correctIds]));
                            cumulativeStats[targetSubj].attemptedIds = Array.from(new Set([...cumulativeStats[targetSubj].attemptedIds, ...tagStats.attemptedIds]));
                        } else {
                            cumulativeStats[targetSubj].subtopics[tag].correct = (cumulativeStats[targetSubj].subtopics[tag].correct || 0) + (tagStats.correct || 0);
                            cumulativeStats[targetSubj].subtopics[tag].total = (cumulativeStats[targetSubj].subtopics[tag].total || 0) + (tagStats.total || 0);
                        }
                    }
                }
            }
        });

        return res.status(200).json({ success: true, cumulativeStats });
    } catch (error) {
        console.error('Error calculating stats:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
}
