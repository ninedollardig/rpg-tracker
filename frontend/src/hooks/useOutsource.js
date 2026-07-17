import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

export function useOutsource() {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decomposing, setDecomposing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/outsource');
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (task, deadline, priority, extra = {}) => {
    setDecomposing(true);
    setError(null);
    try {
      const data = await apiPost('/outsource', { task, deadline, priority, ...extra });
      setCurrentTask(data);
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setDecomposing(false);
    }
  };

  const fetchTask = async (id) => {
    setLoading(true);
    try {
      const data = await apiGet(`/outsource/${id}`);
      setCurrentTask(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSteps = async (id, steps) => {
    try {
      const data = await apiPut(`/outsource/${id}/steps`, { steps });
      setCurrentTask(prev => prev ? { ...prev, steps: data.steps } : prev);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const pushToFeishu = async (id) => {
    try {
      const data = await apiPost(`/outsource/${id}/push`, {});
      setCurrentTask(prev => prev ? { ...prev, status: 'pushed' } : prev);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'pushed' } : t));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await apiDelete(`/outsource/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (currentTask?.id === id) setCurrentTask(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    tasks, currentTask, loading, decomposing, error,
    fetchTasks, createTask, fetchTask, updateSteps, pushToFeishu, deleteTask,
    setCurrentTask,
  };
}
