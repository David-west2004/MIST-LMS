import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Custom hook to dynamically retrieve and refresh distinct departments / units.
 * 
 * @returns {{
 *   units: string[],
 *   loading: boolean,
 *   error: string,
 *   refetchUnits: () => Promise<string[]>
 * }}
 */
export const useUnits = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getUnits();
      const unitList = res.data?.units || [];
      setUnits(unitList);
      return unitList;
    } catch (err) {
      console.error('Error fetching units:', err.message);
      setError(err.message || 'Failed to load units.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return {
    units,
    loading,
    error,
    refetchUnits: fetchUnits
  };
};

export default useUnits;
