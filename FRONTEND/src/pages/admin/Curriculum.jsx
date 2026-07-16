import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';

const Curriculum = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for adding a new unit
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [creatingUnit, setCreatingUnit] = useState(false);

  const fetchUnits = async (selectName = null) => {
    try {
      const res = await api.getCurricula();
      const dbUnits = res.data.curricula.map(c => c.unit);
      setUnits(dbUnits);
      
      if (selectName) {
        setSelectedUnit(selectName);
      } else if (dbUnits.length > 0 && !selectedUnit) {
        setSelectedUnit(dbUnits[0]);
      } else if (dbUnits.length === 0) {
        setSelectedUnit('');
        setCurriculum(null);
        setLoading(false);
      }
    } catch (err) {
      alert(err.message || 'Error fetching units.');
    }
  };

  const fetchCurriculum = async (unitName) => {
    if (!unitName) {
      setCurriculum(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getCurriculumByUnit(unitName);
      setCurriculum(res.data.curriculum);
    } catch (err) {
      if (err.status === 404) {
        setCurriculum({ unit: unitName, modules: [] });
      } else {
        alert(err.message || 'Error fetching curriculum.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchCurriculum(selectedUnit);
    }
  }, [selectedUnit]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    const trimmed = newUnitName.trim();
    if (!trimmed) return;

    if (units.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
      alert(`A unit named "${trimmed}" already exists.`);
      return;
    }

    setCreatingUnit(true);
    try {
      const res = await api.createCurriculum(trimmed, []);
      alert(`Unit "${trimmed}" added successfully.`);
      setNewUnitName('');
      setShowAddUnit(false);
      await fetchUnits(trimmed);
    } catch (err) {
      alert(err.message || 'Failed to create unit.');
    } finally {
      setCreatingUnit(false);
    }
  };

  const handleAddModule = () => {
    setCurriculum(prev => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          title: `New Module ${prev.modules.length + 1}`,
          description: '',
          materials: []
        }
      ]
    }));
  };

  const handleRemoveModule = (modIdx) => {
    setCurriculum(prev => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== modIdx)
    }));
  };

  const handleModuleChange = (modIdx, field, value) => {
    setCurriculum(prev => {
      const updatedModules = [...prev.modules];
      updatedModules[modIdx] = {
        ...updatedModules[modIdx],
        [field]: value
      };
      return { ...prev, modules: updatedModules };
    });
  };

  const handleAddMaterial = (modIdx) => {
    setCurriculum(prev => {
      const updatedModules = [...prev.modules];
      updatedModules[modIdx].materials.push({
        title: 'New Resource',
        type: 'pdf',
        url: 'https://example.com'
      });
      return { ...prev, modules: updatedModules };
    });
  };

  const handleRemoveMaterial = (modIdx, matIdx) => {
    setCurriculum(prev => {
      const updatedModules = [...prev.modules];
      updatedModules[modIdx].materials = updatedModules[modIdx].materials.filter((_, idx) => idx !== matIdx);
      return { ...prev, modules: updatedModules };
    });
  };

  const handleMaterialChange = (modIdx, matIdx, field, value) => {
    setCurriculum(prev => {
      const updatedModules = [...prev.modules];
      updatedModules[modIdx].materials[matIdx] = {
        ...updatedModules[modIdx].materials[matIdx],
        [field]: value
      };
      return { ...prev, modules: updatedModules };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (curriculum._id) {
        await api.updateCurriculum(curriculum._id, {
          unit: curriculum.unit,
          modules: curriculum.modules
        });
        alert('Curriculum updated successfully.');
      } else {
        const res = await api.createCurriculum(curriculum.unit, curriculum.modules);
        setCurriculum(res.data.curriculum);
        alert('Curriculum created successfully.');
        await fetchUnits(curriculum.unit);
      }
    } catch (err) {
      alert(err.message || 'Failed to save curriculum.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCurriculum = async () => {
    if (!curriculum._id) return;
    if (!window.confirm(`Are you sure you want to delete the curriculum for ${selectedUnit}?`)) return;

    try {
      await api.deleteCurriculum(curriculum._id);
      alert('Curriculum deleted.');
      const res = await api.getCurricula();
      const dbUnits = res.data.curricula.map(c => c.unit);
      setUnits(dbUnits);
      if (dbUnits.length > 0) {
        setSelectedUnit(dbUnits[0]);
      } else {
        setSelectedUnit('');
        setCurriculum(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete curriculum.');
    }
  };

  return (
    <div className="animate-slide-in editor-layout">
      {/* Selector sidebar */}
      <div className="editor-sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
        <h3 className="editor-sidebar-title">Select Unit</h3>
        <div className="editor-unit-list" style={{ flex: 1, overflowY: 'auto' }}>
          {units.map((unit) => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
              className={`editor-unit-btn ${unit === selectedUnit ? 'active' : ''}`}
            >
              {unit}
            </button>
          ))}
          {units.length === 0 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No units defined yet.
            </div>
          )}
        </div>

        <div style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '16px' }}>
          {!showAddUnit ? (
            <button
              onClick={() => setShowAddUnit(true)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', gap: '6px', justifyContent: 'center', height: '36px' }}
            >
              <Plus size={14} />
              Add Department/Unit
            </button>
          ) : (
            <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Unit/Dept Name"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                required
                autoFocus
                style={{ fontSize: '0.8125rem', height: '32px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', height: '28px', gap: '0' }}
                  disabled={creatingUnit}
                >
                  {creatingUnit ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddUnit(false); setNewUnitName(''); }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.75rem', height: '28px', gap: '0' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="editor-area">
        {loading ? (
          <div className="editor-center-loader">
            <div className="spinner" />
          </div>
        ) : !selectedUnit || !curriculum ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: '#ffffff', marginBottom: '8px', fontSize: '1.25rem' }}>No Unit Selected</h3>
            <p style={{ maxWidth: '360px', fontSize: '0.875rem', margin: '0 auto', lineHeight: '1.5' }}>
              Please select a department/unit from the sidebar, or create a new one to define its curriculum and modules.
            </p>
          </div>
        ) : (
          <div className="editor-container">
            <div className="editor-header">
              <div>
                <h3 className="editor-title">{selectedUnit} Curriculum</h3>
                <p className="editor-subtitle">
                  {curriculum._id ? 'Modify current modules and items' : 'No curriculum defined yet for this department'}
                </p>
              </div>
              <div className="editor-header-actions">
                {curriculum._id && (
                  <button onClick={handleDeleteCurriculum} className="btn btn-danger btn-sm" style={{ marginRight: '10px' }}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Curriculum'}
                </button>
              </div>
            </div>

            <div className="editor-modules-list">
              {curriculum.modules.map((module, modIdx) => (
                <div key={modIdx} className="glass-card editor-module-card">
                  <div className="editor-module-meta">
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        className="editor-module-title-input"
                        value={module.title}
                        onChange={(e) => handleModuleChange(modIdx, 'title', e.target.value)}
                        placeholder="Module Title"
                      />
                      <input
                        type="text"
                        className="editor-module-desc-input"
                        value={module.description || ''}
                        onChange={(e) => handleModuleChange(modIdx, 'description', e.target.value)}
                        placeholder="Description (optional)"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveModule(modIdx)}
                      className="editor-delete-module-btn"
                      title="Remove Module"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="editor-materials-section">
                    <h4 className="editor-materials-title">Resources / Materials</h4>
                    <div className="editor-materials-list">
                      {module.materials.map((material, matIdx) => (
                        <div key={matIdx} className="editor-material-row">
                          <input
                            type="text"
                            className="form-control editor-material-name-input"
                            value={material.title}
                            onChange={(e) => handleMaterialChange(modIdx, matIdx, 'title', e.target.value)}
                            placeholder="Resource Name"
                          />

                          <select
                            value={material.type}
                            onChange={(e) => handleMaterialChange(modIdx, matIdx, 'type', e.target.value)}
                            className="editor-material-type-select"
                          >
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="link">Link</option>
                            <option value="doc">Document</option>
                          </select>

                          <input
                            type="text"
                            className="form-control editor-material-url-input"
                            value={material.url}
                            onChange={(e) => handleMaterialChange(modIdx, matIdx, 'url', e.target.value)}
                            placeholder="Resource URL"
                          />

                          <button
                            onClick={() => handleRemoveMaterial(modIdx, matIdx)}
                            className="editor-delete-material-btn"
                            title="Delete Resource"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddMaterial(modIdx)}
                      className="btn btn-secondary btn-sm editor-add-material-btn"
                    >
                      <Plus size={14} />
                      Add Resource
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddModule}
              className="btn btn-secondary editor-add-module-dash-btn"
            >
              <Plus size={18} />
              Add Module Block
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Curriculum;
