import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Save, AlertTriangle, Upload, CheckCircle2, Building2 } from 'lucide-react';

const Curriculum = () => {
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState({}); // { `${modIdx}-${matIdx}`: true }

  // States for adding a new unit
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [creatingUnit, setCreatingUnit] = useState(false);

  // Helper to extract unit name string regardless of whether it's an object or string
  const getUnitName = (u) => (typeof u === 'object' && u !== null ? u.name : String(u || ''));
  const getUnitCode = (u) => (typeof u === 'object' && u !== null ? (u.code || '') : '');

  // Extract list of all unit names
  const validUnitNames = useMemo(() => {
    return units.map(getUnitName).filter(Boolean);
  }, [units]);

  // Check if current selectedUnit is valid
  const isValidSelectedUnit = useMemo(() => {
    return Boolean(selectedUnit && validUnitNames.includes(selectedUnit));
  }, [selectedUnit, validUnitNames]);

  // Fetch /api/units on component mount
  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const res = await api.getUnits();
      const unitList = res?.data?.units || res?.units || (Array.isArray(res) ? res : []);
      setUnits(unitList);
      return unitList;
    } catch (err) {
      console.error('Error fetching /api/units:', err.message);
      try {
        const fallbackRes = await fetch('http://localhost:5000/api/units');
        const data = await fallbackRes.json();
        const list = data?.data?.units || data?.units || (Array.isArray(data) ? data : []);
        setUnits(list);
        return list;
      } catch (e) {
        console.error('Fallback fetch also failed:', e);
        return [];
      }
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Set default selected unit when units load or update
  useEffect(() => {
    if (validUnitNames.length > 0) {
      if (!selectedUnit || !validUnitNames.includes(selectedUnit)) {
        setSelectedUnit(validUnitNames[0]);
      }
    } else if (validUnitNames.length === 0 && !loadingUnits) {
      setSelectedUnit('');
      setCurriculum(null);
      setLoading(false);
    }
  }, [validUnitNames, selectedUnit, loadingUnits]);

  const fetchCurriculum = async (unitName) => {
    if (!unitName) {
      setCurriculum(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getCurriculumByUnit(unitName);
      setCurriculum(res.data?.curriculum || null);
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
    if (selectedUnit) {
      fetchCurriculum(selectedUnit);
    }
  }, [selectedUnit]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    const trimmed = newUnitName.trim();
    if (!trimmed) return;

    if (validUnitNames.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
      alert(`A unit named "${trimmed}" already exists.`);
      return;
    }

    setCreatingUnit(true);
    try {
      await api.createUnit({
        name: trimmed,
        code: newUnitCode.trim() || undefined
      });
      alert(`Department/Unit "${trimmed}" added successfully.`);
      setNewUnitName('');
      setNewUnitCode('');
      setShowAddUnit(false);
      const updatedList = await fetchUnits();
      const updatedNames = (updatedList || []).map(getUnitName);
      if (updatedNames.includes(trimmed)) {
        setSelectedUnit(trimmed);
      }
    } catch (err) {
      alert(err.message || 'Failed to create unit.');
    } finally {
      setCreatingUnit(false);
    }
  };

  // 100% Immutable Module addition bound to valid selected unit
  const handleAddModule = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isValidSelectedUnit) {
      alert('Please select a valid department/unit before adding modules.');
      return;
    }
    setCurriculum(prev => {
      if (!prev) return { unit: selectedUnit, modules: [{ title: 'New Module 1', description: '', materials: [] }] };
      const currentModules = prev.modules || [];
      return {
        ...prev,
        unit: selectedUnit,
        modules: [
          ...currentModules,
          {
            title: `New Module ${currentModules.length + 1}`,
            description: '',
            materials: []
          }
        ]
      };
    });
  };

  // 100% Immutable Module removal
  const handleRemoveModule = (modIdx, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurriculum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: (prev.modules || []).filter((_, idx) => idx !== modIdx)
      };
    });
  };

  // 100% Immutable Module change
  const handleModuleChange = (modIdx, field, value) => {
    setCurriculum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: (prev.modules || []).map((mod, idx) => {
          if (idx !== modIdx) return mod;
          return {
            ...mod,
            [field]: value
          };
        })
      };
    });
  };

  // 100% Immutable Material addition directly bound to valid selected unit
  const handleAddMaterial = (modIdx, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isValidSelectedUnit) {
      alert('Please select a valid department/unit before adding materials.');
      return;
    }
    setCurriculum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        unit: selectedUnit,
        modules: (prev.modules || []).map((mod, idx) => {
          if (idx !== modIdx) return mod;
          return {
            ...mod,
            materials: [
              ...(mod.materials || []),
              {
                title: 'New Resource',
                type: 'pdf',
                url: '',
                unit: selectedUnit // Binds material directly to valid selected unit
              }
            ]
          };
        })
      };
    });
  };

  // 100% Immutable Material removal
  const handleRemoveMaterial = (modIdx, matIdx, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurriculum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: (prev.modules || []).map((mod, idx) => {
          if (idx !== modIdx) return mod;
          return {
            ...mod,
            materials: (mod.materials || []).filter((_, mIdx) => mIdx !== matIdx)
          };
        })
      };
    });
  };

  // 100% Immutable Material field change
  const handleMaterialChange = (modIdx, matIdx, field, value) => {
    setCurriculum(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: (prev.modules || []).map((mod, idx) => {
          if (idx !== modIdx) return mod;
          return {
            ...mod,
            materials: (mod.materials || []).map((mat, mIdx) => {
              if (mIdx !== matIdx) return mat;
              return {
                ...mat,
                [field]: value,
                unit: selectedUnit // Preserves binding to valid selected unit
              };
            })
          };
        })
      };
    });
  };

  // Local File Upload handler for Admin
  const handleFileUpload = async (modIdx, matIdx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidSelectedUnit) {
      alert('Please select a valid department/unit before uploading materials.');
      return;
    }

    const key = `${modIdx}-${matIdx}`;
    setUploadingState(prev => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.uploadMaterialFile(formData);
      const { fileUrl, fileName, fileType } = res.data;

      setCurriculum(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          unit: selectedUnit,
          modules: (prev.modules || []).map((mod, idx) => {
            if (idx !== modIdx) return mod;
            return {
              ...mod,
              materials: (mod.materials || []).map((mat, mIdx) => {
                if (mIdx !== matIdx) return mat;
                return {
                  ...mat,
                  title: mat.title === 'New Resource' || !mat.title ? fileName : mat.title,
                  type: fileType || mat.type || 'pdf',
                  url: fileUrl,
                  unit: selectedUnit // Binds material directly to valid selected unit
                };
              })
            };
          })
        };
      });
    } catch (err) {
      alert(err.message || 'Failed to upload material file.');
    } finally {
      setUploadingState(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isValidSelectedUnit) {
      alert('Please select a valid department/unit before saving curriculum.');
      return;
    }
    setSaving(true);
    try {
      // Ensure all materials are explicitly bound to the valid selected unit
      const sanitizedModules = (curriculum.modules || []).map(mod => ({
        ...mod,
        materials: (mod.materials || []).map(mat => ({
          ...mat,
          unit: selectedUnit
        }))
      }));

      if (curriculum._id) {
        await api.updateCurriculum(curriculum._id, {
          unit: selectedUnit,
          modules: sanitizedModules
        });
        alert('Curriculum updated successfully.');
      } else {
        const res = await api.createCurriculum(selectedUnit, sanitizedModules);
        setCurriculum(res.data.curriculum);
        alert('Curriculum created successfully.');
        await fetchUnits();
      }
    } catch (err) {
      alert(err.message || 'Failed to save curriculum.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCurriculum = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!curriculum?._id) return;
    if (!window.confirm(`Are you sure you want to delete the curriculum for ${selectedUnit}?`)) return;

    try {
      await api.deleteCurriculum(curriculum._id);
      alert('Curriculum deleted.');
      const updatedList = await fetchUnits();
      const updatedNames = (updatedList || []).map(getUnitName);
      if (updatedNames.length > 0) {
        setSelectedUnit(updatedNames[0]);
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
        <h3 className="editor-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} />
          Department / Unit
        </h3>

        {/* Dedicated Department Selection Dropdown */}
        <div style={{ marginBottom: '14px' }}>
          <label
            htmlFor="department-select"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary, #4A5568)',
              marginBottom: '6px'
            }}
          >
            Select Department
          </label>
          <select
            id="department-select"
            aria-label="Department selection dropdown"
            className="form-control"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            disabled={loadingUnits}
            style={{
              width: '100%',
              height: '38px',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderColor: isValidSelectedUnit ? '#3182CE' : 'var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: '#1A202C'
            }}
          >
            <option value="">-- Choose a Department --</option>
            {units.map((unit) => {
              const name = getUnitName(unit);
              const code = getUnitCode(unit);
              return (
                <option key={name} value={name}>
                  {name} {code ? `(${code})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Unit list button items for quick switching */}
        <div className="editor-unit-list" style={{ flex: 1, overflowY: 'auto' }}>
          {units.map((unit) => {
            const name = getUnitName(unit);
            const code = getUnitCode(unit);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedUnit(name)}
                className={`editor-unit-btn ${name === selectedUnit ? 'active' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{name}</span>
                {code && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      opacity: 0.8,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: name === selectedUnit ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)'
                    }}
                  >
                    {code}
                  </span>
                )}
              </button>
            );
          })}
          {units.length === 0 && !loadingUnits && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No units defined yet.
            </div>
          )}
        </div>

        {/* Create Unit Flow */}
        <div style={{ padding: '16px 0 0', borderTop: '1px solid var(--border-color)', marginTop: '16px' }}>
          {!showAddUnit ? (
            <button
              type="button"
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
                placeholder="Department Name *"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                required
                autoFocus
                style={{ fontSize: '0.8125rem', height: '32px' }}
              />
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Code (e.g. SD, EA)"
                value={newUnitCode}
                onChange={(e) => setNewUnitCode(e.target.value)}
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
                  onClick={() => { setShowAddUnit(false); setNewUnitName(''); setNewUnitCode(''); }}
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
        {loading || loadingUnits ? (
          <div className="editor-center-loader">
            <div className="spinner" />
          </div>
        ) : !isValidSelectedUnit || !curriculum ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: '#1A365D', marginBottom: '8px', fontSize: '1.25rem' }}>
              {!selectedUnit ? 'No Department Selected' : `Invalid Department: "${selectedUnit}"`}
            </h3>
            <p style={{ maxWidth: '380px', fontSize: '0.875rem', margin: '0 auto', lineHeight: '1.5' }}>
              Please select a valid department/unit from the dropdown, or create a new one to bind curriculum materials directly to it.
            </p>
          </div>
        ) : (
          <div className="editor-container">
            <div className="editor-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 className="editor-title" style={{ margin: 0 }}>{selectedUnit} Curriculum</h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#EBF8FF',
                      color: '#2B6CB0',
                      border: '1px solid #BEE3F8'
                    }}
                  >
                    Bound to: {selectedUnit}
                  </span>
                </div>
                <p className="editor-subtitle">
                  {curriculum._id ? 'Modify current modules and items for this department' : 'No curriculum defined yet for this department'}
                </p>
              </div>
              <div className="editor-header-actions">
                {curriculum._id && (
                  <button 
                    type="button" 
                    onClick={handleDeleteCurriculum} 
                    className="btn btn-danger btn-sm" 
                    style={{ marginRight: '10px' }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleSave} 
                  className="btn btn-primary" 
                  disabled={saving || !isValidSelectedUnit}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Curriculum'}
                </button>
              </div>
            </div>

            <div className="editor-modules-list">
              {(curriculum.modules || []).map((module, modIdx) => (
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
                      type="button"
                      onClick={(e) => handleRemoveModule(modIdx, e)}
                      className="editor-delete-module-btn"
                      title="Remove Module"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="editor-materials-section">
                    <h4 className="editor-materials-title">Resources / Materials</h4>
                    <div className="editor-materials-list">
                      {(module.materials || []).map((material, matIdx) => {
                        const uploadKey = `${modIdx}-${matIdx}`;
                        const isUploading = uploadingState[uploadKey];

                        return (
                          <div key={matIdx} className="editor-material-row">
                            <input
                              type="text"
                              className="form-control editor-material-name-input"
                              value={material.title}
                              onChange={(e) => handleMaterialChange(modIdx, matIdx, 'title', e.target.value)}
                              placeholder="Resource Name"
                            />

                            {/* Dropdown with file formats */}
                            <select
                              value={material.type}
                              onChange={(e) => handleMaterialChange(modIdx, matIdx, 'type', e.target.value)}
                              className="editor-material-type-select"
                            >
                              <option value="pdf">PDF Document</option>
                              <option value="doc">Document (.doc, .docx)</option>
                              <option value="video">Video (.mp4)</option>
                            </select>

                            {/* File Upload Control */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label 
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 12px',
                                  backgroundColor: '#EDF2F7',
                                  color: '#1A365D',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  border: '1px solid #CBD5E0',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Upload size={13} />
                                {isUploading ? 'Uploading...' : material.url ? 'Replace File' : 'Choose File'}
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.mp4"
                                  style={{ display: 'none' }}
                                  disabled={isUploading}
                                  onChange={(e) => handleFileUpload(modIdx, matIdx, e)}
                                />
                              </label>

                              {material.url ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#006633' }}>
                                  <CheckCircle2 size={13} />
                                  <a 
                                    href={material.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: '#006633', textDecoration: 'underline', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    title={material.url}
                                  >
                                    {material.url.split('/').pop()}
                                  </a>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#718096' }}>No file uploaded</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleRemoveMaterial(modIdx, matIdx, e)}
                              className="editor-delete-material-btn"
                              title="Delete Resource"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddMaterial(modIdx, e)}
                      className="btn btn-secondary btn-sm editor-add-material-btn"
                      disabled={!isValidSelectedUnit}
                      title={`Add resource bound to ${selectedUnit}`}
                    >
                      <Plus size={14} />
                      Add Resource
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddModule}
              className="btn btn-secondary editor-add-module-dash-btn"
              disabled={!isValidSelectedUnit}
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
