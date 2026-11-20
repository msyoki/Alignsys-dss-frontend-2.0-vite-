import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PILL_OUTLINE } from '../common/pillButton';
import {
  Button, CircularProgress, Collapse, FormControl, InputAdornment, InputLabel, MenuItem, Select, Switch, TextField, Tooltip,
} from '@mui/material';
import { FaCheckCircle, FaChevronDown, FaChevronRight, FaExclamationTriangle, FaInfoCircle, FaPaperPlane, FaSave } from 'react-icons/fa';
import AuthContext from '../../context/Authcontext';
import { getOtpConfig, otpError, saveOtpConfig, testOtpConfig } from '../../api/otp';
import { formatDateTime } from '../../utils/datetime';

// Company-admin form for the organisation's own SMS provider.
// The fields come from the backend (GET /api/otp/config/ -> providers), so a new
// provider added on the server shows up here without a frontend change.
// Secrets are write-only: the server returns a masked hint, and leaving a secret
// blank keeps the saved value.

const fieldSx = { mb: 0 };
// Help longer than this goes into an ⓘ tooltip instead of under the field.
const LONG_HELP = 70;
const small = { fontSize: 13 };

export const EXAMPLE_TEMPLATE =
  'Your {company} signing code is {code}. It expires in {minutes} minutes. Do not share this code.';

// Stable string form of the editable settings. Empty values are dropped so that
// typing into a field and clearing it again doesn't count as a change.
const snapshot = (provider, values, template, enabled) => JSON.stringify({
  provider,
  values: Object.keys(values).sort().filter((k) => values[k] !== '' && values[k] != null)
    .map((k) => [k, values[k]]),
  template: (template || '').trim(),
  enabled,
});

const isRequired = (field, values) =>
  field.required && Object.entries(field.required_if || {}).every(([k, v]) => values[k] === v);

const isVisible = (field, values) =>
  // Conditionally-required fields (e.g. bearer token) only show when they apply.
  !field.required_if || Object.keys(field.required_if).length === 0
    || Object.entries(field.required_if).every(([k, v]) => values[k] === v);

export default function SmsProviderSettings({ onSaved }) {
  const { authTokens } = useContext(AuthContext);
  const token = authTokens?.access;
  // The access token is refreshed every few minutes. Keep the latest one in a
  // ref so a refresh doesn't re-run the load and wipe what the admin is typing.
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);
  const loadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [provider, setProvider] = useState('');
  const [values, setValues] = useState({});
  const [template, setTemplate] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testToken, setTestToken] = useState('');
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { severity, text }
  const [busy, setBusy] = useState(''); // '' | 'test' | 'save'
  const [showAdvanced, setShowAdvanced] = useState(false);

  // The pinned alerts change height (banner shown/hidden); expose it as a CSS
  // variable so the pinned Test/Save panel sits just below them.
  const formRef = useRef(null);
  const alertsRef = useRef(null);
  useEffect(() => {
    const el = alertsRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      formRef.current?.style.setProperty('--sms-alerts-h', `${el.offsetHeight}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  });
  const [loadedValues, setLoadedValues] = useState({}); // credentials as loaded, restored when switching back to the saved provider
  const [saved, setSaved] = useState(''); // snapshot of the form as loaded, to detect unsaved changes

  const providers = config?.providers || [];
  const schema = useMemo(() => providers.find((p) => p.key === provider), [providers, provider]);

  const defaultsFor = (p) => Object.fromEntries((p?.fields || []).filter((f) => f.default).map((f) => [f.name, f.default]));

  const load = useCallback(async () => {
    if (!tokenRef.current) return;
    setLoading(true);
    try {
      const data = await getOtpConfig(tokenRef.current);
      setConfig(data);
      setProvider(data.provider || '');
      const p = data.providers.find((x) => x.key === data.provider);
      // Secret fields start blank; the masked hint is shown as helper text.
      const secretNames = new Set((p?.fields || []).filter((f) => f.secret).map((f) => f.name));
      const plain = Object.fromEntries(Object.entries(data.credentials || {}).filter(([k]) => !secretNames.has(k)));
      const loadedValues = { ...defaultsFor(p), ...plain };
      setValues(loadedValues);
      setLoadedValues(loadedValues);
      setTemplate(data.message_template || '');
      setEnabled(!!data.enabled);
      setSaved(snapshot(data.provider || '', loadedValues, data.message_template || '', !!data.enabled));
      setTestToken('');
      setErrors({});
    } catch (err) {
      const e = otpError(err, '');
      const reasons = {
        403: 'Only organisation administrators can manage the SMS provider.',
        404: 'The server does not have the SMS settings feature yet. Contact your service provider.',
        500: 'The server failed to load SMS settings. If this is a new deployment, run the database migrations (python manage.py migrate).',
      };
      const text = e.message || reasons[e.status]
        || (e.status ? `Could not load SMS settings (HTTP ${e.status}).` : 'Could not reach the server to load SMS settings.');
      setBanner({ severity: 'danger', text, retry: true });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once, as soon as we have a token. Later loads happen only after a save
  // or when the admin clicks "Try again".
  useEffect(() => {
    if (token && !loadedRef.current) {
      loadedRef.current = true;
      load();
    }
  }, [token, load]);

  const templateError = template.trim() && !template.includes('{code}')
    ? 'The message must include {code} where the code should appear.'
    : '';

  const changeProvider = (key) => {
    setProvider(key);
    if (!key) setEnabled(false); // no provider: nothing to use
    // Back on the saved provider: bring its saved details back instead of blank defaults.
    setValues(key && key === config?.provider ? loadedValues : defaultsFor(providers.find((p) => p.key === key)));
    setErrors({});
    setTestToken('');
  };

  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
    setTestToken(''); // any change needs a new test before enabling
  };

  const payload = () => ({ provider, credentials: values, message_template: template.trim(), enabled });

  const handleError = (err, fallback) => {
    const e = otpError(err, fallback);
    setErrors(e.data?.fields || {});
    setBanner({ severity: 'danger', text: e.message });
  };

  const testPhoneRef = useRef(null);

  // Required credential fields that are still empty (a saved secret counts as filled).
  const missingRequired = () => {
    const fields = schema?.fields || [];
    const savedSet = new Set(config?.provider === provider ? config?.secrets_set || [] : []);
    return fields.filter((f) => isVisible(f, values) && isRequired(f, values)
      && !(values[f.name] || (f.secret && savedSet.has(f.name))));
  };

  const runTest = async () => {
    const missing = missingRequired();
    if (missing.length) {
      setErrors((x) => ({ ...x, ...Object.fromEntries(missing.map((f) => [f.name, 'Required'])) }));
      setBanner({ severity: 'danger', text: `Fill in ${missing.map((f) => f.label).join(', ')} before sending a test SMS.` });
      return;
    }
    setBusy('test');
    setBanner(null);
    try {
      const data = await testOtpConfig(tokenRef.current, { ...payload(), test_phone: testPhone.trim() });
      setTestToken(data.test_token);
      setBanner({ severity: 'success', text: `${data.message} Check the phone, then save.` });
    } catch (err) {
      handleError(err, 'The test SMS could not be sent.');
    } finally {
      setBusy('');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (templateError) {
      setErrors((x) => ({ ...x, message_template: templateError }));
      setBanner({ severity: 'danger', text: templateError });
      return;
    }
    setBusy('save');
    setBanner(null);
    try {
      const data = await saveOtpConfig(tokenRef.current, { ...payload(), test_token: testToken });
      setConfig(data);
      setTestToken('');
      setBanner({ severity: 'success', text: data.enabled ? 'SMS provider saved and enabled.' : 'SMS settings saved.' });
      if (onSaved) onSaved();
      await load();
    } catch (err) {
      handleError(err, 'Could not save SMS settings.');
    } finally {
      setBusy('');
    }
  };

  // Full-page spinner only for the first load; reloads after saving keep the form on screen.
  if (loading && !config) {
    return <div className="text-center p-5"><CircularProgress size={32} /></div>;
  }

  // Without the server's provider list the form can't be shown, so offer a retry instead.
  if (!config) {
    return (
      <div>
        <div className="alert alert-danger py-2" style={small} role="alert">
          {banner?.text || 'Could not load SMS settings.'}
        </div>
        <Button variant="outlined" onClick={() => { setBanner(null); load(); }} style={{ textTransform: 'none', fontSize: 13 }}>
          Try again
        </Button>
      </div>
    );
  }

  const availability = config?.availability || {};
  const savedSecrets = new Set(config?.provider === provider ? config?.secrets_set || [] : []);
  const savedMasks = config?.provider === provider ? config?.credentials || {} : {};
  // Same rule as the server: enabling needs a passing test unless the provider and its
  // credentials are exactly what was saved and that setup already passed a test.
  const credentialsChanged = snapshot(provider, values, '', false) !== snapshot(config?.provider || '', loadedValues, '', false);
  const needsTest = enabled && !testToken
    && (credentialsChanged || !config?.last_test_ok);
  const hasChanges = snapshot(provider, values, template, enabled) !== saved;
  const saveHint = !hasChanges ? 'No changes to save'
    : needsTest ? 'Send a successful test SMS first, or turn off "Use this provider" to save without enabling it' : '';

  // Rarely used fields (e.g. Custom HTTP extra headers / success check) start
  // folded away; they open by themselves when filled in or in error.
  const advancedFields = (schema?.fields || []).filter((f) => f.advanced && isVisible(f, values));
  const advancedOpen = showAdvanced
    || advancedFields.some((f) => (values[f.name] && values[f.name] !== f.default) || errors[f.name]);

  const renderField = (f) => {
    if (!isVisible(f, values)) return null;
    const required = isRequired(f, values);
    const common = {
      key: f.name,
      fullWidth: true,
      size: 'small',
      sx: { ...fieldSx, gridColumn: f.type === 'textarea' ? '1 / -1' : undefined },
      label: f.label + (required ? ' *' : ''),
      error: !!errors[f.name],
      InputLabelProps: { style: small },
      inputProps: { style: small, autoComplete: f.secret ? 'new-password' : 'off' },
    };
    if (f.type === 'select') {
      return (
        <FormControl key={f.name} fullWidth size="small" sx={fieldSx} error={!!errors[f.name]}>
          <InputLabel style={small}>{f.label}</InputLabel>
          <Select label={f.label} value={values[f.name] || f.default || ''} style={small}
            onChange={(e) => setValue(f.name, e.target.value)}>
            {f.options.map((o) => <MenuItem key={o.value} value={o.value} style={small}>{o.label}</MenuItem>)}
          </Select>
          {(errors[f.name] || (f.help && f.help.length <= LONG_HELP)) && (
            <small className={errors[f.name] ? 'text-danger' : 'text-muted'}>{errors[f.name] || f.help}</small>
          )}
        </FormControl>
      );
    }
    // Errors and short hints stay under the field; long help moves into an ⓘ
    // icon so it doesn't push the form down (hover or tap to read it).
    const longHelp = f.help && f.help.length > LONG_HELP ? f.help : '';
    const helper = errors[f.name]
      || (f.secret && savedSecrets.has(f.name) ? `Saved (${savedMasks[f.name]}). Leave blank to keep it.` : '')
      || (longHelp ? '' : f.help);
    return (
      <TextField
        {...common}
        type={f.secret ? 'password' : 'text'}
        multiline={f.type === 'textarea'}
        minRows={f.type === 'textarea' ? 2 : undefined}
        maxRows={f.type === 'textarea' ? 6 : undefined}
        value={values[f.name] || ''}
        placeholder={f.secret && savedSecrets.has(f.name) ? savedMasks[f.name] : ''}
        onChange={(e) => setValue(f.name, e.target.value)}
        helperText={helper || undefined}
        FormHelperTextProps={{ style: { fontSize: 11 } }}
        InputProps={longHelp ? {
          endAdornment: (
            <InputAdornment position="end" sx={{ alignSelf: f.type === 'textarea' ? 'flex-start' : 'center', mt: f.type === 'textarea' ? 1 : 0 }}>
              <Tooltip title={longHelp} enterTouchDelay={0} leaveTouchDelay={6000} placement="top-end">
                <span aria-label={longHelp} role="img" style={{ display: 'inline-flex', color: '#6b7280', cursor: 'help' }}>
                  <FaInfoCircle size={13} />
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        } : undefined}
      />
    );
  };

  return (
    <form onSubmit={save} autoComplete="off" className="sms-settings" ref={formRef}>
      {/* Status + result messages stay pinned just under the tab headers, so the
          outcome of Test / Save is visible without scrolling back up. */}
      <div className="sms-alerts" aria-live="polite" ref={alertsRef}>
      <div className={`alert py-2 mb-0 ${availability.available ? 'alert-success' : 'alert-warning'}`} style={small}>
        {availability.available ? (
          <><FaCheckCircle className="me-2" />
            {availability.mode === 'platform_twilio'
              ? 'OTP is currently sent through the Alignsys platform account. Configure your own provider below to switch.'
              : 'OTP is enabled and sent through your SMS provider.'}</>
        ) : (
          <><FaExclamationTriangle className="me-2" />
            SMS OTP verification is not available until an SMS provider is configured, tested and enabled.</>
        )}
      </div>

      {banner && (
        <div className={`alert alert-${banner.severity} py-2 mb-0 d-flex align-items-center flex-wrap gap-2`} style={small} role="status">
          <span style={{ flex: 1, minWidth: 200 }}>{banner.text}</span>
          {banner.retry && (
            <Button size="small" variant="outlined" onClick={() => { setBanner(null); load(); }} style={{ textTransform: 'none', fontSize: 12 }}>
              Try again
            </Button>
          )}
        </div>
      )}
      </div>

      <div className="sms-settings-grid">
        {/* Left: provider and its credentials, in as many columns as fit */}
        <section className="sms-settings-main">
          {/* Provider picker and its description share one row on wider screens. */}
          <div className="sms-provider-row">
            <FormControl size="small" className="sms-provider-select">
              <InputLabel style={small}>SMS provider</InputLabel>
              <Select label="SMS provider" value={provider} style={small} onChange={(e) => changeProvider(e.target.value)}>
                <MenuItem value="" style={small}><em>Not configured</em></MenuItem>
                {providers.map((p) => <MenuItem key={p.key} value={p.key} style={small}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
            {schema?.description && <small className="text-muted sms-provider-desc">{schema.description}</small>}
          </div>

          {schema ? (
            <>
              <h3 className="admin-card-title mt-3 mb-2">Connection details</h3>
              <div className="sms-fields">{schema.fields.filter((f) => !f.advanced).map(renderField)}</div>
              {advancedFields.length > 0 && (
                <div className="mt-3">
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAdvanced((v) => !v)}
                    aria-expanded={advancedOpen}
                    startIcon={advancedOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                    style={{ textTransform: 'none', fontSize: 12.5, padding: '2px 6px' }}
                  >
                    Advanced settings ({advancedFields.length}) — optional
                  </Button>
                  <Collapse in={advancedOpen} unmountOnExit>
                    <div className="sms-fields mt-2">{advancedFields.map(renderField)}</div>
                  </Collapse>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted mt-3 mb-0" style={small}>Select your SMS provider to enter its details.</p>
          )}
        </section>

        {/* Right: message, test and save, kept in view while editing credentials */}
        <aside className="sms-settings-side">
          {schema && (
            <>
              <h3 className="admin-card-title">Message</h3>
              <TextField
                fullWidth size="small" multiline minRows={2}
                label="Message text (optional)"
                value={template}
                placeholder={config?.default_message_template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  setErrors((x) => ({ ...x, message_template: undefined }));
                }}
                error={!!(templateError || errors.message_template)}
                helperText={templateError || errors.message_template
                  || 'Optional. Placeholders: {code} (required), {company}, {minutes}. Leave blank to use the default message.'}
                InputLabelProps={{ style: small }} inputProps={{ style: small, maxLength: 320 }}
                FormHelperTextProps={{ style: { fontSize: 11 } }}
              />
              <div className="d-flex flex-wrap align-items-center gap-2 mt-1" style={{ fontSize: 11 }}>
                <span className="text-muted">Example: <code style={{ fontSize: 11 }}>{EXAMPLE_TEMPLATE}</code></span>
                <Button size="small" variant="text" onClick={() => { setTemplate(EXAMPLE_TEMPLATE); setErrors((x) => ({ ...x, message_template: undefined })); }}
                  sx={{ ...PILL_OUTLINE, fontSize: '12px', minHeight: 26, py: 0.25, px: 1.25 }}>
                  Use example
                </Button>
              </div>

              <h3 className="admin-card-title mt-3">Test</h3>
              <div className="d-flex gap-2 align-items-start flex-wrap">
                <TextField
                  size="small" label="Test phone number" placeholder="+254712345678"
                  inputRef={testPhoneRef}
                  value={testPhone} onChange={(e) => setTestPhone(e.target.value)}
                  error={!!errors.test_phone} helperText={errors.test_phone || 'International format, e.g. +254712345678'}
                  InputLabelProps={{ style: small }} inputProps={{ style: small }}
                  FormHelperTextProps={{ style: { fontSize: 11 } }} sx={{ flex: '1 1 200px' }}
                />
                <Button variant="outlined" onClick={runTest} disabled={!!busy || !testPhone.trim()}
                  startIcon={busy === 'test' ? <CircularProgress size={14} /> : <FaPaperPlane />}
                  style={{ textTransform: 'none', fontSize: 13, height: 40, whiteSpace: 'nowrap' }}>
                  Send test SMS
                </Button>
              </div>
              {testToken && <p className="text-success mt-2 mb-0" style={small}><FaCheckCircle className="me-1" />Test passed. You can now enable and save.</p>}
              {config?.last_tested_at && !testToken && config?.provider === provider && (
                <p className="text-muted mt-2 mb-0" style={{ fontSize: 12 }}>
                  Last test: {config.last_test_ok ? 'passed' : 'failed'} on {formatDateTime(config.last_tested_at)}
                </p>
              )}
            </>
          )}

          <div className="sms-settings-actions">
            <div className="d-flex align-items-center gap-2">
              <Switch id="otpProviderEnabled" checked={enabled} disabled={!provider}
                onChange={(e) => setEnabled(e.target.checked)} size="small"
                inputProps={{ 'aria-label': 'Use this provider for signer OTP' }} />
              <label htmlFor="otpProviderEnabled" style={small} className="mb-0">Use this provider for signer OTP</label>
            </div>
            {/* Turning the provider on needs a passing test first: say so here, not only in a tooltip. */}
            {needsTest && hasChanges && (
              <div className="w-100 d-flex align-items-center flex-wrap gap-2" role="status" style={{ fontSize: 12, color: '#8a6100', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '6px 10px' }}>
                <FaExclamationTriangle aria-hidden />
                <span style={{ flex: 1, minWidth: 180 }}>
                  Send a test SMS to confirm these settings before using this provider.
                  To save without enabling it, turn off "Use this provider for signer OTP".
                </span>
                <Button size="small" onClick={() => { testPhoneRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); testPhoneRef.current?.focus(); }}
                  style={{ textTransform: 'none', fontSize: 12, padding: '0 6px', minWidth: 0 }}>
                  Go to test
                </Button>
              </div>
            )}
            <div className="d-flex align-items-center gap-2">
            {hasChanges && !busy && !needsTest && (
              <small className="text-warning" style={{ fontSize: 12 }}>Unsaved changes</small>
            )}
            <Tooltip title={saveHint}>
              <span>
                <Button type="submit" variant="contained" disabled={!!busy || !hasChanges || needsTest}
                  startIcon={busy === 'save' ? <CircularProgress size={14} color="inherit" /> : <FaSave />}
                  style={{ textTransform: 'none', fontSize: 13 }}>
                  Save settings
                </Button>
              </span>
            </Tooltip>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
