import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';

export default function useDailyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/daily-reports');
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to fetch daily reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const getReport = async (id) => {
    const data = await apiGet(`/daily-reports/${id}`);
    return data.report;
  };

  const getReportByDate = async (date) => {
    const data = await apiGet(`/daily-reports/date/${date}`);
    return data.report;
  };

  const createReport = async (date, content) => {
    const data = await apiPost('/daily-reports', { date, content });
    await fetchReports();
    return data.report;
  };

  const updateReport = async (id, content) => {
    const data = await apiPut(`/daily-reports/${id}`, { content });
    await fetchReports();
    return data.report;
  };

  const deleteReport = async (id) => {
    await apiDelete(`/daily-reports/${id}`);
    await fetchReports();
  };

  const generateReport = async (date) => {
    const data = await apiPost('/daily-reports/generate', { date });
    await fetchReports();
    return data.report;
  };

  return {
    reports,
    loading,
    fetchReports,
    getReport,
    getReportByDate,
    createReport,
    updateReport,
    deleteReport,
    generateReport,
  };
}
