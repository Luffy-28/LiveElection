import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://liveelection-1.onrender.com/api';


export function useElectionData(endpoint, refreshInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}${endpoint}`);
      setData(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}

export function useSyncTrigger() {
  const [syncing, setSyncing] = useState(false);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/sync`);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setTimeout(() => setSyncing(false), 1500);
    }
  };

  return { syncing, triggerSync };
}

export { API_BASE };
