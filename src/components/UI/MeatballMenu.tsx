import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

interface MenuItem {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface MeatballMenuProps {
    items: MenuItem[];
}

const MeatballMenu: React.FC<MeatballMenuProps> = ({ items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            updateCoords();
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.right - 160 + window.scrollX // 160 is the minWidth of the menu
            });
        }
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateCoords();
        setIsOpen(!isOpen);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center'
                }}
                className='meatball-btn'
            >
                <MoreHorizontal size={20} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'absolute',
                        left: `${coords.left}px`,
                        top: `${coords.top}px`,
                        marginTop: '0.5rem',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '160px',
                        zIndex: 9999, // High z-index to stay above everything
                        overflow: 'hidden'
                    }}
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                setIsOpen(false);
                            }}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: item.variant === 'danger' ? 'var(--error)' : 'var(--text-main)',
                                fontSize: '0.875rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

export default MeatballMenu;
