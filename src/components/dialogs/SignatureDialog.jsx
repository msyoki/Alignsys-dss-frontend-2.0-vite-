import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {
    Box, Button, ButtonBase, CircularProgress, Fade, FormControlLabel, Radio, Skeleton, Switch, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { SignatureComponent } from '@syncfusion/ej2-react-inputs';
import { getComponent } from '@syncfusion/ej2-base';
import {
    FaCheck, FaEraser, FaExchangeAlt, FaEye, FaFileUpload, FaMapMarkerAlt, FaPenAlt, FaStamp, FaTrashAlt,
} from 'react-icons/fa';
import axios from 'axios';
import imageCompression from 'browser-image-compression';

import Alerts from '../Alert.jsx';
import * as constants from '../constants/constants.js';
import SignatureUploadMsgDialog from './SignatureUploadMsgDialog.jsx';
import { ConfirmDialog, DialogHeader, PrimaryButton, SecondaryButton, StatusChip } from '../common/dialogKit';
import { PILL, PILL_OUTLINE } from '../common/pillButton';
import { BRAND } from '../layout/shellTheme';
import { AdminSwitch } from '../admin/AdminTableKit';

/*
 * Choosing what to place (signature or stamp).
 *
 * When it opens it loads the signer's saved items. If one is the default
 * (isDefault: true; the API spells it "isDefaut"), it first offers "Use default"
 * with a preview; "Change" opens the tabs. The tabs start on Saved: a list where
 * a click previews an item and the round dot on the right marks the default
 * (choosing another one sets it via PUT .../SaveSignature/UpdateSignature/{id},
 * or .../SaveStamp/UpdateStamp/{id} for stamps). Draw (signatures only)
 * and Upload work as before, including "Save for later". A new item can't be made
 * the default while saving; that is done afterwards on the Saved tab.
 */

/** True for the signer's default saved item. */
export const isDefaultItem = (s) => Boolean(s && (s.isDefault ?? s.isDefaut ?? s.IsDefault));

// Saved items may come back as raw base64 without the data URI prefix.
const toDataUri = (v) => {
    if (!v) return '';
    return v.startsWith('data:') ? v : `data:image/png;base64,${v}`;
};

// Preview an image in the signature pad at its current size, centred.
// The pad's load() always draws from the top-left corner, so the image is first
// placed in the middle of a transparent, pad-sized canvas. It is only scaled
// down if it is larger than the pad (e.g. narrow phones); never enlarged.
// Preview only: the value placed/saved is still the original image.
const loadCentered = (signature, sigElem, dataUri) => new Promise((resolve) => {
    const padW = sigElem?.clientWidth || 0;
    const padH = sigElem?.clientHeight || 0;
    if (!padW || !padH) { signature.load(dataUri); resolve(); return; }
    const img = new Image();
    img.onload = () => {
        const scale = Math.min(1, padW / img.width, padH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const canvas = document.createElement('canvas');
        canvas.width = padW;
        canvas.height = padH;
        canvas.getContext('2d').drawImage(img, (padW - w) / 2, (padH - h) / 2, w, h);
        signature.load(canvas.toDataURL('image/png'), padW, padH);
        resolve();
    };
    img.onerror = () => { signature.load(dataUri); resolve(); };
    img.src = dataUri;
});

// The pad only exists on the Draw and Upload tabs, so always look it up safely.
const getPad = () => {
    const el = document.getElementById('signature');
    return { el, pad: el ? getComponent(el, 'signature') : null };
};

const SignaturePad = () => (
    <SignatureComponent
        strokeColor="#03045e"
        maxStrokeWidth={3}
        minStrokeWidth={0.5}
        velocity={0.7}
        id="signature"
        style={{ width: '100%', height: '100%' }}
    />
);

const sectionLabelSx = { fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.4px' };

const SignatureDialog = (props) => {
    const kind = props.isStamp ? 'stamp' : 'signature';
    const Kind = props.isStamp ? 'Stamp' : 'Signature';
    const apiBase = `${constants.devApi2BaseUrl}/api/${props.isStamp ? 'SaveStamp' : 'SaveSignature'}`;
    const rawItems = props.isStamp ? props.signersavedstamps : props.signersavedsignatures;
    const savedItems = Array.isArray(rawItems) ? rawItems : [];

    const [view, setView] = useState('loading'); // loading | default | tabs
    const [tab, setTab] = useState('saved'); // saved | draw | upload
    const [selectedId, setSelectedId] = useState(null);
    const [localDefaultId, setLocalDefaultId] = useState(null); // shown until the reloaded list confirms it
    const [settingDefaultId, setSettingDefaultId] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [addEmail, setAddEmail] = useState(true);
    const [addDateStamp, setAddDateStamp] = useState(true);
    const [addTimeStamp, setAddTimeStamp] = useState(true);
    const [loading, setLoading] = useState(false);

    const [openalert, setOpenAlert] = useState(false);
    const [alertseverity, setAlertSeverity] = useState('info');
    const [alertmsg, setAlertMsg] = useState('');

    const [checked, setChecked] = useState(false); // "Save for later"
    const [signaturetitle, setSignatureTitle] = useState('');
    const [badsignature, setBadSignature] = useState(false);
    const [signatureforsaving, setSignatureForSaving] = useState('');
    const [signatureLoaded, setSignatureLoaded] = useState(false); // an uploaded image is in the pad

    const inputRef = useRef(null);
    // Kinds whose saved list has been loaded at least once while this page is open.
    // Those open instantly from the list we have (refreshed in the background).
    const loadedKinds = useRef({});

    const defaultId = localDefaultId ?? savedItems.find(isDefaultItem)?.id ?? null;
    const defaultItem = savedItems.find((s) => s.id === defaultId) || null;
    // The default always comes first on the Saved tab; the rest keep the API's order.
    const sortedItems = defaultItem ? [defaultItem, ...savedItems.filter((s) => s.id !== defaultId)] : savedItems;
    const selectedItem = savedItems.find((s) => s.id === selectedId) || null;

    const showAlert = (msg, severity = 'info', ms = 3000) => {
        setAlertMsg(msg);
        setAlertSeverity(severity);
        setOpenAlert(true);
        setTimeout(() => setOpenAlert(false), ms);
    };

    // Reload this kind's saved items; resolves with the new list (or null on failure).
    const loadSaved = () => {
        const getter = props.isStamp ? props.getSavedStamps : props.getSavedSignatures;
        return Promise.resolve(getter ? getter() : null)
            .then((data) => (Array.isArray(data) ? data : null))
            .catch(() => null);
    };

    const resetEntry = () => {
        setChecked(false);
        setSignatureTitle('');
        setSignatureLoaded(false);
        setSignatureForSaving('');
    };

    // Every time it opens: start on "Use default" when there is a default,
    // otherwise on the Saved tab. The first time, wait for the saved items
    // (placeholders show meanwhile); after that, open straight away from the list
    // we already have and refresh it in the background.
    useEffect(() => {
        if (!props.opendialogsignature) return undefined;
        let cancelled = false;
        setTab('saved');
        setLocalDefaultId(null);
        resetEntry();
        props.setSigningPadDisabled?.(true);

        const startFrom = (list) => {
            const def = list.find(isDefaultItem);
            setSelectedId(def?.id ?? list[0]?.id ?? null);
            setView(def ? 'default' : 'tabs');
        };

        if (loadedKinds.current[kind]) {
            startFrom(savedItems);
            loadSaved();
        } else {
            setView('loading');
            loadSaved().then((data) => {
                if (data) loadedKinds.current[kind] = true;
                if (!cancelled) startFrom(data || savedItems);
            });
        }
        return () => { cancelled = true; };
    }, [props.opendialogsignature, props.isStamp]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = () => {
        resetEntry();
        props.setOpenDialogSignature(false);
    };

    const goToTab = (next) => {
        setTab(next);
        resetEntry();
        props.setTempSignature('');
        props.setSigningPadDisabled?.(next !== 'draw');
    };

    const openTabs = () => {
        setSelectedId(defaultId ?? savedItems[0]?.id ?? null);
        setView('tabs');
        goToTab('saved');
    };

    // Placed size of an image (same 250px-wide rule as before), for saved items.
    const prepareSize = (dataUri) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const width = 250;
            const height = width / (img.width / img.height);
            props.setUploadedHeight(height / 2);
            props.setUploadedWidth(width / 2);
            props.setSignatureWidth(width / 2);
            props.setSignatureHeight(height / 2);
            resolve();
        };
        img.onerror = () => resolve();
        img.src = dataUri;
    });

    /**
     * Add the stamps (email, date & time) to the image, put it on the page and close.
     * source: "drawn" | "upload" (as before). save: also store it under the title.
     */
    const placeImage = async (dataUri, source, { save = false } = {}) => {
        if (save && !signaturetitle.trim()) {
            showAlert(`Please give the ${kind} a title to save it`, 'error');
            return;
        }
        const annotate = addTimeStamp || addDateStamp || addEmail;
        props.setHasAnnotations(true);
        setLoading(true);
        try {
            const response = await axios.post(`${constants.devApiBaseUrl}/api/annotate/`, {
                signature: `${dataUri}`,
                email: `${props.signeremail}`,
                signerGuid: `${props.signerguid}`,
                signerEmail: addEmail,
                signTimestamp: addTimeStamp,
                date: addDateStamp,
                annotate: props.isStamp ? false : annotate,
            }, { headers: { 'Content-Type': 'application/json' } });

            if (!response.data?.signature) {
                showAlert(`Could not place the ${kind}. Please try again.`, 'error');
                return;
            }
            props.setTempSignature(response.data.signature);
            if (source === 'drawn') props.setSaveSignature(dataUri);
            props.pdskPlaceSignature(response.data.signature, source, annotate);
            props.setAddSignature(true);

            if (save) {
                axios.post(`${apiBase}/Create`, { email: props.signeremail, signature: dataUri, titile: signaturetitle.trim() },
                    { headers: { 'Content-Type': 'application/json' } }).catch(console.log);
            }

            resetEntry();
            props.setOpenDialogSignature(false);
            if (props.clickedSignatureBox && !props.isStamp) props.setOpenDialogSignBoxes(true);
        } catch (err) {
            console.error(`Placing the ${kind} failed:`, err);
            showAlert(`Could not place the ${kind}. Please try again.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const placeSaved = async (item) => {
        if (!item) return;
        const uri = toDataUri(item.signature);
        props.setTempSignature(uri);
        await prepareSize(uri);
        await placeImage(uri, 'upload');
    };

    const placeDrawn = () => {
        const { pad } = getPad();
        if (!pad || pad.isEmpty?.()) {
            showAlert('Draw your signature in the box first', 'error');
            return;
        }
        placeImage(pad.signatureValue, 'drawn', { save: checked });
    };

    const placeUploaded = () => placeImage(signatureforsaving, 'upload', { save: checked });

    // Tick on the Saved tab: make this item the default (it can't be unticked;
    // ticking another one moves the default).
    const makeDefault = async (item) => {
        if (!item || item.id === defaultId || settingDefaultId) return;
        // Select it too, so the highlight and preview follow it to the top of the list.
        setSelectedId(item.id);
        setSettingDefaultId(item.id);
        try {
            // PUT .../SaveSignature/UpdateSignature/{id} or .../SaveStamp/UpdateStamp/{id}
            const action = props.isStamp ? 'UpdateStamp' : 'UpdateSignature';
            await axios.put(`${apiBase}/${action}/${encodeURIComponent(item.id)}`, null, { headers: { accept: '*/*' } });
            setLocalDefaultId(item.id);
            showAlert(`"${item.title || Kind}" is now your default ${kind}`, 'success');
            const data = await loadSaved();
            if (data && data.some((s) => s.id === item.id && isDefaultItem(s))) setLocalDefaultId(null);
        } catch (err) {
            console.error('Setting the default failed:', err);
            showAlert(`Could not make it your default ${kind}. Please try again.`, 'error');
        } finally {
            setSettingDefaultId(null);
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await axios.post(`${apiBase}/DeleteSignature`, { id: toDelete.id },
                { headers: { Accept: '*/*', 'Content-Type': 'application/json' } });
            showAlert(`${Kind} deleted`, 'success');
            if (localDefaultId === toDelete.id) setLocalDefaultId(null);
            const data = await loadSaved();
            if (selectedId === toDelete.id) {
                const list = data || [];
                setSelectedId(list.find(isDefaultItem)?.id ?? list[0]?.id ?? null);
            }
        } catch (err) {
            console.error('Deleting failed:', err.response ? err.response.data : err.message);
            showAlert(`Could not delete the ${kind}. Please try again.`, 'error');
        } finally {
            setDeleting(false);
            setToDelete(null);
        }
    };

    // ── Upload ─────────────────────────────────────────────────────────────
    const uploadsignature = async (file) => {
        const { el, pad } = getPad();
        if (!pad) return;

        const compressImage = async (f) => {
            try {
                return await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 500, useWebWorker: true });
            } catch (error) {
                console.error('Error compressing image:', error);
                return f;
            }
        };
        const convertBase64 = (f) => new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(f);
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = reject;
        });
        const resizeImage = (base64String) => new Promise((resolve) => {
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const width = 250;
                const height = width / (img.width / img.height);
                canvas.width = width;
                canvas.height = height;
                props.setUploadedHeight(height / 2);
                props.setUploadedWidth(width / 2);
                props.setSignatureWidth(width / 2);
                props.setSignatureHeight(height / 2);
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };
        });

        const compressedFile = await compressImage(file);
        const base64 = await convertBase64(compressedFile);
        const resizedBase64 = await resizeImage(base64);
        await loadCentered(pad, el, resizedBase64);
        setSignatureForSaving(base64);
        props.setTempSignature(base64);
        setSignatureLoaded(true);
    };

    const handleUploadChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        const image = new Image();
        image.src = URL.createObjectURL(selectedFile);
        image.onload = () => {
            if (image.width < 200 || image.height < 200) {
                setBadSignature(true);
            } else {
                uploadsignature(selectedFile);
            }
            if (inputRef.current) inputRef.current.value = '';
        };
    };

    const clearPad = () => {
        props.setSigningPadDisabled?.(tab !== 'draw');
        const { pad } = getPad();
        if (pad && !pad.disabled && !pad.isReadOnly) pad.clear();
        props.setTempSignature('');
        setSignatureLoaded(false);
        setSignatureForSaving('');
    };

    // ── Pieces ─────────────────────────────────────────────────────────────
    const savedImage = (item, alt) => (
        <Box component="img" src={toDataUri(item.signature)} alt={alt}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
    );

    // Email and date/time stamps added to signatures (not stamps).
    const stampOptions = props.isStamp ? null : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2 }}>
            <Typography component="span" sx={{ fontSize: 12.5, color: '#4b5563', mr: 0.5 }}>Add to the signature:</Typography>
            <FormControlLabel
                sx={{ mr: 0, ml: 0, gap: 1, minHeight: 36 }}
                control={<AdminSwitch checked={addEmail} onChange={(e) => setAddEmail(e.target.checked)} />}
                label={<span style={{ fontSize: 12.5 }}>Email</span>}
            />
            <FormControlLabel
                sx={{ mr: 0, ml: 0, gap: 1, minHeight: 36 }}
                control={<AdminSwitch checked={addTimeStamp} onChange={(e) => { setAddTimeStamp(e.target.checked); setAddDateStamp(e.target.checked); }} />}
                label={<span style={{ fontSize: 12.5 }}>Date &amp; time</span>}
            />
        </Box>
    );

    const placingOn = props.clickedSignatureBox
        ? 'Assigned areas'
        : props.multipage ? 'All pages' : 'Current page';

    const headerIcon = props.isStamp ? <FaStamp /> : <FaPenAlt />;

    // ── Views ──────────────────────────────────────────────────────────────
    // Placeholders in the shape of the "Use default" view while the saved items load.
    const renderLoading = () => (
        <DialogContent
            role="status"
            aria-busy="true"
            sx={{ px: { xs: 2, sm: 3 }, pt: '20px !important', pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="text" width={70} sx={{ fontSize: 13 }} />
                <Skeleton variant="rounded" width={96} height={22} sx={{ borderRadius: 999 }} />
            </Box>
            <Box sx={{
                display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2,
                p: 2, border: '1px solid #e5e7eb', borderRadius: '12px', bgcolor: '#fafbfc',
            }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Skeleton variant="text" width="55%" sx={{ fontSize: 12 }} />
                    <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999 }} />
                    <Skeleton variant="text" width="40%" sx={{ fontSize: 12 }} />
                </Box>
                <Skeleton variant="rounded" sx={{ width: { xs: '100%', sm: 200 }, height: 112, borderRadius: '10px', flexShrink: 0 }} />
            </Box>
            <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#5b6170' }}>
                <CircularProgress size={14} sx={{ color: BRAND.primary }} />
                <Typography component="span" sx={{ fontSize: 12.5 }}>Loading your saved {kind}s…</Typography>
            </Box>
        </DialogContent>
    );

    const renderDefault = () => (
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: '20px !important', pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography component="div" sx={{ fontSize: 13, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 1 }}>
                Placing on <StatusChip tone="info">{placingOn}</StatusChip>
            </Typography>

            <Box sx={{
                display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2,
                p: 2, border: '1px solid #cddcf3', borderRadius: '12px', bgcolor: '#f7faff',
            }}>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Typography component="span" sx={sectionLabelSx}>Your default {kind}</Typography>
                    <PrimaryButton onClick={() => placeSaved(defaultItem)} loading={loading} startIcon={<FaCheck />} sx={{ minHeight: 44 }}>
                        Use default {kind}
                    </PrimaryButton>
                    <Typography noWrap title={defaultItem?.title} sx={{ fontSize: 12, color: '#5b6170' }}>{defaultItem?.title}</Typography>
                </Box>
                <Box sx={{
                    width: { xs: '100%', sm: 200 }, height: 112, flexShrink: 0, boxSizing: 'border-box', p: 1,
                    bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {defaultItem && savedImage(defaultItem, `Your default ${kind}`)}
                </Box>
            </Box>

            {stampOptions}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#6D7386', fontSize: 12 }}>
                <Box component="span" sx={{ flex: 1, borderTop: '1px solid #e5e7eb' }} />or
                <Box component="span" sx={{ flex: 1, borderTop: '1px solid #e5e7eb' }} />
            </Box>

            <Button onClick={openTabs} disabled={loading} startIcon={<FaExchangeAlt />} sx={{ ...PILL_OUTLINE, minHeight: 44 }}>
                Change {kind}
            </Button>
            <Typography sx={{ mt: -1, textAlign: 'center', fontSize: 12, color: '#5b6170' }}>
                Pick another saved {kind}{props.isStamp ? ' or upload an image.' : ', draw a new one or upload an image.'}
            </Typography>

            <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />
        </DialogContent>
    );

    const renderEmptySaved = () => (
        <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, textAlign: 'center' }}>
            <Box aria-hidden sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: BRAND.surfaceLight, color: BRAND.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {headerIcon}
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>You do not have any saved {kind}s</Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: '#4b5563', maxWidth: 380 }}>
                {props.isStamp
                    ? 'Upload an image of your stamp. Switch on "Save stamp for later" and it will be listed here next time.'
                    : 'Draw or upload your signature. Switch on "Save signature for later" and it will be listed here next time.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', justifyContent: 'center', mt: 0.75 }}>
                {!props.isStamp && <PrimaryButton onClick={() => goToTab('draw')} startIcon={<FaPenAlt />}>Draw a signature</PrimaryButton>}
                {props.isStamp
                    ? <PrimaryButton onClick={() => goToTab('upload')} startIcon={<FaFileUpload />}>Upload a stamp</PrimaryButton>
                    : <Button onClick={() => goToTab('upload')} startIcon={<FaFileUpload />} sx={PILL_OUTLINE}>Upload a signature</Button>}
            </Box>
        </Box>
    );

    const renderSaved = () => {
        if (savedItems.length === 0) return renderEmptySaved();
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, gap: 2.5 }}>
                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, pl: 0.25 }}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography component="h3" sx={{ m: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                                Saved {kind}s ({savedItems.length})
                            </Typography>
                            <Typography component="span" sx={{ fontSize: 12, color: '#5b6170' }}>
                                Click one to preview it. Choose the circle on the right to make it your default.
                            </Typography>
                        </Box>
                        <Typography component="span" aria-hidden sx={{ width: 64, flexShrink: 0, textAlign: 'center', ...sectionLabelSx, fontSize: 11.5 }}>
                            Default
                        </Typography>
                    </Box>
                    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
                        {sortedItems.map((item) => {
                            const sel = item.id === selectedId;
                            const def = item.id === defaultId;
                            const name = item.title || `Untitled ${kind}`;
                            return (
                                <Box
                                    component="li"
                                    key={item.id}
                                    sx={{
                                        display: 'flex', alignItems: 'stretch', borderRadius: '10px', overflow: 'hidden',
                                        border: sel ? `1.5px solid ${BRAND.primary}` : '1px solid #e5e7eb',
                                        bgcolor: sel ? BRAND.surfaceLight : '#fff',
                                    }}
                                >
                                    {/* Row: click to preview */}
                                    <ButtonBase
                                        onClick={() => setSelectedId(item.id)}
                                        aria-pressed={sel}
                                        sx={{ flex: 1, minWidth: 0, minHeight: 50, justifyContent: 'flex-start', gap: 1.25, py: 1, pl: 1.75, pr: 1, textAlign: 'left' }}
                                    >
                                        <FaEye size={13} color="#6d7386" aria-hidden style={{ flexShrink: 0 }} />
                                        <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 13, color: '#111827' }}>{name}</Typography>
                                    </ButtonBase>

                                    {/* Default: one round dot per row (a radio group), choosing one moves the default */}
                                    <Box sx={{ width: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #eef0f4' }}>
                                        {settingDefaultId === item.id ? (
                                            <CircularProgress size={18} aria-label="Setting the default" />
                                        ) : (
                                            <Tooltip title={def ? `Your default ${kind}` : 'Make default'}>
                                                <span>
                                                    <Radio
                                                        name={`default-${kind}`}
                                                        value={String(item.id)}
                                                        checked={def}
                                                        disabled={Boolean(settingDefaultId)}
                                                        onChange={() => makeDefault(item)}
                                                        inputProps={{ 'aria-label': `Default ${kind}: ${name}` }}
                                                        sx={{ color: '#9aa3b2', '&.Mui-checked': { color: BRAND.primary } }}
                                                    />
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                <Box component="aside" aria-label="Preview" sx={{ p: 2, bgcolor: '#f7faff', border: '1px solid #dbe5f4', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: 1.5, alignSelf: 'start' }}>
                    <Typography component="span" sx={sectionLabelSx}>Preview</Typography>
                    <Box sx={{ height: 150, boxSizing: 'border-box', p: 1, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedItem
                            ? savedImage(selectedItem, `Preview of ${selectedItem.title || kind}`)
                            : <Typography sx={{ fontSize: 12, color: '#5b6170' }}>Click a {kind} to preview it</Typography>}
                    </Box>
                    {selectedItem && (
                        <>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>
                                {selectedItem.title || `Untitled ${kind}`}
                            </Typography>
                            {selectedItem.id === defaultId ? (
                                <Typography sx={{ fontSize: 12, color: '#1e6b30', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <FaCheck size={11} aria-hidden /> Your default {kind}
                                </Typography>
                            ) : (
                                <Typography sx={{ fontSize: 12, color: '#5b6170' }}>
                                    Choose its circle in the list to make it your default.
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        );
    };

    const renderPadTab = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ position: 'relative', height: { xs: 200, sm: 240 }, border: '1.5px dashed #b9c6db', borderRadius: '12px', bgcolor: '#fbfcfe', overflow: 'hidden' }}>
                <SignaturePad />
                {tab === 'upload' && !signatureLoaded && (
                    <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#fbfcfe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2, textAlign: 'center' }}>
                        <Box aria-hidden sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: BRAND.surfaceLight, color: BRAND.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            <FaFileUpload />
                        </Box>
                        <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: '#111827' }}>Upload an image of your {kind}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: '#4b5563' }}>PNG, at least 200 × 200 pixels. A transparent background works best.</Typography>
                        <PrimaryButton onClick={() => inputRef.current?.click()} sx={{ mt: 0.5 }}>Browse from device</PrimaryButton>
                    </Box>
                )}
            </Box>
            {tab === 'draw' && (
                <Typography sx={{ fontSize: 12, color: '#5b6170', mt: -0.5 }}>Sign inside the box with your mouse, finger or pen.</Typography>
            )}
            <input ref={inputRef} type="file" accept="image/png" onChange={handleUploadChange} hidden />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControlLabel
                    sx={{ mr: 0 }}
                    control={<Switch checked={checked} onChange={(e) => { setChecked(e.target.checked); if (!e.target.checked) setSignatureTitle(''); }} />}
                    label={<span style={{ fontSize: 13 }}>Save {kind} for later</span>}
                />
                {checked && (
                    <TextField
                        size="small"
                        value={signaturetitle}
                        onChange={(e) => setSignatureTitle(e.target.value)}
                        placeholder={`Enter ${kind} title here`}
                        autoFocus
                        inputProps={{ 'aria-label': `${Kind} title` }}
                        sx={{ flex: '1 1 220px', '& .MuiInputBase-input': { fontSize: 13 } }}
                    />
                )}
            </Box>
        </Box>
    );

    const renderFooter = () => {
        if (tab === 'saved') {
            return (
                <>
                    {selectedItem && (
                        <Button
                            onClick={() => setToDelete(selectedItem)}
                            disabled={loading}
                            startIcon={<FaTrashAlt size={12} />}
                            sx={{ ...PILL, mr: 'auto !important', color: '#b42318', border: '1px solid #f5c2c0', '&:hover': { bgcolor: '#fdecea', borderColor: '#b42318', boxShadow: 'none' } }}
                        >
                            Delete
                        </Button>
                    )}
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    {savedItems.length > 0 && (
                        <PrimaryButton onClick={() => placeSaved(selectedItem)} disabled={!selectedItem} loading={loading} startIcon={<FaMapMarkerAlt />}>
                            Place selected {kind}
                        </PrimaryButton>
                    )}
                </>
            );
        }
        if (tab === 'draw') {
            return (
                <>
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <Button onClick={clearPad} disabled={loading} startIcon={<FaEraser size={12} />} sx={PILL_OUTLINE}>Clear</Button>
                    <PrimaryButton onClick={placeDrawn} loading={loading} startIcon={<FaMapMarkerAlt />}>Place signature</PrimaryButton>
                </>
            );
        }
        return (
            <>
                <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                {signatureLoaded && (
                    <>
                        <Button onClick={clearPad} disabled={loading} startIcon={<FaEraser size={12} />} sx={PILL_OUTLINE}>Clear</Button>
                        <PrimaryButton onClick={placeUploaded} loading={loading} startIcon={<FaMapMarkerAlt />}>Place {kind}</PrimaryButton>
                    </>
                )}
            </>
        );
    };

    const renderTabs = () => (
        <>
            <Tabs
                value={tab}
                onChange={(e, v) => goToTab(v)}
                aria-label={`${Kind} options`}
                sx={{ px: { xs: 1, sm: 2 }, minHeight: 44, borderBottom: '1px solid #e5e7eb', '& .MuiTab-root': { textTransform: 'none', fontSize: 13, minHeight: 44 } }}
            >
                <Tab value="saved" label="Saved" />
                {!props.isStamp && <Tab value="draw" label="Draw" />}
                <Tab value="upload" label="Upload" />
            </Tabs>

            <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {tab === 'saved' ? renderSaved() : renderPadTab()}
                {stampOptions && (tab !== 'saved' || savedItems.length > 0) && (
                    <Box sx={{ pt: 1.5, borderTop: '1px solid #eef0f4' }}>{stampOptions}</Box>
                )}
                <Alerts alertseverity={alertseverity} alertmsg={alertmsg} openalert={openalert} setOpenAlert={setOpenAlert} />
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1, borderTop: '1px solid #e5e7eb', flexWrap: 'wrap', '& > :not(:first-of-type)': { ml: 0 } }}>
                {renderFooter()}
            </DialogActions>
        </>
    );

    return (
        <>
            <Dialog
                open={!!props.opendialogsignature}
                onClose={loading ? undefined : handleClose}
                fullWidth
                maxWidth={view === 'tabs' ? 'md' : 'sm'}
                aria-labelledby="signature-dialog-title"
            >
                <DialogHeader
                    id="signature-dialog-title"
                    icon={headerIcon}
                    title={view === 'default' ? `Place ${kind}` : `Choose your ${kind}`}
                    onClose={loading ? undefined : handleClose}
                />
                {/* Each view fades in, so loading → content doesn't jump. */}
                <Fade in key={view} timeout={220}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        {view === 'loading' && renderLoading()}
                        {view === 'default' && (defaultItem ? renderDefault() : renderLoading())}
                        {view === 'tabs' && renderTabs()}
                    </Box>
                </Fade>
            </Dialog>

            <SignatureUploadMsgDialog
                signatureWidth={props.uploadedsignaturewidth}
                signatureHeight={props.uploadedsignatureheight}
                badsignature={badsignature}
                setBadSignature={setBadSignature}
            />

            <ConfirmDialog
                open={!!toDelete}
                title={`Delete saved ${kind}`}
                icon={<FaTrashAlt />}
                tone="danger"
                busy={deleting}
                confirmLabel="Delete permanently"
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
                message={`Delete "${toDelete?.title || `this ${kind}`}"? It won't be offered again. Documents you've already signed with it don't change.`}
            >
                {toDelete && (
                    <Box sx={{ mx: 1, height: 90, p: 1, boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {savedImage(toDelete, toDelete.title || kind)}
                    </Box>
                )}
            </ConfirmDialog>
        </>
    );
};

export default SignatureDialog;
