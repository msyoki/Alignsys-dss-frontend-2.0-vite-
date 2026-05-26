import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import Draggable from 'react-draggable';
import '../../styles/PDFViewerTechedge.css'
import { Slider, Tooltip } from '@mui/material';
import LoadingDialog from '../loaders/LoadingDialog';
import Button from '@mui/material/Button';
import { FaDownload, FaBars, FaTimes } from 'react-icons/fa';
import { FaBarsStaggered, FaMagnifyingGlassMinus, FaMagnifyingGlassPlus, FaRotateRight } from 'react-icons/fa6';
import { FaThList } from "react-icons/fa";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDFViewerPreview = ({ title, complete, document, height, handleClose }) => {
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
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Add zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  // Handle pinch zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        setZoom(prevZoom => {
          const newZoom = prevZoom + delta;
          return Math.min(Math.max(newZoom, 0.5), 2);
        });
      }
    };

    const container = mainContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (mainContainerRef.current) {
        setContainerWidth(mainContainerRef.current.offsetWidth);
      }
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toggleAside = () => {
    setIsAsideOpen(!isAsideOpen);
  };

  const onPageLoadSuccess = (page) => {
    const { pageNumber, width, height, rotate } = page;

    // Ensure the page number is within bounds
    if (pageNumber <= numPages) {
      // Update pagesLoaded count
      setPagesLoaded(prev => Math.min(prev + 1, numPages));

      // Calculate loading percentage
      const newPercentage = ((pagesLoaded + 1) / numPages) * 100;

      if (newPercentage >= 100) {
        setLoading(false);
        // console.log(newPercentage)
      }
      if (newPercentage <= 100) {
        setLoadingPercentage(newPercentage);
      }

    }

    // Check if rotation is applied and set rotation state accordingly
    const isRotated = rotate % 360 !== 0;
    if (isRotated) {
      setIsRotated(true);
    }

    // Swap width and height if page is rotated by 90 or 270 degrees
    const adjustedWidth = (rotate % 180 !== 0) ? height : width;
    const adjustedHeight = (rotate % 180 !== 0) ? width : height;

    // Update dimensions for the current page
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


    // Update loading state based on total pages loaded
    if (pagesLoaded + 1 === numPages) {
      setLoading(false);
      setPagesLoaded(0); // Reset pagesLoaded count if needed
      setLoadingPercentage(100); // Set to 100% when loading completes
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= numPages) {
      setPageNumber(value);
      const pageElement = mainContainerRef.current?.querySelector(`#page_${value}`);
      const thumbnailElement = containerRef.current?.querySelector(`#thumbnail_${value}`);
      if (pageElement && thumbnailElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
        thumbnailElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const thumbnailNavigation = (pageIndex) => {
    const pageNumber = pageIndex + 1;
    const pageElement = mainContainerRef.current?.querySelector(`#page_${pageNumber}`);
    const thumbnailElement = containerRef.current?.querySelector(`#thumbnail_${pageNumber}`);

    if (pageElement && thumbnailElement) {
      // First scroll the thumbnail into view
      thumbnailElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Then smoothly scroll the main page with a slight delay for visual flow
      setTimeout(() => {
        pageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setPageNumber(pageNumber);
      }, 100);
    }
  };

  // Function to calculate the scale based on page number
  const getScaleForPage = (pageNumber, zoom = 1) => {
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);

    if (!pageDim) {
      // Return a default scale if page dimensions are not found
      return 1 * zoom;
    }

    const { width, height } = pageDim;
    const isLandscape = width > height;

    // Determine base scale based on orientation and rotation status
    let baseScale;
    if (isLandscape) {
      baseScale = isRotated ? 0.8 : 0.6;
    } else {
      baseScale = 1;
    }

    return baseScale * zoom;
  };



  const getScaleForPageThumbnail = (pageNumber) => {
    const pageDim = pageDimensions.find(dim => dim.pageNumber === pageNumber);

    return pageDim && pageDim.width > pageDim.height ? 0.18 : 0.28; // Adjust the scale as needed



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
        if (event.key === 'ArrowDown') {
          mainContainerRef.current.scrollBy({ top: 100, behavior: 'smooth' });
        } else if (event.key === 'ArrowUp') {
          mainContainerRef.current.scrollBy({ top: -100, behavior: 'smooth' });
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
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

      setPageNumber(prev => prev !== newCurrentPage ? newCurrentPage : prev);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages]);


  useEffect(() => {
    const checkScreenSizeAndSetZoom = () => {
      if (window.innerWidth <= 768) {
        setZoom(0.5);
      } else {
        setZoom(1);
      }
    };

    // Run on mount
    checkScreenSizeAndSetZoom();

    // Listen for resize
    window.addEventListener('resize', checkScreenSizeAndSetZoom);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSizeAndSetZoom);
  }, []);
      const iconSz = isMobile ? 14 : 18;
    const labelSz = isMobile ? '10px' : '12px';


  return (
    <div className='bg-white'>
      {/* <LoadingDialog percentage={loadingPercentage} opendialogloading={loading} msg={`Loading ${numPages} pages...`} /> */}

      <div className="controls bg-white shadow-lg text-dark p-2 shadow-sm">
        <div className="d-flex flex-wrap flex-md-nowrap align-items-center justify-content-between w-100 gap-2">
          {/* Toggle Button */}
          <div className="d-flex align-items-center" style={{ minWidth: '150px' }}>
            <span onClick={toggleAside} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
      
            </span>
          </div>

          {/* Page Input */}
          <div className="d-flex align-items-center" style={{ fontSize: '11px' }}>
            Page
            <input
              type="number"
              value={pageNumber}
              onChange={handlePageInputChange}
              className="mx-2 form-control form-control-sm"
              style={{ width: '50px', padding: '2px 6px', fontSize: '11px' }}
            />
            / {numPages}
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaMagnifyingGlassMinus
              onClick={zoomOut}
              style={{ fontSize: '18px', color: '#2757aa', cursor: 'pointer' }}
            />

            <Slider
              size="small"
              value={zoom * 100} // controlled by zoom state (e.g., 1 = 100%)
              onChange={(_, newValue) => setZoom(newValue / 100)} // convert back to scale
              min={25}
              max={151}
              aria-label="Zoom"
              sx={{ width: 120 }}
            />

            <FaMagnifyingGlassPlus
              onClick={zoomIn}
              className="mx-2"
              style={{ fontSize: '18px', color: '#2757aa', cursor: 'pointer' }}
            />

            <span
              style={{ minWidth: '40px', textAlign: 'center', fontSize: '12.8px', color: '#333' }}
            >
              {Math.round(zoom * 100)}%
            </span>

            <Tooltip title="Reset Zoom">
              <span>
                <FaRotateRight
                  onClick={resetZoom}
                  className="mx-2"
                  style={{ fontSize: '18px', color: '#2757aa', cursor: 'pointer' }}
                />
              </span>
            </Tooltip>
            {/* <div>
              <Button
                variant="contained"
                className='mx-3'
                startIcon={<FaTimes className="mx-1" />}
                onClick={handleClose}
                sx={{
                  backgroundColor: '#ffda75',
                  fontWeight: 'normal',
                  color: '#30343f',
                  borderColor: '#ffda75',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  fontSize: '12px',
                  borderRadius: '30px', // rounded corners
                  padding: '6px 14px', // adjust padding for size
                  '&:hover': {
                    backgroundColor: '#ffda75', // optional hover color
                    borderColor: '#ffda75',
                  },
                  textTransform: 'none',
                }}
              >
                Close Preview
              </Button>
            </div> */}
          </div>

          {/* Download PDF */}
          {complete && (
            <Tooltip title="Download PDF">
              <Button className="btn btn-sm" onClick={handleDownload}>
                <FaDownload style={{ fontSize: isMobile ? '16px' : '20px', color: '#1C4690' }} />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>


      <div className={`pdf-viewer-container ${!complete ? 'tall' : ''}`} >

        {/* Sidebar Thumbnails */}
        {isAsideOpen && (
          <aside className="pdf-thumbnail-panel scrollbar-custom1" ref={containerRef}>
            <div className="thumbnail-scroll-container">
              <Document className="pdf-container" file={document}>
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
        <main className="pdf-main-viewer scrollbar-custom" ref={mainContainerRef}>

          <Document
            className="pdf-container"
            file={document}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div>Loading PDF...</div>}
            error={<div>Error loading PDF!</div>}
          >
            {[...Array(numPages).keys()].map((pageIndex) => (
              <div
                key={`page_${pageIndex + 1}`}
                id={`page_${pageIndex + 1}`}
                className="pdf-page-wrapper"

              >
                <Page
                  pageNumber={pageIndex + 1}

                  scale={getScaleForPage(pageIndex + 1) * zoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="page-container shadow-sm"
                  onLoadSuccess={onPageLoadSuccess}
                />

              </div>
            ))}


          </Document>
        </main>
      </div>
    </div>
  );
};

export default PDFViewerPreview;
