import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import Draggable from 'react-draggable';
import '../../styles/PDFViewerTechedge.css'
import { Slider, Tooltip, Button, Typography, Box } from '@mui/material';
import LoadingDialog from '../loaders/LoadingDialog';
import {
    FaEraser,
    FaSearchMinus,
    FaSearchPlus,
    FaRedo,
    FaBars,
    FaTrash,
    FaThList,
} from 'react-icons/fa';

import { TfiLayoutSidebarLeft } from "react-icons/tfi";
import { TfiLayoutSidebarNone } from "react-icons/tfi";
// Configure PDF.js worker

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDFViewerPreview3 = ({
    title, complete, uploadeddocument, height, signer,
    signatureBoxes, setSignatureBoxes,
    selectedAnnotationId, setSelectedAnnotationId,
    addSignatureBox, setAddSignatureBox,
    handleSelectUser, signers,
}) => {
    const [numPages, setNumPages] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pageNumber, setPageNumber] = useState(1);
    const containerRef = useRef(null);
    const mainContainerRef = useRef(null);
    const [pageDimensions, setPageDimensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagesLoaded, setPagesLoaded] = useState(0);
    const [isRotated, setIsRotated] = useState(false);
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [isAsideOpen, setIsAsideOpen] = useState(true);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const selectAnnotation = (annotationId) => setSelectedAnnotationId(annotationId);

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.01, 2));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.01, 0.25));
    const resetZoom = () => setZoom(1);

    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY * -0.01;
                setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
            }
        };
        const container = mainContainerRef.current;
        if (container) container.addEventListener('wheel', handleWheel, { passive: false });
        return () => { if (container) container.removeEventListener('wheel', handleWheel); };
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (mainContainerRef.current) setContainerWidth(mainContainerRef.current.offsetWidth);
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const toggleAside = () => setIsAsideOpen(prev => !prev);

    const onPageLoadSuccess = (page) => {
        const { pageNumber, width, height, rotate } = page;

        if (pageNumber <= numPages) {
            setPagesLoaded(prev => Math.min(prev + 1, numPages));
            setLoadingPercentage(((pagesLoaded + 1) / numPages) * 100);
        }

        if (rotate % 360 !== 0) setIsRotated(true);

        const adjustedWidth = rotate % 180 !== 0 ? height : width;
        const adjustedHeight = rotate % 180 !== 0 ? width : height;

        setPageDimensions(prev => {
            const exists = prev.find(p => p.pageNumber === pageNumber);
            return exists
                ? prev.map(p => p.pageNumber === pageNumber ? { pageNumber, width: adjustedWidth, height: adjustedHeight } : p)
                : [...prev, { pageNumber, width: adjustedWidth, height: adjustedHeight }];
        });

        if (pagesLoaded + 1 === numPages) {
            setLoading(false);
            setPagesLoaded(0);
            setLoadingPercentage(100);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

    const handlePageInputChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1 && value <= numPages) {
            setPageNumber(value);
            mainContainerRef.current?.querySelector(`#page_${value}`)?.scrollIntoView({ behavior: 'smooth' });
            containerRef.current?.querySelector(`#thumbnail_${value}`)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const thumbnailNavigation = (pageIndex) => {
        const pn = pageIndex + 1;
        containerRef.current?.querySelector(`#thumbnail_${pn}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            mainContainerRef.current?.querySelector(`#page_${pn}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setPageNumber(pn);
        }, 100);
    };

    const getScaleForPage = (pageNumber, zoom = 1) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber);
        if (!pageDim) return zoom;
        const isLandscape = pageDim.width > pageDim.height;
        const baseScale = isLandscape ? (isRotated ? 0.8 : 0.6) : 1;
        return baseScale * zoom;
    };

    const getScaleForPageThumbnail = (pageNumber) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber);
        return pageDim && pageDim.width > pageDim.height ? 0.18 : 0.28;
    };

    const getPageSize = (pageNumber) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber);
        return { width: pageDim?.width ?? 0, height: pageDim?.height ?? 0 };
    };

    const handleDownload = () => {
        if (typeof window !== 'undefined') {
            const link = window.document.createElement('a');
            link.href = document;
            link.download = `${title}`;
            link.click();
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (mainContainerRef.current) {
                if (event.key === 'ArrowDown') mainContainerRef.current.scrollBy({ top: 100, behavior: 'smooth' });
                else if (event.key === 'ArrowUp') mainContainerRef.current.scrollBy({ top: -100, behavior: 'smooth' });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Delete' && selectedAnnotationId) {
                setDeleteAnnotationDialog(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedAnnotationId]);

    const handleDragStop = (annotation, data) => {
        // Draggable bounds already prevent out-of-bounds positions during drag.
        // We just unscale the final position and save it.
        setSignatureBoxes(prev =>
            prev.map(box =>
                box.signer.id === signer.id
                    ? {
                        ...box, annotations: box.annotations.map(a =>
                            a.id === annotation.id
                                ? { ...a, x: data.x / zoom, y: data.y / zoom }
                                : a
                        )
                    }
                    : box
            )
        );
    };

    const deleteAnnotation = (annotationId) => {
        setSignatureBoxes(prev =>
            prev.map(box => ({
                ...box,
                annotations: box.annotations.filter(a => a.id !== annotationId),
            }))
        );
        setSelectedAnnotationId(null);
    };

    const renderSigningBoxAnnotations = (pageNumber) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber) || {};
        const pageWidth = pageDim.width || containerRef.current?.offsetWidth || 0;
        const pageHeight = pageDim.height || containerRef.current?.offsetHeight || 0;

        const filteredAnnotations = signatureBoxes
            .flatMap(box => box.annotations)
            .filter(a => a.pageNumber === pageNumber);

        return (
            <>
                {filteredAnnotations.map(annotation => {
                    const isSelected = selectedAnnotationId === annotation.id;
                    const backgroundColor = annotation.color ? `${annotation.color}33` : 'rgba(255,255,0,0.1)';

                    return (
                        <Draggable
                            key={annotation.id}
                            position={{ x: annotation.x * zoom, y: annotation.y * zoom }}
                            onStop={(e, data) => handleDragStop(annotation, data)}
                            bounds="parent"
                        >
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    selectAnnotation(annotation.id);
                                    const email = annotation.text?.trim().toLowerCase();
                                    const idx = signers.findIndex(s => s.email.trim().toLowerCase() === email);
                                    if (idx !== -1) handleSelectUser(idx, signers[idx], false);
                                }}
                                style={{
                                    position: 'absolute',
                                    width: `${annotation.width * zoom}px`,
                                    height: `${annotation.height * zoom}px`,
                                    border: '2px dashed rgba(169,169,169,0.7)',
                                    boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                                    backgroundColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease-in-out',
                                }}
                            >
                                <p style={{ margin: 0, fontSize: `${11 * zoom}px` }}>Sign Here</p>
                                {isSelected && (
                                    <FaTrash
                                        className="delete-icon"
                                        onClick={(e) => { e.stopPropagation(); deleteAnnotation(annotation.id); }}
                                        style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '-10px',
                                            cursor: 'pointer',
                                            color: '#d32f2f',
                                            background: 'white',
                                            borderRadius: '50%',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                            padding: 2,
                                            fontSize: 18
                                        }}
                                    />
                                )}
                            </div>
                        </Draggable>
                    );
                })}
            </>
        );
    };

    const handleAnnotation = (event, pageNumber) => {
        event.preventDefault();
        if (!addSignatureBox) return;

        // const pageElement = document.getElementById(`page_${pageNumber}`);
        // if (!pageElement) return;

        // const { left, top } = pageElement.getBoundingClientRect();
        // const x = (event.clientX - left) / zoom;
        // const y = (event.clientY - top) / zoom;
        const pageElement = document.getElementById(`page_${pageNumber}`);
        if (!pageElement) return;
        const { clientX, clientY } = event;
        const { left, top } = pageElement.getBoundingClientRect();
        const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
        const pageWidth = pageDim?.width || 0;
        const pageHeight = pageDim?.height || 0;
        const pageScale = getScaleForPage(pageNumber);
        let x = (clientX - left) / pageScale;
        let y = (clientY - top) / pageScale;
        // alert(`Clicked at page coords: (${x.toFixed(2)}, ${y.toFixed(2)}) on page ${pageNumber}`);



        const newAnnotation = {
            id: Date.now(),
            pageNumber,
            x, y,
            width: 125,
            height: 35,
            text: signer.email,
            color: signer.color,
        };

        setSignatureBoxes(prev => {
            const updated = prev.map(box =>
                box.signer.id === signer.id
                    ? { ...box, annotations: [...box.annotations, newAnnotation] }
                    : box
            );
            if (!prev.some(box => box.signer.id === signer.id)) {
                console.error(`Signer with ID ${signer.id} not found.`);
            }
            return updated;
        });

        setAddSignatureBox(false);
    };

    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const pages = Array.from(container.querySelectorAll('.page-container'));
            const containerTop = container.getBoundingClientRect().top;
            let newCurrentPage = 1;
            pages.forEach((page, index) => {
                const { top: pt, bottom: pb } = page.getBoundingClientRect();
                if (pt - containerTop < container.clientHeight / 2 && pb - containerTop > container.clientHeight / 2) {
                    newCurrentPage = index + 1;
                }
            });
            setPageNumber(prev => prev !== newCurrentPage ? newCurrentPage : prev);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [numPages]);

    const iconSz = isMobile ? 14 : 18;
    const labelSz = isMobile ? '10px' : '12px';

    return (
        <>
            {/* <LoadingDialog percentage={loadingPercentage} opendialogloading={loading} msg={`Loading ${numPages} pages...`} /> */}

            {/* ── Toolbar ── */}
            <div className="controls bg-white shadow-lg text-dark p-1 d-flex align-items-center justify-content-between">
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginLeft: '1rem' }}>

                    {/* Thumbnail toggle */}
                    <Tooltip title={isAsideOpen ? "Hide page navigation" : "Show page navigation"}>
                        <Box
                            onClick={toggleAside}
                            className='shadow-lg'
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                px: 1,
                                height: 32,
                                borderRadius: 1.5,
                                cursor: "pointer",
                                userSelect: "none",
                                bgcolor: isAsideOpen ? "#EEF4FF" : "transparent",
                                color: isAsideOpen ? "#1C4690" : "text.secondary",
                                transition: "all .2s ease",

                                "&:hover": {
                                    bgcolor: "#F5F8FD",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "transform .2s ease",
                                    // transform: isAsideOpen ? "rotate(0deg)" : "rotate(180deg)",
                                }}
                            >

                              {isAsideOpen?   <TfiLayoutSidebarLeft size={15} />: <TfiLayoutSidebarNone  size={15} />}
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    flexGrow: 1,
                                }}
                            >
                               {isAsideOpen ? "Close" : "Open"} Pages Navigation
                            </Typography>


                        </Box>
                    </Tooltip>

                    {/* Page input */}
                    <span className="text-dark" style={{ fontSize: labelSz }}>
                        Page{' '}
                        <input
                            type="number"
                            value={pageNumber}
                            placeholder={pageNumber}
                            onChange={handlePageInputChange}
                            style={{
                                marginLeft: '0.5rem',
                                width: isMobile ? '40px' : '60px',
                                padding: '5px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontSize: labelSz,
                            }}
                        />{' '}
                        / {numPages}
                    </span>

                    {/* Erase all */}
                    {signatureBoxes?.length > 0 && (
                        <Tooltip title="Clear all signature boxes">
                            <Button
                                variant="outlined"
                                color="warning"
                                size="small"
                                onClick={() => setSignatureBoxes([])}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    borderRadius: '999px',
                                    px: 1.8,
                                    py: 0.8,
                                    minHeight: 34,
                                    boxShadow: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <FaEraser style={{ fontSize: '13px', flexShrink: 0 }} />
                                Erase All Signature Boxes
                            </Button>
                        </Tooltip>
                    )}

                    {/* Zoom controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaSearchMinus
                            onClick={zoomOut}
                            style={{ fontSize: iconSz, color: '#2757aa', cursor: 'pointer' }}
                        />
                        <Slider
                            size="small"
                            value={zoom * 100}
                            onChange={(_, v) => setZoom(v / 100)}
                            min={25}
                            max={200}
                            aria-label="Zoom"
                            sx={{ width: 120 }}
                        />
                        <FaSearchPlus
                            onClick={zoomIn}
                            style={{ fontSize: iconSz, color: '#2757aa', cursor: 'pointer' }}
                        />
                        <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '12.8px', color: '#333' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <Tooltip title="Reset Zoom">
                            <span>
                                <FaRedo
                                    onClick={resetZoom}
                                    style={{ fontSize: iconSz, color: '#2757aa', cursor: 'pointer' }}
                                />
                            </span>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* ── Body: thumbnail sidebar + main viewer side by side ── */}
            <div className="pdf-viewer-container">

                {isAsideOpen && (
                    <aside className="pdf-thumbnail-panel scrollbar-custom1" ref={containerRef}>
                        <div className="thumbnail-scroll-container">
                            <Document className="pdf-container" file={uploadeddocument}>
                                {[...Array(numPages).keys()].map((pageIndex) => (
                                    <div
                                        key={`thumbnail_${pageIndex + 1}`}
                                        id={`thumbnail_${pageIndex + 1}`}
                                        className={`thumbnail-item ${pageNumber === pageIndex + 1 ? 'active' : ''}`}
                                        onClick={() => thumbnailNavigation(pageIndex)}
                                    >
                                        <Page
                                            pageNumber={pageIndex + 1}
                                            scale={getScaleForPageThumbnail(pageIndex + 1)}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="page-container"
                                        />
                                        <span className="thumbnail-page-number">{pageIndex + 1}</span>
                                    </div>
                                ))}
                            </Document>
                        </div>
                    </aside>
                )}

                {/* Main PDF viewer */}
                <main
                    className="pdf-main-viewer scrollbar-custom"
                    ref={mainContainerRef}

                >
                    <Document
                        className="pdf-container"
                        file={uploadeddocument}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="pdf-skeleton" />}
                        error={<div>Error loading PDF!</div>}
                    >
                        {[...Array(numPages).keys()].map((pageIndex) => (
                            <div
                                key={`page_${pageIndex + 1}`}
                                id={`page_${pageIndex + 1}`}
                                className="pdf-page-wrapper"
                                onClick={(e) => handleAnnotation(e, pageIndex + 1)}
                            >
                                <Page
                                    pageNumber={pageIndex + 1}
                                    scale={getScaleForPage(pageIndex + 1, zoom)}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="page-container shadow-sm"
                                    onLoadSuccess={onPageLoadSuccess}
                                />
                                <div
                                    className="annotation-canvas"
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        zIndex: 5,
                                        pointerEvents: 'auto',
                                    }}
                                >
                                    {renderSigningBoxAnnotations(pageIndex + 1)}
                                </div>
                            </div>
                        ))}
                    </Document>
                </main>
            </div>
        </>
    );
};

export default PDFViewerPreview3;