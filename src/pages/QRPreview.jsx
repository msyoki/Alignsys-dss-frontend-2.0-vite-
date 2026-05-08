import React, { useState, useEffect } from 'react'
import { useParams } from "react-router-dom";
import Button from '@mui/material/Button';


import logo from '../images/ZFBLU.webp'
import axios from 'axios'
import * as constants from '../components/constants/constants'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
// import HumanizedDate from '../HumanizeDate';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Typography } from '@mui/material'
import PDFViewerPreviewLoader from '../components/preview/PDFViewerPreviewLoader';

function QRPreview() {
    const { guid } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const [value, setValue] = useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    function CustomTabPanel(props) {
        const { children, value, index, ...other } = props;

        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
            >
                {value === index && (
                    <Box sx={{ p: 0 }}>
                        <Typography>{children}</Typography>
                    </Box>
                )}
            </div>
        );
    }
    function a11yProps(index) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };


    useEffect(() => {

        setSidebarOpen(!isMobile);
    }, [isMobile]);
    return (
        <div style={{ height: '100vh', backgroundColor: '#fff' }} >
            <Box sx={{ width: '100%' }}>
                <Box
                    sx={{
                        borderColor: 'divider',
                        minHeight: '40px',
                        px: 1, // horizontal padding
                        py: 0, // remove vertical padding
                    }}
                    className="bg-white"
                >
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="basic tabs example"
                        variant={isMobile ? "fullWidth" : "standard"}
                        // TabIndicatorProps={{
                        //     sx: {
                        //         height: 2, // thinner indicator
                        //     },
                        // }}
                        // sx={{
                        //     minHeight: '40px',
                        // }}
                    >
                        <Tab
                            label="Signed Document"
                            {...a11yProps(0)}
                            sx={{ minHeight: '40px', py: 0.5, px: 1 ,textTransform: 'none'}}
                        />
                        <Tab
                            label="Summary Report"
                            {...a11yProps(1)}
                            sx={{ minHeight: '40px', py: 0.5, px: 1,textTransform: 'none' }}
                        />
                    </Tabs>
                </Box>

                <CustomTabPanel value={value} index={0}>
                    <PDFViewerPreviewLoader title={"props.filepreviewtitle"} complete={true} height={isMobile ? '70vh' : '85vh'} document={`${guid}.pdf`} />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <PDFViewerPreviewLoader title={`summary_${'props.filepreviewtitle'}`} complete={true} height={isMobile ? '70vh' : '85vh'} document={`${guid}_Report.pdf`} />
                </CustomTabPanel>
            </Box>

        </div>
    )
}

export default QRPreview