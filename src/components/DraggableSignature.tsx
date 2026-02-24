import React, { useState, useRef, useEffect } from 'react';

interface DraggableSignatureProps {
    signatureData: string;
    position: { x: number, y: number };
    onPositionChange: (newPosition: { x: number, y: number }) => void;
    isLocked?: boolean;
    isCapturing?: boolean;
}

const DraggableSignature: React.FC<DraggableSignatureProps> = ({
    signatureData,
    position,
    onPositionChange,
    isLocked = false,
    isCapturing = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLocked || isCapturing) return;
        setIsDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - offset.x;
            const newY = e.clientY - offset.y;

            // Boundary checks (optional, but good for UX)
            // For now, let's keep it simple
            onPositionChange({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, offset, onPositionChange]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                cursor: (isLocked || isCapturing) ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                userSelect: 'none',
                zIndex: 10,
                border: (isLocked || isCapturing) ? 'none' : '1px dashed #007bff',
                padding: '4px',
                backgroundColor: (isLocked || isCapturing) ? 'transparent' : 'rgba(255, 255, 255, 0.5)',
            }}
            onMouseDown={handleMouseDown}
        >
            <img
                src={signatureData}
                alt="Signature"
                style={{
                    maxHeight: '80px',
                    pointerEvents: 'none',
                    display: 'block'
                }}
            />
            {!isLocked && !isCapturing && (
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#007bff'
                }}>
                    Arrastra para posicionar
                </div>
            )}
        </div>
    );
};

export default DraggableSignature;
