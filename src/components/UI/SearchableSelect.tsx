import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    subLabel?: string;
    searchValue: string; // Combined string for searching
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

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

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.925rem'
                }}
            >
                <span style={{
                    color: selectedOption ? 'var(--text-main)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginRight: '0.5rem'
                }}>
                    {selectedOption ? selectedOption.label : placeholder || 'Seleccionar...'}
                </span>
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
                    maxHeight: '280px',
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
                            placeholder="Buscar por nombre o provincia..."
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
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        cursor: 'pointer',
                                        backgroundColor: value === opt.id ? '#EFF6FF' : 'transparent',
                                        borderLeft: value === opt.id ? '3px solid var(--primary)' : '3px solid transparent',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (value !== opt.id) e.currentTarget.style.backgroundColor = '#F8FAFC';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (value !== opt.id) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div style={{
                                        fontWeight: 600,
                                        color: value === opt.id ? 'var(--primary)' : 'var(--text-main)',
                                        fontSize: '0.9rem'
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
                            ))
                        ) : (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                No se encontraron centros
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

export default SearchableSelect;
