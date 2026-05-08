import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import davatar from '../images/default_avatar.png';

export default function AlignItemsList(props) {
  return (
    <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', p: 0 }}>
      {props.comments.map((comment, index) => (
        <React.Fragment key={index}>
          <ListItem alignItems="flex-start" sx={{ py: 1 }}>
            <ListItemAvatar>
              <Avatar
                sx={{ width: 35, height: 35, fontSize: '13px', bgcolor: '#fff' }}
                alt={comment.owner ? comment.owner[0] : 'U'}
                src={davatar}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#1C4690' }}>
                  {comment.owner}
                </Typography>
              }
              secondary={
                <Typography
                  sx={{ display: 'inline', fontSize: '13px', color: '#333' }}
                  component="span"
                  variant="body2"
                >
                  {comment.comment}
                </Typography>
              }
            />
          </ListItem>
          {index < props.comments.length - 1 && (
            <Divider variant="inset" component="li" sx={{ marginLeft: 6 }} />
          )}
        </React.Fragment>
      ))}
    </List>
  );
}