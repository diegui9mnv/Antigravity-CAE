import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CheckCircle, PenTool } from 'lucide-react';
import SignaturePad from '../../components/SignaturePad';
import DraggableSignature from '../../components/DraggableSignature';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { Signature } from '../../types';

// PDF Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const Signing = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'document'; // 'document' or 'meeting'

    const {
        documents,
        meetings,
        projects,
        addDocument,
        addMeetingSignature,
        currentUser
    } = useApp();
    const [isSigned, setIsSigned] = useState(false);

    const doc = type === 'document' ? documents.find(d => d.id === id) : null;
    const meeting = type === 'meeting' ? meetings.find(m => m.id === id) : null;
    const item = doc || meeting;

    const [signature, setSignature] = useState(currentUser?.name || '');
    const [signatureError, setSignatureError] = useState(false);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [tempSignatureData, setTempSignatureData] = useState<string | null>(null);
    const [signaturePosition, setSignaturePosition] = useState({ x: 100, y: 100 });
    const [docHtml, setDocHtml] = useState<string | null>(null);
    const [pdfImages, setPdfImages] = useState<string[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (item && currentUser) {
            const hasSigned = item.signatures.some(s => s.userId === currentUser.id);
            if (hasSigned) {
                setIsSigned(true);
            }
        }
    }, [item, currentUser]);

    useEffect(() => {
        const loadContent = async () => {
            if (!doc?.url || doc.url === '#') return;

            setIsLoadingContent(true);
            try {
                const base64Data = doc.url.split(',')[1];
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                if (doc.url.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                    // It's a DOCX
                    // Improve mammoth style mapping
                    const options = {
                        styleMap: [
                            "p[style-name='Header'] => p.docx-header",
                            "p[style-name='Footer'] => p.docx-footer",
                        ]
                    };
                    const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer }, options);
                    setDocHtml(result.value);
                } else if (doc.url.includes('application/pdf')) {
                    // It's a PDF
                    const loadingTask = pdfjsLib.getDocument({ data: bytes });
                    const pdf = await loadingTask.promise;
                    const images: string[] = [];

                    for (let n = 1; n <= pdf.numPages; n++) {
                        const page = await pdf.getPage(n);
                        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR/capture
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        if (context) {
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            await page.render({ canvasContext: context, viewport }).promise;
                            images.push(canvas.toDataURL());
                        }
                    }
                    setPdfImages(images);
                }
            } catch (error) {
                console.error('Error loading document content:', error);
            } finally {
                setIsLoadingContent(false);
            }
        };

        if (type === 'document' && doc) {
            loadContent();
        }
    }, [doc, type]);

    const handleSign = async () => {
        if (!signature.trim()) {
            setSignatureError(true);
            return;
        }

        if (!tempSignatureData) {
            alert('Por favor, dibuja tu firma antes de continuar.');
            return;
        }

        if (item && id && currentUser) {
            if (window.confirm(`¿Confirmas que deseas firmar este documento como "${signature}"?`)) {
                try {
                    // Start capture process
                    setIsCapturing(true);

                    // Small delay to ensure React renders the "locked" state
                    await new Promise(resolve => setTimeout(resolve, 300));

                    const newSignature: Signature = {
                        userId: currentUser.id,
                        userName: signature,
                        role: currentUser.role,
                        data: tempSignatureData,
                        position: signaturePosition,
                        date: new Date().toISOString()
                    };

                    if (documentRef.current) {
                        const canvas = await html2canvas(documentRef.current, {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        });

                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        const pdf = new jsPDF('p', 'mm', 'a4');

                        const imgProps = (pdf as any).getImageProperties(imgData);
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                        const pageHeight = pdf.internal.pageSize.getHeight();

                        let heightLeft = pdfHeight;
                        let pos = 0;

                        pdf.addImage(imgData, 'JPEG', 0, pos, pdfWidth, pdfHeight);
                        heightLeft -= pageHeight;

                        while (heightLeft >= 0) {
                            pos = heightLeft - pdfHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'JPEG', 0, pos, pdfWidth, pdfHeight);
                            heightLeft -= pageHeight;
                        }

                        const signedPdfData = pdf.output('datauristring');

                        if (type === 'document' && doc) {
                            // 3. Instead of overwriting, we add a NEW document
                            const signedDoc: any = {
                                id: Math.random().toString(36).substr(2, 9),
                                projectId: doc.projectId,
                                name: doc.name.replace('.docx', '').replace('.pdf', '') + ' - Firmado.pdf',
                                url: signedPdfData,
                                status: 'ACEPTADO',
                                category: doc.category,
                                uploadedBy: currentUser.id,
                                uploadedAt: new Date().toISOString(),
                                signatures: [newSignature]
                            };

                            addDocument(signedDoc);

                            // Optional: update the original document status to 'ACEPTADO' or keep it
                            // Usually the original stays as 'BORRADOR' if it was a template
                            // Let's just keep it to see two documents
                        } else if (type === 'meeting') {
                            addMeetingSignature(id, newSignature);
                        }
                        setIsSigned(true);
                    }
                } catch (err) {
                    console.error('Error during signing:', err);
                    alert('Ocurrió un error al generar el documento firmado.');
                } finally {
                    setIsCapturing(false);
                }
            }
        }
    };

    const handleSaveSignature = (dataUrl: string) => {
        setTempSignatureData(dataUrl);
        setShowSignaturePad(false);
    };

    if (!item) {
        return <div className="p-8 text-center text-secondary">Elemento no encontrado o acceso denegado.</div>;
    }

    const project = type === 'document' ? projects.find(p => p.id === doc?.projectId) : projects.find(p => p.id === meeting?.projectId);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--background)'
        }}>
            <header style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Firma de {type === 'document' ? 'Documento' : 'Acta de Reunión'}</h2>
                    <span style={{
                        color: 'var(--text-secondary)',
                        borderLeft: '1px solid var(--border)',
                        paddingLeft: '1rem'
                    }}>
                        {type === 'document' ? doc?.name : meeting?.reason}
                    </span>
                </div>
                {isSigned ? (
                    <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={20} />
                        Documento firmado correctamente
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <input
                                type="text"
                                placeholder="Escribe tu nombre para la firma"
                                value={signature}
                                onChange={(e) => {
                                    setSignature(e.target.value);
                                    setSignatureError(false);
                                }}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: signatureError ? '1px solid var(--error)' : '1px solid var(--border)',
                                    minWidth: '200px'
                                }}
                            />
                            {signatureError && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>Nombre requerido</span>}
                        </div>

                        {!tempSignatureData ? (
                            <button onClick={() => setShowSignaturePad(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}>
                                <PenTool size={18} />
                                DIBUJAR FIRMA
                            </button>
                        ) : (
                            <button onClick={() => setShowSignaturePad(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--success)', color: 'var(--success)' }}>
                                <CheckCircle size={18} />
                                CAMBIAR FIRMA
                            </button>
                        )}

                        <button onClick={handleSign} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                            FIRMAR Y FINALIZAR
                        </button>
                    </div>
                )}
            </header>

            <div style={{ flex: 1, padding: '2rem', backgroundColor: '#f5f5f5', overflow: 'auto' }}>
                <div
                    ref={documentRef}
                    style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                        backgroundColor: 'white',
                        minHeight: '1122px', // A4 height at 96dpi
                        position: 'relative',
                        padding: '2.5rem'
                    }}
                >
                    {/* Header Area - ONLY FOR MEETINGS */}
                    {type === 'meeting' && (
                        <div style={{ borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a1a' }}>ACTA DE REUNIÓN</h1>
                                <p style={{ margin: '0.2rem 0', color: '#666', fontSize: '0.9rem' }}>Proyecto: {project?.code || 'N/A'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>SISTEMA CAE</div>
                                <div style={{ fontSize: '0.8rem', color: '#999' }}>Fecha: {new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    )}

                    <div
                        className="document-page"
                        style={{
                            minHeight: '297mm', // A4 height
                            padding: '20mm', // standard word margins
                            color: '#000',
                            backgroundColor: '#fff'
                        }}
                    >
                        {/* Content Section */}
                        {isLoadingContent ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                                <div className="loader">Cargando contenido del documento...</div>
                            </div>
                        ) : type === 'document' ? (
                            <div style={{ lineHeight: '1.5' }}>
                                {/* If we have DOCX HTML */}
                                {docHtml && (
                                    <div
                                        className="docx-content"
                                        dangerouslySetInnerHTML={{ __html: docHtml }}
                                    />
                                )}

                                {/* If we have PDF Images */}
                                {pdfImages.length > 0 && pdfImages.map((img, i) => (
                                    <img key={i} src={img} alt={`Page ${i + 1}`} style={{ width: '100%', marginBottom: '0', display: 'block' }} />
                                ))}

                                {!docHtml && pdfImages.length === 0 && (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                        No se pudo visualizar el contenido original del archivo.
                                        Pero puedes proceder con la firma a continuación.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ lineHeight: '1.6' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', marginBottom: '2rem', padding: '1rem', border: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 600 }}>Fecha:</span> <span>{meeting?.startDate}</span>
                                    <span style={{ fontWeight: 600 }}>Localización:</span> <span>{meeting?.location}</span>
                                    <span style={{ fontWeight: 600 }}>Motivo:</span> <span>{meeting?.reason}</span>
                                </div>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>TEMAS TRATADOS / ACUERDOS</h3>
                                <div style={{ whiteSpace: 'pre-wrap', padding: '1rem 0', minHeight: '300px' }}>
                                    {meeting?.minutes || 'No hay notas registradas para esta reunión.'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Signature Overlay Area (Absolute positioned on documentRef) */}
                    <div style={{ marginTop: 'auto', borderTop: '2px solid #eee', paddingTop: '2rem' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4rem' }}>Firmado digitalmente por:</p>
                    </div>

                    {/* Rendering all existing signatures */}
                    {(item.signatures || []).map((sig, index) => (
                        <div key={index} style={{
                            position: 'absolute',
                            left: sig.position.x,
                            top: sig.position.y,
                            pointerEvents: 'none',
                            zIndex: 10,
                            borderBottom: '1px solid #eee'
                        }}>
                            <img src={sig.data} alt="Firma" style={{ height: '70px', maxWidth: '200px' }} />
                            <div style={{ fontSize: '0.65rem', color: '#333', fontWeight: 600, marginTop: '2px' }}>
                                {sig.userName}<br />
                                {new Date(sig.date).toLocaleString('es-ES')}
                            </div>
                        </div>
                    ))}

                    {/* Current user's signature (draggable before signing) */}
                    {tempSignatureData && !isSigned && (
                        <DraggableSignature
                            signatureData={tempSignatureData}
                            position={signaturePosition}
                            onPositionChange={setSignaturePosition}
                            isLocked={false}
                            isCapturing={isCapturing}
                        />
                    )}
                </div>
            </div>

            {showSignaturePad && (
                <SignaturePad
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignaturePad(false)}
                />
            )}
        </div>
    );
};

export default Signing;
