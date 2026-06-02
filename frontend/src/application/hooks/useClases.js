/**
 * Application Layer — useClases Hook
 * Encapsulates all classroom state and loading logic.
 */
import { useState } from 'react';
import { ClaseService } from '../../infrastructure/api/ClaseService.js';

export function useClases(showToast) {
  const [clases, setClases] = useState([]);
  const [activeClassId, setActiveClassId] = useState('');
  const [loading, setLoading] = useState(false);

  function loadClases(userId, defaultId = null) {
    setLoading(true);
    ClaseService.getClases()
      .then(data => {
        setClases(data);
        const cachedClassId = localStorage.getItem('activeClassId');
        if (defaultId) {
          setActiveClassId(defaultId);
          localStorage.setItem('activeClassId', defaultId);
        } else if (cachedClassId && data.some(c => c.id === cachedClassId)) {
          setActiveClassId(cachedClassId);
        } else {
          setActiveClassId('');
        }
      })
      .catch(() => showToast('Error al cargar aulas. Trabajando en modo local.', 'warning'))
      .finally(() => setLoading(false));
  }

  function handleClassChange(e) {
    const classId = e.target.value;
    setActiveClassId(classId);
    localStorage.setItem('activeClassId', classId);
    showToast('Aula activa cambiada', 'success');
  }

  function refreshClases(newActiveId = null) {
    loadClases(null, newActiveId);
  }

  return {
    clases, setClases,
    activeClassId, setActiveClassId,
    loading,
    loadClases,
    handleClassChange,
    refreshClases
  };
}
