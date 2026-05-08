import React, { useState, useEffect, useRef } from 'react';
import {
  FaTrash,
  FaBars,
  FaBarsStaggered,
  FaKeyboard,
  FaStamp,
  FaSignature,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaRotateRight
} from 'react-icons/fa6';
import { FaThList } from "react-icons/fa";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import Draggable from 'react-draggable';
import '../../styles/PDFViewerTechedge.css';
import { Tooltip, Slider } from '@mui/material';
import DeleteAnnotationDialog from '../DeleteAnnotation';
import MultipageInfoDialog from '../dialogs/MultipageInfoDialog';
import SignSignatureBoxesDialog from '../dialogs/SignSignatureBoxesDialog';
import ColorPicker from '../ColorPicker';
import { PDFDocument, rgb } from 'pdf-lib';
import { Button, Box, Typography } from '@mui/material';
// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDFViewerSigning = (props) => {
  // State
  const [color, setColor] = useState("#000000");
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const containerRef = useRef(null);
  const mainContainerRef = useRef(null);
  const [pageDimensions, setPageDimensions] = useState([]);
  const [cleanedPdf, setCleanedPdf] = useState(null);
  const [error, setError] = useState(null);
  const [deleteAnnotationDialog, setDeleteAnnotationDialog] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [initialPageForMultipage, setInitialPageForMultipage] = useState(null);
  const [multipageAnnotation, setMultipageAnnotation] = useState({});
  const [openMultipageInfoDialog, setOpenMultipageInfoDialog] = useState(false);
  const [showSignatureBoxes, setShowSignatureBoxes] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAsideOpen, setIsAsideOpen] = useState(true);
  const [signatureBox, setSignatureBox] = useState({ x: 200, y: 350, width: 100, height: 25 });
  const [pageOrientations, setPageOrientations] = useState({});
  const [isImageLocked, setIsImageLocked] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 50, height: 50 });

  // Navigation
  const goToPreviousPage = () => setPageNumber(prevPage => Math.max(prevPage - 1, 1));
  const goToNextPage = () => setPageNumber(prevPage => Math.min(prevPage + 1, numPages));

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.01, 1.51));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.01, 0.5));


  const resetZoom = () => setZoom(1);

  const toggleAside = () => setIsAsideOpen(!isAsideOpen);

  // Page load
  const onPageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    const isLandscape = viewport.width > viewport.height;
    setPageOrientations((prev) => ({
      ...prev,
      [page.pageNumber]: isLandscape ? 'landscape' : 'portrait',
    }));

    const { pageNumber, width, height, rotate } = page;
    if (pageNumber <= numPages) {
      props.setPagesLoaded(prev => Math.min(prev + 1, numPages));
      const newPercentage = ((props.pagesLoaded + 1) / numPages) * 100;
      if (newPercentage >= 100) {
        props.setLoading(false);
      }
      if (newPercentage <= 100) {
        props.setLoadingPercentage(newPercentage);
      }
    }
    const isRotated = rotate % 360 !== 0;
    if (isRotated) props.setIsRotated(true);

    const adjustedWidth = ((rotate % 180 !== 0) ? height : width) / zoom;
    const adjustedHeight = ((rotate % 180 !== 0) ? width : height) / zoom;

    setPageDimensions(prev => {
      const pageExists = prev.find(p => p.pageNumber === pageNumber);
      if (pageExists) {
        return prev.map(p =>
          p.pageNumber === pageNumber ? { pageNumber, width: adjustedWidth, height: adjustedHeight } : p
        );
      } else {
        return [...prev, { pageNumber, width: adjustedWidth, height: adjustedHeight }];
      }
    });

    if (props.pagesLoaded + 1 === numPages) {
      props.setLoading(false);
      props.setPagesLoaded(0);
      props.setLoadingPercentage(100);
    }
  };

  const getPageSize = (pageNumber) => {
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
    return {
      width: pageDim?.width ?? 0,
      height: pageDim?.height ?? 0,
    };
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    props.setNumPages(numPages);
  };

  // Annotation handlers
  const handleAnnotation = async (event, pageNumber) => {
    event.preventDefault();
    const pageElement = document.getElementById(`page_${pageNumber}`);
    if (!pageElement) return;
    const { clientX, clientY } = event;
    const { left, top } = pageElement.getBoundingClientRect();
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
    const pageWidth = pageDim?.width || 0;
    const pageHeight = pageDim?.height || 0;
    const pageScale = getScaleForPage(pageNumber) * zoom;
    let x = (clientX - left) / pageScale;
    let y = (clientY - top) / pageScale;
    const { selectedTool, customImage, setSelectedTool, setCustomImage } = props;

    if (selectedTool === 'image' && customImage) {
      try {
        const img = new Image();
        img.src = customImage;
        await img.decode();
        let annWidth = img.naturalWidth / 4;
        let annHeight = img.naturalHeight / 4;
        let px = x - (props.signatureHasAnnotations ? 90 : 40);
        let py = y - 30;
        // Clamp to page bounds using rendered size
        px = Math.max(0, Math.min(px, pageWidth - annWidth));
        py = Math.max(0, Math.min(py, pageHeight - annHeight));
        addImageToCanvas(
          customImage,
          img.naturalWidth,
          img.naturalHeight,
          px,
          py,
          pageNumber,
          pageDim
        );
        setSelectedTool(null);
        setCustomImage(null);
      } catch (error) {
        console.error("Image decoding failed:", error);
      }
    } else if (selectedTool === 'text') {
      let px = x - 60;
      let py = y - 10;
      // Clamp to page bounds (assume text box 120x40)
      px = Math.max(0, Math.min(px, pageWidth - 120));
      py = Math.max(0, Math.min(py, pageHeight - 40));
      addTextToCanvas("Double click to edit text", px, py, pageNumber, pageDim);
      setSelectedTool(null);
    }
  };

  const addPredefinedAnnotationsWithPageDims = () => {
    let updatedAnnotations = [...props.annotations]; // start from existing

    props.signerAnnotations.forEach(annotation => {
      const pageDim = pageDimensions.find(dim => dim.pageNumber === annotation.page_number);

      const newAnnotation = {
        id: annotation.annotation_id || Date.now() + Math.random(),
        type: 'image',
        src: props.customImage,
        x: annotation.x,
        y: annotation.y,
        isSignature: true,
        pageNumber: annotation.page_number,
        width: annotation.width,
        height: annotation.height,
        pageWidth: pageDim?.width || 0,
        pageHeight: pageDim?.height || 0,
        originalText: annotation.text,
        originalColor: annotation.color,
        isDraggable: false,
      };

      // Check if there's an existing annotation that matches everything except `src`
      const existingIndex = updatedAnnotations.findIndex(a =>
        a.type === newAnnotation.type &&
        a.pageNumber === newAnnotation.pageNumber &&
        a.x === newAnnotation.x &&
        a.y === newAnnotation.y &&
        a.width === newAnnotation.width &&
        a.height === newAnnotation.height &&
        a.isSignature === newAnnotation.isSignature
      );

      if (existingIndex !== -1) {
        // If found, update the image (keep the same ID)
        updatedAnnotations[existingIndex] = {
          ...updatedAnnotations[existingIndex],
          src: newAnnotation.src,
        };
      } else {
        // Otherwise, add as a new one
        updatedAnnotations.push(newAnnotation);
      }
    });

    // Commit updates once
    props.updateAnnotations(updatedAnnotations);
    props.setCustomImage(null);
    props.setSignatureExists(true);
    setShowSignatureBoxes(false);
  };




  const addTextToCanvas = (text, x, y, pageNumber, pageDim) => {
    console.log(color)
    const newAnnotation = {
      id: Date.now(),
      type: 'text',
      content: text,
      x,
      y,
      pageNumber,
      color: color,
      size: '10px',
      pageWidth: pageDim?.width || 0,
      pageHeight: pageDim?.height || 0,
      isDraggable: true,
      width: 120, // Default width for text annotation
      height: 40 // Default height for text annotation
    };
    props.updateAnnotations([...props.annotations, newAnnotation]);
  };

  const addImageToCanvas = async (src, w, h, x, y, pageNumber, pageDim) => {
    const newAnnotation = {
      id: Date.now(),
      type: 'image',
      src,
      x,
      y,
      isSignature: props.isStamp ? false : true,
      pageNumber,
      width: w / 4,
      height: h / 4,
      pageWidth: pageDim?.width || 0,
      pageHeight: pageDim?.height || 0,
      isDraggable: true
    };
    props.updateAnnotations([...props.annotations, newAnnotation]);
    if (props.multipage && !props.clickedPlaceAgain) {
      setMultipageAnnotation(newAnnotation);
      setInitialPageForMultipage(pageNumber);
      props.setPendingMultipage(true);
      setOpenMultipageInfoDialog(true);
    } else {
      const signatureExists = props.annotations.some(annotation => annotation.isSignature === true);
      if (signatureExists || newAnnotation.isSignature) {
        props.setSignatureExists(true);
      }
    }
  };

  // Multipage annotation logic
  const handleAbortMultipageAnnotation = () => {
    props.setPendingMultipage(false);
    const signatureExists = props.annotations.some(annotation => annotation.isSignature === true);
    if (signatureExists) {
      props.setSignatureExists(true);
    }
  };

  const addMultipageAnnotation = () => {
    let currentPage = 1;
    while (currentPage <= numPages && currentPage <= 500) {
      if (currentPage !== initialPageForMultipage) {
        const pageAnnotation = { ...multipageAnnotation, pageNumber: currentPage };
        props.updateAnnotations((prevAnnotations) => [...prevAnnotations, pageAnnotation]);
      }
      currentPage++;
    }
    const signatureExists = props.annotations.some(annotation => annotation.isSignature) || multipageAnnotation.isSignature;
    if (signatureExists) {
      props.setSignatureExists(true);
    }
    props.setPendingMultipage(false);
  };

  // Annotation selection and editing
  const selectAnnotation = (annotationId) => setSelectedAnnotationId(annotationId);

  const updateTextAnnotation = (id, newText) => {
    const updatedAnnotations = props.annotations.map(annotation => {
      if (annotation.id === id && annotation.type === 'text') {
        return { ...annotation, content: newText };
      }
      return annotation;
    });
    props.updateAnnotations(updatedAnnotations);
  };

  const deleteAnnotation = (annotationId) => {
    if (annotationId === multipageAnnotation.id) handleAbortMultipageAnnotation();
    const updatedAnnotations = props.annotations.filter(annotation => annotation.id !== annotationId);
    props.updateAnnotations(updatedAnnotations);
    const signatureExists = updatedAnnotations.some(annotation => annotation.isSignature === true);
    props.setSignatureExists(signatureExists);
    setSelectedAnnotationId(null);
  };

  const handleResize = (e, size, id) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedAnnotations = props.annotations.map(annotation => {
      if (annotation.id === id) {
        return {
          ...annotation,
          width: size.width,
          height: size.height
        };
      }
      return annotation;
    });
    props.updateAnnotations(updatedAnnotations);
    if (props.pendingMultipage) {
      setMultipageAnnotation(prevAnnotation => ({
        ...prevAnnotation,
        width: size.width,
        height: size.height
      }));
    }
  };

  const handleResizeMouseDown = (e, annotation) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = annotation.width * zoom;
    const startHeight = annotation.height * zoom;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(startWidth + deltaX, 50);
      const newHeight = Math.max(startHeight + deltaY, 50);
      handleResize(moveEvent, { width: newWidth, height: newHeight }, annotation.id);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Drag handler
  const handleDragStop = (annotation, data) => {
    const { x, y } = data;
    const pageNumber = annotation.pageNumber;
    const rotation = props.pageRotations?.[pageNumber] || 0;
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
    const pageWidth = pageDim?.width || 0;
    const pageHeight = pageDim?.height || 0;
    const pageScale = getScaleForPage(pageNumber) * zoom;
    let scaledX = x / pageScale;
    let scaledY = y / pageScale;
    let newX = scaledX;
    let newY = scaledY;
    switch (rotation) {
      case 90:
        newX = pageWidth - scaledY;
        newY = scaledX;
        break;
      case 180:
        newX = pageWidth - scaledX;
        newY = pageHeight - scaledY;
        break;
      case 270:
        newX = scaledY;
        newY = pageHeight - scaledX;
        break;
      // case 0: use scaledX, scaledY
    }
    const annotationWidth = annotation.width || 100;
    const annotationHeight = annotation.height || 30;
    // Clamp to bounds so annotation never crosses left/right/top/bottom
    newX = Math.max(0, Math.min(newX, pageWidth - annotationWidth));
    newY = Math.max(0, Math.min(newY, pageHeight - annotationHeight));
    if (props.pendingMultipage) {
      setMultipageAnnotation(prevAnnotation => ({
        ...prevAnnotation,
        x: newX,
        y: newY,
      }));
    }
    const updatedAnnotations = props.annotations.map(a =>
      a.id === annotation.id ? { ...a, x: newX, y: newY } : a
    );
    props.updateAnnotations(updatedAnnotations);
  };

  // Annotation rendering
  const renderAnnotations = (pageNumber) => {
    const container = containerRef.current;
    const containerWidth = container ? container.offsetWidth : 0;
    const containerHeight = container ? container.offsetHeight : 0;
    const rotation = props.pageRotations?.[pageNumber] || 0;
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
    const pageWidth = pageDim?.width || containerWidth;
    const pageHeight = pageDim?.height || containerHeight;
    const pageScale = getScaleForPage(pageNumber) * zoom;

    return props.annotations
      .filter(annotation => annotation.pageNumber === pageNumber)
      .map(annotation => {
        let { x, y } = annotation;
        switch (rotation) {
          case 90:
            [x, y] = [y, pageWidth - x];
            break;
          case 180:
            x = pageWidth - x;
            y = pageHeight - y;
            break;
          case 270:
            [x, y] = [pageHeight - y, x];
            break;
        }
        // Clamp annotation position so it never renders outside page
        const renderX = Math.max(0, Math.min(x * pageScale, (pageWidth * pageScale) - (annotation.width * pageScale)));
        const renderY = Math.max(0, Math.min(y * pageScale, (pageHeight * pageScale) - (annotation.height * pageScale)));
        return (
          <Draggable
            key={annotation.id}
            position={{ x: renderX, y: renderY }}
            onStop={(e, data) => handleDragStop(annotation, data)}
            bounds={{
              left: 0,
              top: 0,
              right: (pageWidth * pageScale) - (annotation.width * pageScale),
              bottom: (pageHeight * pageScale) - (annotation.height * pageScale),
            }}
            disabled={!annotation.isDraggable}
          >
            <div
              className={`annotation ${annotation.type} ${selectedAnnotationId === annotation.id ? 'selected' : ''}`}
              style={{
                width: `${annotation.width * pageScale}px`,
                height: `${annotation.height * pageScale}px`,
                position: 'absolute',
                cursor: 'move',
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectAnnotation(annotation.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (annotation.type === 'text') setEditingAnnotationId(annotation.id);
              }}
            >
              {annotation.type === 'text' ? (
                editingAnnotationId === annotation.id ? (
                  <textarea
                    value={annotation.content}
                    onChange={e => {
                      updateTextAnnotation(annotation.id, e.target.value);
                      // Auto-resize textarea as user types
                      const textarea = e.target;
                      textarea.style.height = 'auto';
                      textarea.style.height = textarea.scrollHeight + 'px';
                      textarea.style.width = 'auto';
                      textarea.style.width = textarea.scrollWidth + 'px';
                    }}
                    onBlur={e => {
                      // Use scrollWidth/scrollHeight for best fit
                      const textarea = e.target;
                      const pageDim = pageDimensions.find(dim => dim.pageNumber === annotation.pageNumber);
                      const pageScale = (pageDim ? getScaleForPage(annotation.pageNumber) : 1) * zoom;
                      const newWidth = textarea.scrollWidth / pageScale;
                      const newHeight = textarea.scrollHeight / pageScale;
                      const updatedAnnotations = props.annotations.map(a =>
                        a.id === annotation.id
                          ? { ...a, width: newWidth, height: newHeight }
                          : a
                      );
                      props.updateAnnotations(updatedAnnotations);
                      setEditingAnnotationId(null);
                    }}
                    autoFocus
                    style={{
                      width: `${annotation.width * pageScale}px`,
                      minWidth: '40px',
                      height: `${annotation.height * pageScale}px`,
                      minHeight: '24px',
                      border: `1px dashed ${annotation.color || 'gray'}`,
                      outline: 'none',
                      background: 'transparent',
                      fontSize: `${12 * pageScale}px`,
                      color: annotation.color,
                      resize: 'both',
                      padding: '4px',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      boxSizing: 'border-box',
                    }}
                    rows={3}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      // Allow Enter for new lines, update size on Enter
                      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                        e.target.select();
                        e.preventDefault();
                      }
                      if (e.key === 'Enter') {
                        // On Enter, update annotation size
                        const textarea = e.target;
                        const pageDim = pageDimensions.find(dim => dim.pageNumber === annotation.pageNumber);
                        const pageScale = (pageDim ? getScaleForPage(annotation.pageNumber) : 1) * zoom;
                        setTimeout(() => {
                          const newWidth = textarea.scrollWidth / pageScale;
                          const newHeight = textarea.scrollHeight / pageScale;
                          const updatedAnnotations = props.annotations.map(a =>
                            a.id === annotation.id
                              ? { ...a, width: newWidth, height: newHeight }
                              : a
                          );
                          props.updateAnnotations(updatedAnnotations);
                        }, 0);
                      }
                    }}
                  />
                ) : (
                  <div
                    className="annotation-item"
                    onDoubleClick={() => setEditingAnnotationId(annotation.id)}
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: annotation.color,
                      fontSize: `${12 * pageScale}px`,
                      background: 'transparent',
                      cursor: annotation.isSelected ? 'grab' : 'text',
                      userSelect: 'none',
                      width: '100%',
                      height: `${annotation.height * pageScale}px`, // always match annotation height
                      overflowWrap: 'break-word',
                      display: 'flex',
                      alignItems: 'flex-start',
                    }}
                    onMouseEnter={(e) => {
                      if (annotation.isSelected) e.currentTarget.style.cursor = 'grab';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.cursor = annotation.isSelected ? 'grab' : 'text';
                    }}
                  >
                    {annotation.content}
                  </div>
                )

              ) : (
                <img
                  src={annotation.src}
                  width={annotation.width * pageScale}
                  height={annotation.height * pageScale}
                  alt="image"
                  style={{ pointerEvents: 'none' }}

                />
              )}
              {selectedAnnotationId === annotation.id && (
                <FaTrash
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
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
              {annotation.type === 'image' && (
                <div
                  className="resize-corner"
                  onMouseDown={(e) => handleResizeMouseDown(e, annotation)}
                  style={{
                    position: 'absolute',
                    width: '15px',
                    height: '15px',
                    bottom: '0',
                    right: '0',
                    cursor: 'se-resize',
                  }}
                />
              )}
            </div>
          </Draggable>
        );
      });
  };

  const renderSigningBoxAnnotations = (pageNumber) => {
    const container = containerRef.current;
    const containerWidth = container ? container.offsetWidth : 0;
    const containerHeight = container ? container.offsetHeight : 0;
    const filteredAnnotations = (props.signerAnnotations || [])
      .filter((annotation) => annotation && annotation.page_number === pageNumber);

    return (
      <>
        {filteredAnnotations.map((annotation) => {
          const pageDim = pageDimensions.find((dim) => dim.pageNumber === pageNumber) || {};
          const { width: pageWidth = containerWidth, height: pageHeight = containerHeight } = pageDim;
          return (
            <button
              key={annotation.annotation_id}
              onClick={(e) => {
                e.stopPropagation();
                props.setClickedSignatureBox(true);
                props.SignSignatureBoxes();
              }}
              style={{
                position: "absolute",
                top: `${(annotation.y * zoom)}px`,
                left: `${annotation.x * zoom}px`,
                width: `${annotation.width * zoom}px`,
                height: `${annotation.height * zoom}px`,
                border: "2px dashed rgba(169, 169, 169, 0.7)",
                boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
                backgroundColor: annotation.color
                  ? `${annotation.color}33`
                  : "rgba(255, 255, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                pointerEvents: 'auto',
                cursor: "pointer",
                transition: "background-color 0.3s ease-in-out",
              }}
            >
              <p style={{ margin: 0, fontSize: `${11 * zoom}px` }}>
                Sign Here
              </p>
            </button>
          );
        })}
      </>
    );
  };

  // Utility
  const getScaleForPage = (pageNumber) => {
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
    if (!pageDim) return 1;
    const { width, height } = pageDim;
    const isLandscape = width > height;
    props.setLandscape(isLandscape);
    const rotation = props.pageRotations?.[pageNumber] || 0;
    if (isLandscape) {
      if (rotation === 90 || rotation === 270) return 1;
      return props.isRotated ? 1 : 0.7;
    }
    return 1;
  };

  const getScaleForPageThumbnail = (pageNumber) => {
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
    return pageDim && pageDim.width > pageDim.height ? 0.18 : 0.28;
  };

  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= numPages) {
      setPageInput(value);
      goToPage(value);
      const pageElement = document.getElementById(`page_${value}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (value === '' || isNaN(value)) {
      setPageInput('');
    } else {
      setPageInput(pageNumber);
    }
  };

  const thumbnailNavigation = (pageIndex) => {
    const pageNumber = pageIndex + 1;
    const pageElement = document.getElementById(`page_${pageIndex + 1}`);
    const thumbnailElement = document.getElementById(`thumbnail_${pageIndex + 1}`);
    if (pageElement && thumbnailElement) {
      thumbnailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setPageNumber(pageNumber);
      }, 100);
    }
  };

  const goToPage = (pageInput) => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  // Effects
  useEffect(() => {
    if (Array.isArray(props.signerAnnotations) && props.signerAnnotations.length > 0) {
      setIsImageLocked(false);   // Unlock if annotations exist
    } else {
      setIsImageLocked(true);    // Lock if none or invalid
    }
  }, [props.signerAnnotations]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (editingAnnotationId) {
          // Find the textarea for the editing annotation
          const textarea = document.querySelector('.annotation textarea');
          if (textarea) {
            // Find pageScale for the annotation
            const annotation = props.annotations.find(a => a.id === editingAnnotationId);
            let pageScale = 1;
            if (annotation) {
              const pageDim = pageDimensions.find(dim => dim.pageNumber === annotation.pageNumber);
              pageScale = (pageDim ? getScaleForPage(annotation.pageNumber) : 1) * zoom;
            }
            const rect = textarea.getBoundingClientRect();
            const newWidth = rect.width / pageScale;
            const newHeight = rect.height / pageScale;
            const updatedAnnotations = props.annotations.map(a =>
              a.id === editingAnnotationId
                ? { ...a, width: newWidth, height: newHeight }
                : a
            );
            props.updateAnnotations(updatedAnnotations);
          }
        }
        setEditingAnnotationId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingAnnotationId, props.annotations, pageDimensions, zoom]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' && selectedAnnotationId) {
        setDeleteAnnotationDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId]);

  useEffect(() => {
    const cleanBase64PDF = async (base64Url) => {
      try {
        const base64String = base64Url.split(',')[1];
        const binaryString = window.atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const isValidPDF = bytes.slice(0, 4).every((byte, index) => byte === [0x25, 0x50, 0x44, 0x46][index]);
        if (!isValidPDF) throw new Error('Invalid PDF data');
        const cleanedPdfBlob = new Blob([bytes], { type: 'application/pdf' });
        const cleanedPdfUrl = URL.createObjectURL(cleanedPdfBlob);
        setCleanedPdf(cleanedPdfUrl);
        setError(null);
      } catch (err) {
        console.error('Error cleaning PDF:', err);
        setError('Failed to load PDF. Please check the file format.');
      }
    };
    if (props.document) cleanBase64PDF(props.document);
  }, [props.document]);

  useEffect(() => {
    const container = containerRef.current;
    const handleScroll = () => {
      if (!container) return;
      const pages = Array.from(container.querySelectorAll('.page-container'));
      const containerTop = container.getBoundingClientRect().top;
      let newCurrentPage = 1;
      pages.forEach((page, index) => {
        const pageRect = page.getBoundingClientRect();
        const pageTop = pageRect.top - containerTop;
        const pageBottom = pageRect.bottom - containerTop;
        if (pageTop < container.clientHeight / 2 && pageBottom > container.clientHeight / 2) {
          newCurrentPage = index + 1;
        }
      });
      setPageNumber(newCurrentPage);
    };
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [numPages]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isImageLocked) setImagePosition({ x: event.clientX, y: event.clientY });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isImageLocked]);

  useEffect(() => {
    const getImageDimensions = (imageSrc) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error("Failed to load image"));
      });
    };
    if (props.customImage) {
      getImageDimensions(props.customImage)
        .then(({ width, height }) => setDimensions({ width, height }))
        .catch((error) => console.error(error));
    }
  }, [props.customImage]);

  useEffect(() => {
    const checkScreenSizeAndSetZoom = () => {
      setZoom(window.innerWidth <= 768 ? 0.5 : 1);
    };
    checkScreenSizeAndSetZoom();
    window.addEventListener('resize', checkScreenSizeAndSetZoom);
    return () => window.removeEventListener('resize', checkScreenSizeAndSetZoom);
  }, []);


  const downloadPDFWithAnnotations = async () => {
    try {
      // Convert base64 PDF to ArrayBuffer
      const base64String = props.document.split(',')[1];
      const binaryString = window.atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Load the existing PDF
      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();

      // Helper function to convert hex color to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
      };

      // Helper function to load image from base64
      const loadImageFromBase64 = async (base64String) => {
        try {
          if (base64String.startsWith('data:image/png')) {
            return await pdfDoc.embedPng(base64String);
          } else if (base64String.startsWith('data:image/jpeg') || base64String.startsWith('data:image/jpg')) {
            return await pdfDoc.embedJpg(base64String);
          } else {
            // Try PNG first, then JPG if that fails
            try {
              return await pdfDoc.embedPng(base64String);
            } catch {
              return await pdfDoc.embedJpg(base64String);
            }
          }
        } catch (error) {
          console.error('Error embedding image:', error);
          return null;
        }
      };

      // Process annotations for each page
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const pageNumber = pageIndex + 1;
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Get page dimensions from our state
        const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);
        const scaleX = pageWidth / (pageDim?.width || pageWidth);
        const scaleY = pageHeight / (pageDim?.height || pageHeight);

        // Filter annotations for this page
        const pageAnnotations = props.annotations.filter(annotation =>
          annotation.pageNumber === pageNumber
        );

        // Add each annotation to the page
        for (const annotation of pageAnnotations) {
          try {
            // Convert coordinates (PDF coordinate system has origin at bottom-left)
            const x = annotation.x * scaleX;
            const y = pageHeight - (annotation.y * scaleY) - (annotation.height || 20) * scaleY;

            if (annotation.type === 'text') {
              // Add text annotation
              const color = hexToRgb(annotation.color || '#000000');
              const fontSize = parseInt(annotation.size?.replace('px', '')) || 12;

              page.drawText(annotation.content || '', {
                x: x,
                y: y,
                size: fontSize * scaleY,
                color: rgb(color.r, color.g, color.b),
              });

            } else if (annotation.type === 'image' && annotation.src) {
              // Add image annotation
              const embeddedImage = await loadImageFromBase64(annotation.src);
              if (embeddedImage) {
                const width = (annotation.width || 100) * scaleX;
                const height = (annotation.height || 50) * scaleY;

                page.drawImage(embeddedImage, {
                  x: x,
                  y: y,
                  width: width,
                  height: height,
                });
              }
            }
          } catch (error) {
            console.error(`Error adding annotation ${annotation.id}:`, error);
          }
        }
      }

      // Generate the PDF bytes
      const pdfBytes = await pdfDoc.save();

      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-with-annotations-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully with annotations');

    } catch (error) {
      console.error('Error downloading PDF with annotations:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };
  const iconSz = isMobile ? 14 : 18;
  const labelSz = isMobile ? '10px' : '12px';

  // Render
  return (
    <>
      <SignSignatureBoxesDialog handleAnnotation={addPredefinedAnnotationsWithPageDims} open={props.openDialogSignBoxes} setOpen={props.setOpenDialogSignBoxes} />
      <MultipageInfoDialog open={openMultipageInfoDialog} setOpen={setOpenMultipageInfoDialog} stamp={props.isStamp} />
      <DeleteAnnotationDialog findAnnotationById={id => props.annotations.find(a => a.id === id)} deleteAnnotation={deleteAnnotation} selectedAnnotationId={selectedAnnotationId} setDeleteAnnotationDialog={setDeleteAnnotationDialog} deleteAnnotationDialog={deleteAnnotationDialog} />

      {/* Controls Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          flexWrap: "wrap",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1,
          p: { xs: 1, sm: 1.5 },
          bgcolor: "white",
          boxShadow: 3,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          zIndex: 10,
          marginBottom: 1,
        }}
      >
        {/* LEFT */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={isAsideOpen ? 'Close thumbnail view' : 'Open thumbnail view'}>
            <span
              onClick={toggleAside}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              {isAsideOpen
                ? <FaThList style={{ fontSize: iconSz, color: '#1C4690' }} />
                : <FaBars style={{ fontSize: iconSz, color: '#1C4690' }} />
              }
              <span className="text-muted" style={{ fontSize: labelSz }}>
                {isAsideOpen ? 'Close' : 'Open'} Snapshot View
              </span>
            </span>
          </Tooltip>
          {/* Page selector moved next to thumbnail toggle */}
          <Typography sx={{ fontSize: "12px", whiteSpace: "nowrap", ml: 2 }}>
            Page{" "}
            <input
              type="number"
              value={pageNumber}
              onChange={handlePageInputChange}
              style={{
                width: 45,
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: "2px 4px",
                marginLeft: 4,
              }}
            />{" "}
            / {numPages}
          </Typography>
        </Box>

        {/* CENTER (Zoom bar moved here) */}
        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
            justifyContent: { xs: "flex-start", sm: "center" },
          }}
        >
          {/* Zoom controls now centered */}
          <FaMagnifyingGlassMinus
            onClick={zoomOut}
            style={{ fontSize: 16, color: "#2757aa", cursor: "pointer" }}
          />

          <Slider
            size="small"
            value={zoom * 100}
            onChange={(_, v) => setZoom(v / 100)}
            min={25}
            max={151}
            sx={{ width: { xs: 90, sm: 120 } }}
          />

          <FaMagnifyingGlassPlus
            onClick={zoomIn}
            style={{ fontSize: 16, color: "#2757aa", cursor: "pointer" }}
          />

          <Tooltip title="Reset Zoom">
            <FaRotateRight
              onClick={resetZoom}
              style={{ fontSize: 16, color: "#2757aa", cursor: "pointer" }}
            />
          </Tooltip>

          <Typography sx={{ fontSize: "12px", minWidth: 40, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </Typography>

          {/* Multipage */}
          {props.pendingMultipage && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Tooltip title={props.isStamp ? "Stamp all pages" : "Sign all pages"}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={
                    props.isStamp ? (
                      <FaStamp style={{ fontSize: "13px" }} />
                    ) : (
                      <FaSignature style={{ fontSize: "13px" }} />
                    )
                  }
                  onClick={addMultipageAnnotation}
                  sx={{
                    textTransform: "none",
                    fontSize: "12px",
                    borderRadius: "20px",
                    px: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {props.isStamp ? "Stamp All" : "Sign All"}
                </Button>
              </Tooltip>

              <Tooltip title="Abort Multi-page Annotation">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAbortMultipageAnnotation}
                  sx={{
                    textTransform: "none",
                    fontSize: "12px",
                    borderRadius: "20px",
                    px: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  Abort
                </Button>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* RIGHT */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "nowrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {/* Add Text and ColorPicker remain on right */}
          <Tooltip title="Add Text">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FaKeyboard style={{ fontSize: "13px" }} />}
              onClick={() => props.setSelectedTool("text")}
              sx={{
                textTransform: "none",
                fontSize: "12px",
                borderRadius: "25px",
                px: 1.5,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              Add Text
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: color,
                }}
              />
            </Button>
          </Tooltip>

          <ColorPicker color={color} setColor={setColor} />
        </Box>
      </Box>

      <div className="pdf-viewer-container">
        {/* Sidebar Thumbnails */}
        {isAsideOpen && (
          <aside className="pdf-thumbnail-panel scrollbar-custom1" ref={containerRef}>
            <div className="thumbnail-scroll-container">
              <Document
                file={props.document}
                loading={
                  <>
                    {[...Array(typeof numPages === 'number' && numPages >= 1 ? numPages : 1).keys()].map((_, i) => (
                      <div
                        key={`thumb_skeleton_${i}`}
                        style={{
                          width: 90,
                          height: 120,
                          borderRadius: 8,
                          margin: '0 0 18px 0',
                          background: 'linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 37%, #e0e0e0 63%)',
                          backgroundSize: '400% 100%',
                          animation: 'skeleton-loading 1.4s ease infinite',
                        }}
                      />
                    ))}
                  </>
                }
              >
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

        {/* Main PDF Viewer */}
        <main
          className="pdf-main-viewer scrollbar-custom"
          ref={mainContainerRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            minHeight: 0,
            overflowX: 'auto',
          }}
        >
          <Document
            file={props.document}
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
                    className="pdf-page-wrapper"
                    onClick={(event) => handleAnnotation(event, pageIndex + 1)}
                    onDoubleClick={() => {
                      setEditingAnnotationId(null);
                      setSelectedAnnotationId(null);
                    }}
                   style={{
                      position: 'relative',
                      width: scaledWidth,
                      height: scaledHeight,
                      margin: '0 auto 24px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <Page
                      pageNumber={pageIndex + 1}
                      scale={pageScale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="page-container shadow-sm"
                      onLoadSuccess={onPageLoadSuccess}
                    />
                    {/* Annotation Layer */}
                    <div
                      className="annotation-canvas"
                      style={{
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                        pointerEvents: props.selectedTool ? 'auto' : 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    >
                      {renderAnnotations(pageIndex + 1)}
                      {showSignatureBoxes && renderSigningBoxAnnotations(pageIndex + 1)}
                    </div>
                  </div>
                  {/* Divider between pages, not after last page */}
                  {pageIndex < numPages - 1 && (
                    <div className="pdf-page-divider" />
                  )}
                </React.Fragment>
              );
            })}
            {/* Floating Image - Locked to Cursor */}
            {isImageLocked && props.customImage && !props.openDialogSignBoxes && (
              <img
                src={props.customImage}
                alt="Floating"
                style={{
                  position: 'fixed',
                  top: `${imagePosition.y}px`,
                  left: `${imagePosition.x}px`,
                  width: `${(dimensions.width / 4) * zoom}px`,
                  height: `${(dimensions.height / 4) * zoom}px`,
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9999,
                }}
              />
            )}
          </Document>
        </main>
      </div>
    </>
  );
};

export default PDFViewerSigning;