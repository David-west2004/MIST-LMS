import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Custom hook to dynamically retrieve and refresh distinct departments / units.
 * 
 * @returns {{
 *   units: string[],
 *   unitsData: Array<{id: number, name: string, code?: string}>,
 *   loading: boolean,
 *   error: string,
 *   refetchUnits: () => Promise<string[]>
 * }}
 */
export const useUnits = () => {
  const [units, setUnits] = useState([]);
  const [unitsData, setUnitsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getUnits();
      const rawList = res.data?.units || res.units || (Array.isArray(res) ? res : []);
      // Map to array of names for backward compatibility with string-based option values
      const unitNames = rawList.map(u => (typeof u === 'object' && u !== null ? u.name : u)).filter(Boolean);
      setUnits(unitNames);
      setUnitsData(rawList);
      return unitNames;
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
    unitsData,
    loading,
    error,
    refetchUnits: fetchUnits
  };
};

export default useUnits;
