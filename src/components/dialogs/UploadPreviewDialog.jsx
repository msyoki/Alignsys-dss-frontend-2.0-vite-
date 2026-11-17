import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FaEye, FaFileAlt, FaFileWord, FaFileExcel, FaFilePowerpoint, FaTimes } from 'react-icons/fa';
import PDFViewerPreview from '../preview/PDFViewerPreview';
import { PILL } from '../common/pillButton';
import { BRAND, NEUTRAL_COLORS } from '../layout/shellTheme';
import * as constants from '../constants/constants';

const ext = (name = '') => (name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
// Formats Microsoft Office Online can display.
const WORD_EXT = ['doc', 'docx', 'docm', 'dotx', 'dotm'];
const EXCEL_EXT = ['xls', 'xlsx', 'xlsm', 'xlsb'];
const POWERPOINT_EXT = ['ppt', 'pptx', 'pptm', 'pps', 'ppsx', 'potx', 'potm'];
const OFFICE_EXT = [...WORD_EXT, ...EXCEL_EXT, ...POWERPOINT_EXT];

const kindOf = (file) => {
  const e = ext(file?.name);
  if (e === 'pdf' || file?.type === 'application/pdf') return 'pdf';
  if (IMAGE_EXT.includes(e) || /^image\/(png|jpe?g|gif|bmp|webp)$/.test(file?.type || '')) return 'image';
  if (OFFICE_EXT.includes(e)) return 'office';
  if (e === 'csv') return 'csv';
  return 'other';
};
const OfficeIcon = ({ name, ...rest }) => {
  const e = ext(name);
  if (WORD_EXT.includes(e)) return <FaFileWord color="#2b579a" {...rest} />;
  if (EXCEL_EXT.includes(e)) return <FaFileExcel color="#217346" {...rest} />;
  if (POWERPOINT_EXT.includes(e)) return <FaFilePowerpoint color="#b7472a" {...rest} />;
  return <FaFileAlt color={BRAND.primary} {...rest} />;
};

/** Read a PDF File as a data URI the PDF viewer accepts (forces the PDF media type). */
const readPdf = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(`data:application/pdf;base64,${String(reader.result).split(',')[1] || ''}`);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

/** Minimal CSV parser (quoted fields, commas/newlines inside quotes). */
const parseCsv = (text, maxRows = 500) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length && rows.length < maxRows; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; } else if (c === '"') quoted = false; else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
};

/**
 * Same as Alignsys EDMS: put a temporary copy on the public-link service and
 * return its public URL, which Microsoft Office Online can fetch.
 */
const uploadPublicLink = async (file) => {
  const formData = new FormData();
  formData.append('file', file, `file.${ext(file.name)}`);
  const res = await axios.post(`${constants.publicFileUrl}/api/PublicLink`, formData, {
    headers: { Accept: '*/*', 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.file_url || null;
};

/**
 * Preview the files picked on the dashboard before choosing how to proceed.
 *   PDF    -> the app's PDF viewer (read in the browser, nothing uploaded)
 *   image  -> the image itself (read in the browser)
 *   CSV    -> a table (read in the browser)
 *   Office -> Microsoft Office Online: a temporary copy is put on the
 *             public-link service (VITE_PUBLIC_FILE_URL) as soon as the file is
 *             shown, once per file
 *   other (RTF, TIFF) -> a note; preview after conversion
 *
 * files: [{ id, file: File }]
 */
const UploadPreviewDialog = ({ open, onClose, files = [], initialIndex = 0 }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [index, setIndex] = useState(initialIndex);
  const [pdfUri, setPdfUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [csvRows, setCsvRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Office: public URL per file, so each file is uploaded at most once.
  const officeUrls = useRef(new Map());
  const [officeUrl, setOfficeUrl] = useState('');
  const [officeBusy, setOfficeBusy] = useState(false);
  const [officeError, setOfficeError] = useState('');

  useEffect(() => { if (open) setIndex(Math.min(initialIndex, Math.max(0, files.length - 1))); }, [open, initialIndex, files.length]);

  const entry = files[index];
  const current = entry?.file;
  const kind = current ? kindOf(current) : null;
  const officeKey = entry ? entry.id ?? `${current.name}-${current.size}-${current.lastModified}` : null;

  useEffect(() => {
    setPdfUri('');
    setError('');
    setCsvRows(null);
    setOfficeError('');
    setOfficeUrl(officeKey ? officeUrls.current.get(officeKey) || '' : '');
    if (!open || !current) return undefined;
    if (kind === 'image') {
      const url = URL.createObjectURL(current);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl('');
    let cancelled = false;
    if (kind === 'pdf') {
      setLoading(true);
      readPdf(current)
        .then((uri) => { if (!cancelled) setPdfUri(uri); })
        .catch(() => { if (!cancelled) setError('This file could not be read.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else if (kind === 'csv') {
      current.text()
        .then((t) => { if (!cancelled) setCsvRows(parseCsv(t)); })
        .catch(() => { if (!cancelled) setError('This file could not be read.'); });
    }
    return () => { cancelled = true; };
  }, [open, current, kind, officeKey]);

  const showOfficePreview = async () => {
    const key = officeKey;
    const file = current;
    setOfficeBusy(true);
    setOfficeError('');
    try {
      const url = await uploadPublicLink(file);
      if (!url) throw new Error('no url');
      officeUrls.current.set(key, url);
      if (key === officeKeyRef.current) setOfficeUrl(url); // still on this file
    } catch {
      if (key === officeKeyRef.current) setOfficeError('The preview could not be prepared. Check your connection and try again.');
    } finally {
      if (key === officeKeyRef.current) setOfficeBusy(false);
    }
  };

  // Office files load their preview straight away (once per file).
  const officeKeyRef = useRef(officeKey);
  officeKeyRef.current = officeKey;
  useEffect(() => {
    if (!open || kind !== 'office' || !constants.publicFileUrl || !officeKey) return;
    if (officeUrls.current.has(officeKey)) return;
    showOfficePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, officeKey]);

  const viewerHeight = fullScreen ? 'calc(100dvh - 190px)' : '70vh';
  const centered = { height: viewerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={fullScreen} aria-labelledby="upload-preview-title">
      <DialogTitle id="upload-preview-title" sx={{ bgcolor: BRAND.primary, color: '#fff', py: 1, pl: 2, pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <FaEye size={15} aria-hidden />
          <Typography component="span" sx={{ fontSize: 14.5, fontWeight: 600, flexShrink: 0 }}>Preview</Typography>
          {current && (
            <Typography component="span" noWrap title={current.name} sx={{ fontSize: 12.5, opacity: 0.85, minWidth: 0, flex: 1 }}>
              • {current.name}
            </Typography>
          )}
          <IconButton aria-label="Close preview" onClick={onClose} size="small" sx={{ color: '#fff', ml: 'auto' }}>
            <FaTimes size={14} />
          </IconButton>
        </Box>
      </DialogTitle>

      {files.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 2, py: 1.25, borderBottom: `1px solid ${NEUTRAL_COLORS.borderSubtle}` }} role="tablist" aria-label="Uploaded files">
          {files.map((f, i) => (
            <Chip
              key={f.id ?? i}
              role="tab"
              aria-selected={i === index}
              label={`${i + 1}. ${f.file.name}`}
              onClick={() => setIndex(i)}
              size="small"
              variant={i === index ? 'filled' : 'outlined'}
              color={i === index ? 'primary' : 'default'}
              sx={{ maxWidth: 260, fontSize: 12 }}
            />
          ))}
        </Box>
      )}

      <DialogContent sx={{ p: 0, bgcolor: '#f3f5f8', minHeight: 240 }}>
        {error && <Typography sx={{ p: 4, textAlign: 'center', fontSize: 13, color: NEUTRAL_COLORS.body }}>{error}</Typography>}

        {kind === 'pdf' && !error && (
          loading || !pdfUri ? (
            <Box sx={centered}><CircularProgress size={28} /></Box>
          ) : (
            // key: remount the viewer for each file so its pages/zoom start fresh
            <PDFViewerPreview key={officeKey ?? index} document={pdfUri} title={current?.name} complete={false} height={viewerHeight} />
          )
        )}

        {kind === 'image' && imageUrl && (
          <Box sx={{ ...centered, p: 2, boxSizing: 'border-box' }}>
            <img src={imageUrl} alt={current?.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 1px 6px rgba(0,0,0,0.2)', background: '#fff' }} />
          </Box>
        )}

        {kind === 'csv' && !error && (
          !csvRows ? <Box sx={centered}><CircularProgress size={28} /></Box> : (
            <Box sx={{ height: viewerHeight, overflow: 'auto', p: 2, boxSizing: 'border-box' }}>
              <table className="app-csv-table" style={{ borderCollapse: 'collapse', background: '#fff', fontSize: 12.5, minWidth: '100%' }}>
                <tbody>
                  {csvRows.map((r, ri) => (
                    <tr key={ri} style={ri === 0 ? { background: '#fafafa', fontWeight: 600 } : undefined}>
                      {r.map((c, ci) => (
                        <td key={ci} style={{ border: '1px solid #e5e7eb', padding: '4px 8px', whiteSpace: 'nowrap', color: '#4b5563' }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvRows.length >= 500 && (
                <Typography sx={{ fontSize: 12, color: NEUTRAL_COLORS.muted, mt: 1 }}>Showing the first 500 rows.</Typography>
              )}
            </Box>
          )
        )}

        {kind === 'office' && (
          officeUrl ? (
            <iframe
              key={officeUrl}
              title={`Preview of ${current?.name}`}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(officeUrl)}`}
              style={{ width: '100%', height: viewerHeight, border: 'none', display: 'block', background: '#fff' }}
            />
          ) : (
            <Box sx={{ minHeight: { xs: 'auto', sm: 320 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 4, textAlign: 'center' }}>
              <OfficeIcon name={current?.name} size={42} aria-hidden />
              {constants.publicFileUrl ? (
                officeError ? (
                  <>
                    <Typography sx={{ fontSize: 13, color: BRAND.error, maxWidth: 460 }}>{officeError}</Typography>
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={showOfficePreview}
                      startIcon={<FaEye />}
                      sx={{ ...PILL, bgcolor: BRAND.primary, mt: 0.5 }}
                    >
                      Try again
                    </Button>
                  </>
                ) : (
                  <>
                    <CircularProgress size={26} />
                    <Typography sx={{ fontSize: 13, color: NEUTRAL_COLORS.body }}>Preparing preview…</Typography>
                  </>
                )
              ) : (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: NEUTRAL_COLORS.strong }}>Office preview isn&apos;t set up</Typography>
                  <Typography sx={{ fontSize: 13, color: NEUTRAL_COLORS.body, maxWidth: 460 }}>
                    It&apos;s converted to PDF when you continue (sign, send to others or save for later), and you can
                    preview it from then on.
                  </Typography>
                </>
              )}
            </Box>
          )
        )}

        {kind === 'other' && (
          <Box sx={{ minHeight: { xs: 'auto', sm: 320 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 4, textAlign: 'center' }}>
            <FaFileAlt size={40} color={BRAND.primary} aria-hidden />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: NEUTRAL_COLORS.strong }}>
              Preview isn&apos;t available for .{ext(current?.name) || 'this'} files yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: NEUTRAL_COLORS.body, maxWidth: 440 }}>
              It&apos;s converted to PDF when you continue (sign, send to others or save for later), and you can
              preview it from then on.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.25 }}>
        <Button variant="contained" disableElevation onClick={onClose} sx={{ ...PILL, bgcolor: BRAND.primary }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadPreviewDialog;
