import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import logo from '../../images/ZFBLU.webp'
import { ButtonComponent  } from '@syncfusion/ej2-react-buttons';
const pages = ['New User', 'Document Log','Accounts','User Log '];
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function ResponsiveAppBar(props) {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logostyle = {
    width:'180px',
    // height:'55px'
    backgroundColor:'white'
    

  }

  let handleprofile=()=>{
    props.showProfile()
    handleCloseUserMenu()
  }

  return (
    <span className='navdash '>
        <AppBar position="static" style={{backgroundColor:'#ffff'}} className='shadow-lg'>
        <Container maxWidth="xl">
            <Toolbar disableGutters>
            {/* <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} /> */}
            <Typography
                variant="h6"
                noWrap
                component="a"
                href="/"
                sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
                }}
            >
                <a href='/' target="_blank"><img  src={logo} style={logostyle} className='rounded'/></a>
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                // onClick={handleOpenNavMenu}
                color="inherit"
                style={{color:'#174291'}}
                >
                <MenuIcon />
                </IconButton>
                <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                    display: { xs: 'block', md: 'none' },
                }}
                className='text-center'
                >
                     {/* <p style={{fontSize:'12px',margin:'15px'}} ><span style={{color:'#174291'}}>Hello</span><span className='text-dark'>, {props.user.first_name} {props.user.last_name}</span></p> */}
                 
                </Menu>
            </Box>
            {/* <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} /> */}
            <Typography
                variant="h5"
                noWrap
                component="a"
                href=""
                sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
                }}
            >
                <a href='/' target="_blank"><img  src={logo} style={logostyle} className='rounded'/></a>
            </Typography>
            {/* <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                <p style={{fontSize:'12px',margin:'15px'}} ><span style={{color:'#174291'}}>Hello</span><span className='text-dark'>, {props.user.first_name} {props.user.last_name}</span></p>
               
            </Box> */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                
                {/* <Button
            
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                >
                   <span style={{color:'#174291'}}> New User</span>
                </Button>
                <Button
            
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                >
                    <span style={{color:'#174291'}}> User Log</span>
                </Button>
                <Button
            
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                >
                    <span style={{color:'#174291'}}> Accounts</span>
                </Button>
                <Button
                    
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                >
                    <span style={{color:'#174291'}}> User Log </span>
                </Button> */}
         
              
            </Box>
            <Box sx={{ flexGrow: 0 }}>
            {/* <p style={{fontSize:'12px',margin:'15px'}} ><span style={{color:'#174291'}}>Hello</span><span className='text-dark'>, {props.user.first_name} {props.user.last_name}</span></p> */}
            </Box>
            <Box sx={{ flexGrow: 0 }}>
         
                <Tooltip title="open settings">
            
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                        alt={`${props.user.first_name} ${props.user.last_name}`}
                        className='shadow-lg bg-secondary'  
                        src={props.avatar} 
                    />
                </IconButton>
                </Tooltip>
                <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                className='text-center'
                >
                     <p style={{fontSize:'12px',margin:'15px'}} ><span style={{color:'#174291'}}></span><span className='text-dark'> {props.user.first_name} {props.user.last_name}</span></p>
                     <p style={{fontSize:'12px',margin:'15px'}} ><span style={{color:'#174291'}}>  {props.user.email}</span><span className='text-dark'></span></p>
                     {props.user.is_admin == 'True'? 
                        <MenuItem  onClick={props.adminPage}>
                        <Typography textAlign="center"><span style={{fontSize:'14px'}}>Switch to Admin</span></Typography>
                       </MenuItem>
                     :
                     <></>
                     }
                  
                    <MenuItem  onClick={handleprofile}>
                     <Typography textAlign="center"><span style={{fontSize:'14px'}}>Profile</span></Typography>
                    </MenuItem>
                    <MenuItem  onClick={()=>window.open('https://dssauthcorp.techedge.dev/api/reset_password/','_blank')}>
                     <Typography textAlign="center"><span style={{fontSize:'14px'}}>Reset Password</span></Typography>
                    </MenuItem>
                    <MenuItem  onClick={props.logoutUser}>
                     <Typography textAlign="center"><span style={{fontSize:'14px'}}>Logout</span></Typography>
                    </MenuItem>
         
                </Menu>
            </Box>
            </Toolbar>
        </Container>
        </AppBar>
    </span>
    

  );
}
export default ResponsiveAppBar;