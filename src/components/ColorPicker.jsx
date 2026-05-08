import React from 'react';
import { Tooltip } from '@mui/material';

const ColorPicker = ({ color, setColor, onColorChange }) => {
    const handleColorChange = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        if (onColorChange) onColorChange(newColor);
    };

    return (
        <Tooltip title="Pick a font color before selecting text">
            <div
                role="button"
                aria-label="Change font color"
                style={{
                    backgroundColor: color,
                    border: "2px solid #ccc",
                    borderRadius: "5px",
                    cursor: "pointer",
                    width: "25px",
                    height: "25px",
                    marginRight: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <input
                    type="color"
                    value={color}
                    onChange={handleColorChange}
                    style={{
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer"
                    }}
                    aria-label="Color picker"
                />
               
            </div>
            
        </Tooltip>
    );
};

export default ColorPicker;
