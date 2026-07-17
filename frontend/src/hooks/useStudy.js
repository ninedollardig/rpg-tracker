import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

export function useStudy() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [step1, setStep1] = useState(null);
  const [insights, setInsights] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try { setSessions(await apiGet('/study')); } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchSession = useCallback(async (id) => {
    setLoading(true);
    try {
      const d = await apiGet(`/study/${id}`);
      setCurrentSession(d.session);
      setStep1(d.step1);
      setInsights(d.insights || []);
      setCards(d.cards || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const createSession = useCallback(async ({ title, subject, raw_material }) => {
    setProcessing(true);
    try {
      const d = await apiPost('/study', { title, subject, raw_material });
      setCurrentSession(d.session);
      setStep1(d.step1);
      setInsights([]);
      setCards([]);
      return d;
    } finally {
      setProcessing(false);
    }
  }, []);

  const runStep2Action = useCallback(async (sessionId, actionType, userPrompt) => {
    const d = await apiPost(`/study/${sessionId}/step2`, { action_type: actionType, user_prompt: userPrompt || '' });
    setInsights(prev => [d.insight, ...prev]);
    setCurrentSession(prev => prev ? { ...prev, status: 'step2' } : prev);
    return d.insight;
  }, []);

  const toggleSaveInsight = useCallback(async (sessionId, insightId) => {
    const d = await apiPut(`/study/${sessionId}/step2/${insightId}/save`);
    setInsights(prev => prev.map(i => i.id === insightId ? { ...i, is_saved: d.is_saved } : i));
  }, []);

  const deleteInsight = useCallback(async (sessionId, insightId) => {
    await apiDelete(`/study/${sessionId}/step2/${insightId}`);
    setInsights(prev => prev.filter(i => i.id !== insightId));
  }, []);

  const generateCards = useCallback(async (sessionId) => {
    setProcessing(true);
    try {
      const d = await apiPost(`/study/${sessionId}/step3`);
      setCards(d.cards || []);
      setCurrentSession(prev => prev ? { ...prev, status: 'step3' } : prev);
      return d;
    } finally {
      setProcessing(false);
    }
  }, []);

  const reviewCard = useCallback(async (sessionId, cardId) => {
    const d = await apiPut(`/study/${sessionId}/step3/${cardId}/review`);
    setCards(prev => prev.map(c => c.id === cardId ? d.card : c));
    return d.card;
  }, []);

  const pushCards = useCallback(async (sessionId) => {
    return await apiPost(`/study/${sessionId}/step3/push`);
  }, []);

  const deleteSession = useCallback(async (id) => {
    await apiDelete(`/study/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
      setStep1(null);
      setInsights([]);
      setCards([]);
    }
  }, [currentSession]);

  return {
    sessions, currentSession, step1, insights, cards,
    loading, processing,
    fetchSessions, fetchSession, createSession,
    runStep2Action, toggleSaveInsight, deleteInsight,
    generateCards, reviewCard, pushCards,
    deleteSession,
  };
}
