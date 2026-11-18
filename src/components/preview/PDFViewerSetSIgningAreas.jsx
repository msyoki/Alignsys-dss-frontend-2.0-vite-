import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SmoothPage from './SmoothPage';
import useFitWidthZoom from './useFitWidthZoom';
import usePanelWidth from './usePanelWidth';
import ThumbnailOverlay from './ThumbnailOverlay';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import Draggable from 'react-draggable';
import '../../styles/Pdfviewersigningareas.css'
import LoadingDialog from '../loaders/LoadingDialog';
import {
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';

import { TfiLayoutSidebarLeft } from "react-icons/tfi";
import { TfiLayoutSidebarNone } from "react-icons/tfi";
import SignBoxVisual from './SignBoxVisual';
import ViewerToolbar from './ViewerToolbar';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDFViewerSetSIgningAreas = ({
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
    // Start every page fitted to the viewer's width (phones, tablets, desktop).
    useFitWidthZoom(mainContainerRef, setZoom);
    // Thumbnails are drawn at the side panel's width, so the panel never scrolls sideways.
    const thumbWidth = usePanelWidth(containerRef, isAsideOpen);

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

    const onPageLoadSuccess = (page, renderScale) => {
        const { pageNumber, width, height, rotate } = page;

        if (pageNumber <= numPages) {
            setPagesLoaded(prev => Math.min(prev + 1, numPages));
            setLoadingPercentage(((pagesLoaded + 1) / numPages) * 100);
        }

        if (rotate % 360 !== 0) setIsRotated(true);

        // Divide by the scale actually used to render this page (not just `zoom`),
        // so the stored dimensions are always the true natural (scale=1) size.
        // Using `zoom` alone here caused a feedback loop for landscape pages:
        // getScaleForPage's fit-to-width factor would get baked into the stored
        // width, which shrank the fit calculation next render, which changed the
        // render scale, which re-fired onLoadSuccess, oscillating forever.
        const effectiveScale = renderScale || 1;

        const adjustedWidth =
            (rotate % 180 !== 0 ? height : width) / effectiveScale;

        const adjustedHeight =
            (rotate % 180 !== 0 ? width : height) / effectiveScale;

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

    const getScaleForPage = (pageNumber) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber);
        if (!pageDim) return 1;

        const isLandscape = pageDim.width > pageDim.height;
        if (!isLandscape) return 1;

        const container = mainContainerRef.current;
        const availableWidth = container ? container.clientWidth - 48 : pageDim.width;
        const fitScale = availableWidth / pageDim.width;
        return Math.min(1, fitScale); // never upscale past natural size
    };

    const getScaleForPageThumbnail = (pageNumber) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber);
        return pageDim && pageDim.width > pageDim.height ? 0.18 : 0.28;
    };

    // View-only copy of the page's signature boxes (in each signer's colour) on its thumbnail.
    const renderThumbnailOverlay = (pageNumber) => {
        const pageDim = pageDimensions.find(d => d.pageNumber === pageNumber);
        if (!pageDim) return null;
        const scale = thumbWidth ? thumbWidth / pageDim.width : getScaleForPageThumbnail(pageNumber);
        const items = signatureBoxes
            .flatMap(box => box.annotations)
            .filter(a => a.pageNumber === pageNumber)
            .map(a => ({ id: a.id, kind: 'box', x: a.x, y: a.y, width: a.width, height: a.height, color: a.color }));
        return <ThumbnailOverlay items={items} scale={scale} pageWidth={pageDim.width} pageHeight={pageDim.height} />;
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
            // Not while typing in a field (signer search, page number, ...).
            const tag = event.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
            // Removes the selected box (this used to call an undefined confirm dialog and fail).
            if (event.key === 'Delete' && selectedAnnotationId) {
                deleteAnnotation(selectedAnnotationId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedAnnotationId]);

    const handleDragStop = (annotation, data) => {

        const pageDim = pageDimensions.find(
            p => p.pageNumber === annotation.pageNumber
        );

        if (!pageDim) return;

        const pageScale =
            getScaleForPage(annotation.pageNumber) * zoom;

        let newX = data.x / pageScale;
        let newY = data.y / pageScale;

        // Never let the box's bounds exceed the page itself (extreme zoom-out safeguard)
        const clampWidth = Math.min(annotation.width, pageDim.width);
        const clampHeight = Math.min(annotation.height, pageDim.height);

        newX = Math.max(
            0,
            Math.min(
                newX,
                pageDim.width - clampWidth
            )
        );

        newY = Math.max(
            0,
            Math.min(
                newY,
                pageDim.height - clampHeight
            )
        );

        setSignatureBoxes(prev =>
            prev.map(box =>
                box.signer.id === signer.id
                    ? {
                        ...box,
                        annotations: box.annotations.map(a =>
                            a.id === annotation.id
                                ? {
                                    ...a,
                                    x: newX,
                                    y: newY
                                }
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

        const pageScale = getScaleForPage(pageNumber) * zoom;

        const filteredAnnotations = signatureBoxes
            .flatMap(box => box.annotations)
            .filter(a => a.pageNumber === pageNumber);

        return (
            <>
                {filteredAnnotations.map(annotation => {

                    const isSelected = selectedAnnotationId === annotation.id;

                    let { x, y } = annotation;
                    // switch (rotation) {
                    //     case 90:
                    //         [x, y] = [y, pageWidth - x];
                    //         break;
                    //     case 180:
                    //         x = pageWidth - x;
                    //         y = pageHeight - y;
                    //         break;
                    //     case 270:
                    //         [x, y] = [pageHeight - y, x];
                    //         break;
                    // }

                    // Never let the box be larger than the page itself (extreme zoom-out safeguard)
                    const renderWidth = Math.min(annotation.width * pageScale, pageWidth * pageScale);
                    const renderHeight = Math.min(annotation.height * pageScale, pageHeight * pageScale);

                    const renderX = Math.max(0, Math.min(x * pageScale, (pageWidth * pageScale) - renderWidth));
                    const renderY = Math.max(0, Math.min(y * pageScale, (pageHeight * pageScale) - renderHeight));


                    return (
                        <Draggable
                            // Keyed by id only: `position` is controlled, so the box just moves
                            // when zoom changes instead of being torn down and re-created (which
                            // made every box blink on each zoom step).
                            key={annotation.id}
                            position={{ x: renderX, y: renderY }}
                            onStop={(e, data) => handleDragStop(annotation, data)}
                            cancel=".sa-no-drag"

                            bounds={{
                                left: 0,
                                top: 0,
                                right: Math.max(0, (pageWidth * pageScale) - renderWidth),
                                bottom: Math.max(0, (pageHeight * pageScale) - renderHeight),
                            }}
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
                                    width: `${renderWidth}px`,
                                    height: `${renderHeight}px`,
                                    cursor: 'move',
                                }}
                            >
                                <SignBoxVisual
                                    color={annotation.color}
                                    email={annotation.text}
                                    selected={isSelected}
                                    scale={pageScale}
                                    onRemove={() => deleteAnnotation(annotation.id)}
                                />
                            </div>
                        </Draggable>
                    );
                })}
            </>
        );
    };

    const handleAnnotation = (event, pageNumber) => {
        // alert(pageNumber)
        event.preventDefault();
        if (!addSignatureBox) return;

        // const pageElement = document.getElementById(`page_${pageNumber}`);
        // if (!pageElement) return;

        // const { left, top } = pageElement.getBoundingClientRect();
        // const x = (event.clientX - left) / zoom;
        // const y = (event.clientY - top) / zoom;
        // Look inside this viewer only: another viewer (e.g. the page behind the dialog)
        // can have elements with the same page ids.
        const pageElement = mainContainerRef.current?.querySelector(`#page_${pageNumber}`)
            || event.currentTarget?.closest?.(`#page_${pageNumber}`);
        if (!pageElement) return;
        const { clientX, clientY } = event;
        const { left, top } = pageElement.getBoundingClientRect();
        const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
        const pageWidth = pageDim?.width || 0;
        const pageHeight = pageDim?.height || 0;
        // Use the same scale the render pipeline uses: baseScale * zoom
        const pageScale = getScaleForPage(pageNumber) * zoom;

        let x = (clientX - left) / pageScale;
        let y = (clientY - top) / pageScale;

        // Keep box fully inside page (guard against the page itself being
        // smaller than the default box size at extreme zoom-out)
        const boxWidth = Math.min(125, pageWidth);
        const boxHeight = Math.min(35, pageHeight);
        x = Math.max(0, Math.min(x, pageWidth - boxWidth));
        y = Math.max(0, Math.min(y, pageHeight - boxHeight));
        // alert(`Clicked at page coords: (${x.toFixed(2)}, ${y.toFixed(2)}) on page ${pageNumber}`);



        const newAnnotation = {
            id: Date.now(),
            pageNumber,
            x, y,
            width: boxWidth,
            height: boxHeight,
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


    return (
        <div className="sa-viewer-root"
            // Clicking anywhere in the viewer outside a box deselects the selected box
            // (the box itself, and its Remove label, keep their own clicks).
            onMouseDownCapture={(e) => {
                if (selectedAnnotationId && !e.target.closest?.('.react-draggable')) setSelectedAnnotationId(null);
            }}
        >
            {/* <LoadingDialog percentage={loadingPercentage} opendialogloading={loading} msg={`Loading ${numPages} pages...`} /> */}

            {/* ── Toolbar ── (same actions as before, restyled) */}
            <ViewerToolbar
                asideOpen={isAsideOpen}
                onToggleAside={toggleAside}
                asideIcon={isAsideOpen ? <TfiLayoutSidebarLeft size={14} /> : <TfiLayoutSidebarNone size={14} />}
                pageNumber={pageNumber}
                numPages={numPages}
                onPageInput={handlePageInputChange}
                onPrev={() => pageNumber > 1 && thumbnailNavigation(pageNumber - 2)}
                onNext={() => numPages && pageNumber < numPages && thumbnailNavigation(pageNumber)}
                prevIcon={<FaChevronLeft size={12} />}
                nextIcon={<FaChevronRight size={12} />}
                zoom={zoom}
                setZoom={setZoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
                canClear={signatureBoxes?.some((b) => b.annotations?.length > 0)}
                onClear={() => setSignatureBoxes([])}
            />

            {/* ── Body: thumbnail sidebar + main viewer side by side ── */}
            <div className="sa-viewer-container">

                {isAsideOpen && (
                    <aside className="sa-thumbnail-panel sa-scrollbar-thumbs" ref={containerRef}>
                        <div className="sa-thumbnail-scroll-container">
                            <Document className="pdf-container" file={uploadeddocument}>
                                {[...Array(numPages).keys()].map((pageIndex) => (
                                    <div
                                        key={`thumbnail_${pageIndex + 1}`}
                                        id={`thumbnail_${pageIndex + 1}`}
                                        className={`thumbnail-item ${pageNumber === pageIndex + 1 ? 'active' : ''}`}
                                        onClick={() => thumbnailNavigation(pageIndex)}
                                    >
                                        <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
                                            <Page
                                                pageNumber={pageIndex + 1}
                                                {...(thumbWidth ? { width: thumbWidth } : { scale: getScaleForPageThumbnail(pageIndex + 1) })}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                className="page-container"
                                            />
                                            {renderThumbnailOverlay(pageIndex + 1)}
                                        </div>
                                        <span className="thumbnail-page-number">{pageIndex + 1}</span>
                                    </div>
                                ))}
                            </Document>
                        </div>
                    </aside>
                )}

                {/* Main PDF viewer */}
                <main
                    className="sa-main-viewer sa-scrollbar-main"
                    ref={mainContainerRef}
                    style={{ height: isMobile ? '70vh' : '100%' }}
                >
                    <Document
                        className="pdf-container"
                        file={uploadeddocument}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="pdf-skeleton" />}
                        error={<div>Error loading PDF!</div>}
                    >

                        {[...Array(numPages).keys()].map((pageIndex) => {
                            const { width, height } = getPageSize(pageIndex + 1);
                            const pageScale = getScaleForPage(pageIndex + 1) * zoom;
                            const scaledWidth = width * pageScale;
                            const scaledHeight = height * pageScale;
                            return (
                                <React.Fragment key={`pagefrag_${pageIndex + 1}`}>
                                    <div
                                        key={`page_${pageIndex + 1}`}
                                        id={`page_${pageIndex + 1}`}
                                        className="sa-page-wrapper"
                                        onClick={(event) => handleAnnotation(event, pageIndex + 1)}
                                        onDoubleClick={() => {
                                            setSelectedAnnotationId(null);
                                        }}
                                        style={
                                            width > 0 && height > 0
                                                ? {
                                                    width: `${scaledWidth}px`,
                                                    height: `${scaledHeight}px`,
                                                    cursor: addSignatureBox ? 'crosshair' : undefined,
                                                }
                                                : (addSignatureBox ? { cursor: 'crosshair' } : undefined)
                                        }
                                    >
                                        <SmoothPage
                                            pageNumber={pageIndex + 1}
                                            scale={pageScale}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="sa-page-canvas"
                                            onLoadSuccess={(page) => onPageLoadSuccess(page, pageScale)}
                                        />
                                        {/* Annotation Layer */}
                                        <div
                                            // className="annotation-canvas"
                                            className="sa-annotation-overlay" style={{ width: scaledWidth, height: scaledHeight }}
                                        >
                                            {renderSigningBoxAnnotations(pageIndex + 1)}


                                        </div>
                                    </div>
                                    {/* Divider between pages, not after last page.
                                        Scales with zoom so spacing stays proportional
                                        whether the current/next page is portrait or landscape. */}
                                    {pageIndex < numPages - 1 && (
                                        <div className="sa-page-divider" style={{ height: 15 * zoom }} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </Document>
                </main>
            </div>
        </div>
    );
};

export default PDFViewerSetSIgningAreas;