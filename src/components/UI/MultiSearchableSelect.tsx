import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    subLabel?: string;
    searchValue: string;
}

interface MultiSearchableSelectProps {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
}

const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.searchValue.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const removeValue = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== id));
    };

    const getSelectedLabels = () => {
        return options.filter(opt => value.includes(opt.id));
    };

    const selectedOptions = getSelectedLabels();

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.4rem',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    minHeight: '42px'
                }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', flex: 1 }}>
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span
                                key={opt.id}
                                style={{
                                    backgroundColor: '#EFF6FF',
                                    color: 'var(--primary)',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    border: '1px solid var(--primary-light)'
                                }}
                            >
                                {opt.label}
                                <X
                                    size={12}
                                    onClick={(e) => removeValue(opt.id, e)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </span>
                        ))
                    ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>{placeholder || 'Seleccionar...'}</span>
                    )}
                </div>
                <ChevronDown size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    marginTop: '4px',
                    zIndex: 2000,
                    maxHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        backgroundColor: 'var(--background)'
                    }}>
                        <Search size={16} color="var(--text-secondary)" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                width: '100%',
                                fontSize: '0.9rem',
                                background: 'transparent'
                            }}
                        />
                    </div>
                    <div style={{ overflowY: 'auto' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const isSelected = value.includes(opt.id);
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => handleSelect(opt.id)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <div>
                                            <div style={{
                                                fontWeight: isSelected ? 600 : 500,
                                                color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                                                fontSize: '0.875rem'
                                            }}>
                                                {opt.label}
                                            </div>
                                            {opt.subLabel && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '2px'
                                                }}>
                                                    {opt.subLabel}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '4px',
                                                backgroundColor: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white'
                                            }}>
                                                <X size={12} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                No se encontraron resultados
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default MultiSearchableSelect;
