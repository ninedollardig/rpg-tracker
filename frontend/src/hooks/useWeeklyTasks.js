import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function useWeeklyTasks() {
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [categoryScores, setCategoryScores] = useState({});
  const [weekInfo, setWeekInfo] = useState({ month: 1, weekOfMonth: 1 });
  const [leftoverTasks, setLeftoverTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/weekly-tasks');
      setTasks(data.tasks);
      setCategoryScores(data.categoryScores || {});
      setWeekInfo(data.weekInfo || { month: 1, weekOfMonth: 1 });
      setLeftoverTasks(data.leftoverTasks || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const [heatmap, setHeatmap] = useState({ weeks: [], currentWeekStart: '' });

  useEffect(() => {
    apiGet('/weekly-tasks/templates').then(d => setTemplates(d.templates)).catch(err => console.error('加载任务模板失败:', err));
  }, []);

  useEffect(() => {
    apiGet('/weekly-tasks/heatmap').then(d => setHeatmap(d)).catch(err => console.error('加载热力图失败:', err));
  }, [tasks]);

  const addTask = async (weekday, category, subcategory, content, score) => {
    await apiPost('/weekly-tasks', { weekday, category, subcategory, content, score });
    await fetch();
  };

  const updateTask = async (id, data) => {
    await apiPut(`/weekly-tasks/${id}`, data);
    await fetch();
  };

  const toggleTask = async (id) => {
    const result = await apiPut(`/weekly-tasks/${id}/toggle`);
    await fetch();
    return result; // { success, expDelta, crit, titleDrop }
  };

  const deleteTask = async (id) => {
    await apiDelete(`/weekly-tasks/${id}`);
    await fetch();
  };

  const tasksByDay = {};
  for (let i = 0; i < 7; i++) {
    tasksByDay[i] = tasks.filter(t => t.weekday === i);
  }

  return { tasksByDay, templates, categoryScores, WEEKDAYS, addTask, updateTask, toggleTask, deleteTask, refetch: fetch, loading, heatmap, weekInfo, leftoverTasks };
}
