import * as React from 'react';
import { FaPlus, FaComments, FaTimes } from 'react-icons/fa';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AlignItemsList from '../Comments';

const CommentsDialog = (props) => {
  const [localText, setLocalText] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const handleClose = () => {
    props.setOpenDialogComments(false);
  };

  const handleSubmit = () => {
    if (!localText.trim()) return;
    props.addComment(localText, props.signerguid);
    setLocalText('');
    setTouched(false);
  };

  const isEmpty = !localText.trim();

  return (
    <Dialog
      open={props.opendialogcomments}
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: { xs: '95%', sm: 600 },
          maxWidth: 700,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: '#2757aa',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.2,
          px: 2,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaComments />
          <span>Comments</span>
        </div>

        <IconButton onClick={handleClose} size="small" sx={{ color: '#fff' }}>
          <FaTimes size={14} />
        </IconButton>
      </DialogTitle>

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

        {/* Messenger Input Area */}
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
          <textarea
            id="textarea"
            rows={2}
            className="form-control"
            placeholder="Write your comment here..."
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {touched && isEmpty ? (
              <small style={{ fontSize: '11px', color: '#e57373' }}>
                Comment cannot be empty.
              </small>
            ) : (
              <span />
            )}

            <Button
              variant="contained"
              disabled={isEmpty}
              onClick={handleSubmit}
              sx={{
                minWidth: '42px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                p: 0,
                backgroundColor: '#2757aa',
                boxShadow: 'none',
                marginLeft: 'auto',
                '&:hover': { backgroundColor: '#1d4f9c', boxShadow: 'none' },
                '&.Mui-disabled': { backgroundColor: '#b0bec5', color: '#fff' },
              }}
            >
              <FaPlus size={14} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;