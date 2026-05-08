import React, { useState } from 'react';
import { Button, Modal, Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem ,Input} from '@mui/material';

const FontSelectionModal = ({ open,setFreeTextModal,placeText}) => {
  const [selectedFontFamily, setSelectedFontFamily] = useState('');
  const [fontSize, setFontSizeSelected] = useState('');
  const [myText, setMyText] = useState('');

  const handleFontFamilyChange = (event) => {
    setSelectedFontFamily(event.target.value);
  };

  const handleFontSizeChange = (event) => {
    setFontSizeSelected(event.target.value);
  };

  const handleTextChange=(event)=>{
    setMyText(event.target.value)
  }

  const handleSubmit = () => {
    // Handle form submission here, e.g., apply selected font and font size
    // You can pass these values to your text component or perform any other actions.
    // For now, we'll just log the selected values.
    // console.log('Selected Font Family:', selectedFontFamily);
    // console.log('Selected Font Size:', fontSize);
    placeText(selectedFontFamily,fontSize,myText)
    // Close the modal
    setFreeTextModal(false);
   
  };

  return (
    <Modal open={open}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
        <Typography variant="h6">Font Settings</Typography>
        <InputLabel  style= {{fontSize: '14px'}} className='my-2'>Font Family</InputLabel>
        <FormControl fullWidth >
         
          <Select value={selectedFontFamily} onChange={handleFontFamilyChange}   style= {{fontSize: '14px'}}>
            <MenuItem value="Calibri (Body)">Calibri (Body)</MenuItem>
            <MenuItem value="Arial">Arial</MenuItem>
            <MenuItem value="Times New Roman">Times New Roman</MenuItem>
            <MenuItem value="Courier New">Courier New</MenuItem>
          </Select>
        </FormControl>
        <InputLabel  style= {{fontSize: '14px'}} className='my-2'>Font Size</InputLabel>
        <FormControl fullWidth >
          
          <Select value={fontSize} onChange={handleFontSizeChange}   style= {{fontSize: '14px'}}>\
            <MenuItem value="8">8</MenuItem>
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="12">12</MenuItem>
            <MenuItem value="14">14</MenuItem>
            <MenuItem value="16">16</MenuItem>
            <MenuItem value="18">18</MenuItem>
            <MenuItem value="20">20</MenuItem>
     
          </Select>
        </FormControl>
        <InputLabel style= {{fontSize: '14px'}} className='my-2'>
                Text
            </InputLabel>
        <FormControl fullWidth >
          
            <Input
                onChange={handleTextChange}
                style= {{fontSize: '14px'}}

                type='text'
                placeholder="Type your text here"
            />
                
        </FormControl>

        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
          Apply
        </Button>
      </Box>
    </Modal>
  );
};

export default FontSelectionModal;
