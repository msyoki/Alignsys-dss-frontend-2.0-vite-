import React from 'react';

const DocExpiryDate = ({expirydate}) => {
    const today = new Date(); // Current date and time

    const ed = expirydate; // Corrected date format
   
    const expiryDate = new Date(ed); // Expiry date

    // Calculate the difference between today's date and the expiry date in milliseconds
    const timeDifference = expiryDate - today;

    // Convert milliseconds to days
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    // Check if today is the expiry date or past the expiry date
    const displayText = daysDifference <= 0 ? 'Expired' : `${daysDifference} day(s) left`;

    return (
        <span>
            {displayText}
        </span>
    );
};

export default DocExpiryDate;
