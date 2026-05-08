import React, { useRef, useState } from 'react';

import {
  Box,
  Button,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Backdrop,
  TextField
} from '@mui/material';
import { FaTrashAlt, FaChevronDown } from 'react-icons/fa';
import LoadingMini from './loaders/LoadingMini.jsx';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaUpload, FaPlusSquare, FaPenNib, FaEnvelope, FaArchive, FaTimes } from 'react-icons/fa';

function SortableFile({ fileObj, index, deleteFile }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: fileObj.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8f9fa',
    borderRadius: 4,
    padding: '4px 8px',
    marginBottom: 4,
  };

  // Fix: handleDelete should call deleteFile with the file id
  const handleDelete = () => deleteFile(fileObj.id);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Typography sx={{ fontSize: 11.5, color: '#495057' }} {...listeners}>
        <span style={{ color: '#2757aa' }}>{index + 1}.</span> {fileObj.file.name}
      </Typography>
      <IconButton size="small" color="error" onClick={handleDelete}>
        <FaTrashAlt size={16} />
      </IconButton>
    </div>
  );
}

function FileUpload(props) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [loadingmini, setLoadingMini] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allowedExtensions = [
    '.pdf', '.xls', '.xlsx', '.csv', '.doc', '.docx', '.rtf',
    '.pptx', '.pptm', '.potx', '.potm', '.tiff', '.png', '.jpeg', '.jpg',
    '.gif', '.bmp', '.webp'
  ];

  const buttonStyles = {
    'e-custom-primary': {
      variant: 'contained',
      sx: { backgroundColor: '#2757aa', color: '#fff', '&:hover': { backgroundColor: '#1e4a93' } },
    },
    'e-custom-light': {
      variant: 'outlined',
      sx: { backgroundColor: '#fff', color: '#1C4690', borderColor: '#fff', '&:hover': { backgroundColor: '#fff' } },
    },
    'e-custom-warning': {
      variant: 'contained',
      sx: { backgroundColor: '#ffda75', color: '#30343f', '&:hover': { backgroundColor: '#ffd24f' } },
    },
  };

  const validateFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter(file =>
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );
    if (!validFiles.length) {
      alert(
        'Only supported file types are allowed:\nPDF, Word, Excel, PowerPoint, CSV, RTF, and Images.'
      );
      return [];
    }
    return validFiles;
  };

  const handleFiles = (newFiles) => {
    const validFiles = validateFiles(newFiles);
    if (!validFiles.length) return;

    const filesWithId = validFiles.map(f => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}` // stable unique id
    }));

    const updatedFiles = [...props.files, ...filesWithId];
    props.setFiles(updatedFiles);

  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const deleteFile = (id) => {
    const updatedFiles = props.files.filter(f => f.id !== id);
    props.setFiles(updatedFiles);

  };

  const resetForm = () => {
    props.setFiles([]);
    if (props.setTitle) props.setTitle('');
  };

  const onButtonClick = () => inputRef.current && inputRef.current.click();

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = props.files.findIndex(f => f.id === active.id);
      const newIndex = props.files.findIndex(f => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newFiles = arrayMove(props.files, oldIndex, newIndex);
      props.setFiles(newFiles);

    }
  };

  const isMultipleFiles = props.files?.length > 1;
  const isTitleRequired = isMultipleFiles && (!props.title || props.title.trim() === '');

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading Backdrop */}
      {props.loading && (
        <Backdrop
          open={true}
          sx={{
            position: 'absolute',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={50} sx={{ color: '#2757aa' }} />
            <Typography sx={{ color: '#2757aa', fontSize: '14px', fontWeight: 500 }}>
              Processing files...
            </Typography>
          </Box>
        </Backdrop>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={allowedExtensions.join(',')}
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {!props.files?.length ? (
        <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
          <label
            className={dragActive ? "drag-active" : ""}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 20px",
              textAlign: "center",
              border: "2px dashed #d0d0d0",
              borderRadius: "12px",
              cursor: "pointer",
              backgroundColor: dragActive ? "#f8f9fa" : "#ecf4fc",
              transition: "background-color 0.2s ease",
              minHeight: "calc(100vh - 200px)",
              boxSizing: "border-box",
              overflowY: "auto",
              margin: "0",
            }}
            onClick={onButtonClick}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2vh",           // gap scales with screen height
                marginTop: "auto",
                marginBottom: "auto",
                maxWidth: "100%",
              }}
            >
              <FaUpload style={{ fontSize: "36px", color: "#2757aa" }} />

              <p style={{ fontSize: "14px", color: "#333", fontWeight: 600, marginBottom: "30px" }}>
                Upload supported file types
              </p>

              <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>
                PDF, Word, Excel, PowerPoint, CSV, Image, RTF
              </p>

              <Button
                variant="contained"
                startIcon={<FaPlusSquare size={16} />}
                onClick={onButtonClick}
                     sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '999px',
                      px: 1.8,
                      py: 0.8,
                      minHeight: 34,
                      boxShadow: 'none',
                    
                    }}
              >
               
                <span>Select files from device</span>
              </Button>

              <p style={{ fontSize: "13px", color: "#777", marginTop: "2vh" }}>
                or drag and drop files here
              </p>
               <p className="mt-3" style={{ fontSize: 13, color: '#495057' }}>Max File Size Requirement: 20MB</p>
            </div>
          </label>

          {dragActive && (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
            />
          )}
        </form>
      ) : (
        <div className="p-2 bg-white rounded" style={{ border: '1px solid #e0e0e0' }}>
          <h6 className='my-2' style={{ color: '#495057', fontSize: '13px', margin: '4px 0' }}>How would you like to proceed?</h6>

          {/* Title Input for Multiple Files */}
          {isMultipleFiles && (
            <Box sx={{ mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Final Merged File Name"
                placeholder="Enter a name for the final merged document"

                value={props.title || ''}
                onChange={(e) => props.setTitle && props.setTitle(e.target.value)}
                // // required
                // error={isTitleRequired}
                // helperText={isTitleRequired ? 'Title is required for multiple files' : 'Required when merging multiple files'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '13px',
                    backgroundColor: '#fff',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '13px',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '11px',
                  }
                }}
              />
            </Box>
          )}

          <Accordion
            expanded={expanded}
            onChange={() => setExpanded(!expanded)}
            sx={{ mt: 0.5, mb: 1, backgroundColor: '#fff', borderRadius: '6px !important', border: '1px solid #e0e0e0', boxShadow: 'none' }}
          >
            <AccordionSummary
              expandIcon={<FaChevronDown style={{ color: '#495057', fontSize: 13 }} />}
              sx={{
                minHeight: 32,
                py: 0.5,
                '&.Mui-expanded': { minHeight: 32 },
                '& .MuiAccordionSummary-content': {
                  margin: 0,
                  minHeight: 32,
                  '&.Mui-expanded': { margin: 0, minHeight: 32 },
                  alignItems: 'center',
                  gap: 4
                },
              }}
            >
              <Box
                onClick={(e) => { e.stopPropagation(); onButtonClick(); }}
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#2757aa' }}
              >
                <FaPlusSquare size={25} style={{ color: '#2757aa' }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#495057', fontSize: 12 }}>
                <span style={{ color: '#2757aa' }}>Uploaded Files</span> ({props.files?.length})
                {props.files?.length > 1 && (
                  <Typography component="span" sx={{ fontWeight: 400, fontSize: 10, color: '#888', ml: 1 }}>
                    (Merged in order)
                  </Typography>
                )}
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0.5, backgroundColor: '#fff', maxHeight: 140, overflowY: 'auto' }}>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={props.files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {props.files.map((file, index) => (
                    <SortableFile key={file.id} fileObj={file} index={index} deleteFile={deleteFile} />
                  ))}
                </SortableContext>
              </DndContext>
            </AccordionDetails>
          </Accordion>


          {/* Actions */}
          <div className="text-center  mx-2 ">
            <Box className="text-center bg-white py-1 px-2" sx={{ borderRadius: '6px' }}>
              {loadingmini ? <LoadingMini /> : (
                <div className="my-1 d-flex flex-wrap justify-content-center" style={{ gap: 8 }}>
                  {[
                    { label: 'I want to sign myself now', icon: 'fa-pen-nib', css: 'e-custom-primary', onClick: props.selfSign },
                    { label: 'I want to send to others to sign', icon: 'fa-envelope', css: 'e-custom-primary', onClick: props.mailtoSigners },
                    { label: 'I want to save for later', icon: 'fa-archive', css: 'e-custom-light', onClick: props.saveToMyFolder },
                    { label: 'I want to cancel & upload again', icon: 'fa-times', css: 'e-custom-warning', onClick: resetForm },
                  ].map((btn, idx) => {
                    const cfg = buttonStyles[btn.css] || { variant: 'outlined', sx: {} };
                    // const isDisabled = isTitleRequired && btn.onClick !== resetForm && btn.onClick !== undefined;
                    const isDisabled = false
                    return (
                      <Button
                        key={idx}
                        variant={btn.label === 'I want to save for later' ? 'contained' : cfg.variant}
                        onClick={btn.onClick}
                        disabled={isDisabled}
                        sx={{
                          width: 250,
                          textTransform: 'none',
                          fontSize: '10.5px',
                          py: 1.5,
                          borderRadius: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          ...cfg.sx,
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        {btn.icon === 'fa-pen-nib' && <FaPenNib size={15} color={btn.css === 'e-custom-primary' ? '#fff' : btn.css === 'e-custom-warning' ? '#555' : '#2757aa'} />}
                        {btn.icon === 'fa-envelope' && <FaEnvelope size={15} color={btn.css === 'e-custom-primary' ? '#fff' : btn.css === 'e-custom-warning' ? '#555' : '#2757aa'} />}
                        {btn.icon === 'fa-archive' && <FaArchive size={15} color={btn.css === 'e-custom-primary' ? '#fff' : btn.css === 'e-custom-warning' ? '#555' : '#2757aa'} />}
                        {btn.icon === 'fa-times' && <FaTimes size={15} color={btn.css === 'e-custom-primary' ? '#fff' : btn.css === 'e-custom-warning' ? '#555' : '#2757aa'} />}
                        <span style={{ whiteSpace: 'normal', lineHeight: 1.1 }}>{btn.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </Box>
          </div>
        </div>
      )}

     
    </Box>
  );
}

export default FileUpload;