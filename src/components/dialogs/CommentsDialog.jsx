import * as React from 'react';
import { FaComments, FaPaperPlane } from 'react-icons/fa';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AlignItemsList from '../Comments';
import { DialogHeader } from '../common/dialogKit';

const CommentsDialog = (props) => {
  const [localText, setLocalText] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const handleClose = () => {
    props.setOpenDialogComments(false);
  };

  // Comments are posted as one of the document's signers; people who only sent or manage
  // the document (no signer id) can read them but not add one.
  const readOnly = props.canComment === false;

  const handleSubmit = () => {
    if (readOnly || !localText.trim()) return;
    props.addComment(localText, props.signerguid);
    setLocalText('');
    setTouched(false);
  };

  const isEmpty = !localText.trim();

  return (
    <Dialog
      open={props.opendialogcomments}
      onClose={handleClose}
      aria-labelledby="comments-title"
      PaperProps={{
        sx: {
          // Same corner radius as the other dialogs (MUI's default 4px).
          minWidth: { xs: '95%', sm: 600 },
          maxWidth: 700,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogHeader id="comments-title" icon={<FaComments />} title="Comments" subtitle={props.ccdoctitle} onClose={handleClose} />

      <DialogContent
        sx={{
          background: '#f8fafc',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
        }}
      >
        {/* Assignment Description */}
        {props.docoassignmentdescription && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fff',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <small style={{ fontSize: '12px', color: '#2757aa', fontWeight: 600 }}>
              Assignment Description
            </small>
            <div
              style={{
                fontSize: '12px',
                color: '#444',
                marginTop: 4,
                maxHeight: 60,
                overflowY: 'auto',
              }}
            >
              {props.docoassignmentdescription}
            </div>
          </div>
        )}

        {/* Messages Window */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            background: '#f8fafc',
          }}
        >
          {props.comments?.length > 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                padding: 8,
                minHeight: '100%',
              }}
            >
              <AlignItemsList comments={props.comments} />
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.5,
              }}
            >
              <FaComments style={{ color: '#2757aa', fontSize: '40px', marginBottom: 10 }} />
              <span style={{ fontSize: '12px', color: '#2757aa' }}>No Comments</span>
            </div>
          )}
        </div>

        {/* Comment input: text box with the send (comment) button right beside it */}
        <div
          style={{
            padding: 12,
            background: '#fff',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
            <textarea
              id="textarea"
              rows={2}
              className="form-control"
              placeholder={readOnly ? 'Only signers of this document can add comments.' : 'Write your comment here...'}
              aria-label="Comment"
              disabled={readOnly}
              value={localText}
              onChange={(e) => { setLocalText(e.target.value); setTouched(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              style={{
                resize: 'none',
                fontSize: '12.5px',
                background: '#f8fafc',
                borderRadius: 10,
                border: `1px solid ${touched && isEmpty ? '#e57373' : '#dbe3ee'}`,
                padding: 10,
                flex: 1,
              }}
            />
            <Tooltip title="Send comment">
              <span style={{ display: 'flex' }}>
                <IconButton
                  aria-label="Send comment"
                  disabled={isEmpty || readOnly}
                  onClick={handleSubmit}
                  sx={{
                    // Plain icon, no button background: just the paper plane beside the input.
                    width: 44,
                    alignSelf: 'center',
                    borderRadius: '10px',
                    bgcolor: 'transparent',
                    color: '#2757aa',
                    '&:hover': { bgcolor: '#ecf4fc' },
                    '&.Mui-disabled': { color: '#b8c0cc' },
                    '&:focus-visible': { outline: '2px solid #2757aa', outlineOffset: 2 },
                  }}
                >
                  <FaPaperPlane size={20} />
                </IconButton>
              </span>
            </Tooltip>
          </div>

          {touched && isEmpty ? (
            <small style={{ fontSize: '11px', color: '#e57373' }}>Comment cannot be empty.</small>
          ) : (
            <small style={{ fontSize: '11px', color: '#9ca3af' }}>Enter to send · Shift+Enter for a new line</small>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;