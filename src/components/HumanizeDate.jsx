import React from 'react';
import moment from 'moment/moment';

const HumanizedDate = ({ dateStr }) => {
    // const humanizedDate = moment(dateStr).format('DD.MMMM.YYYY : h:mm A');
    // const humanizedDate = moment(dateStr).format('DD/MMMM/YYYY: h:mm A');
    const humanizedDate = moment(dateStr).format('DD/MMM/YYYY :HH:mm');

    
    
  return humanizedDate;
};

export default HumanizedDate;
