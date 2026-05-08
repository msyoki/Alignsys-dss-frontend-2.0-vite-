import * as React from 'react';
import {useNavigate, Link} from 'react-router-dom'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import {useContext} from 'react'
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import '../../styles/App.css'
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AuthContext from '../../context/Authcontext'
import * as constants from '../constants/constants'

import axios from 'axios'

const ApproveCompanyDialog=(props) =>{
    let {authTokens}=useContext(AuthContext)
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
    const [fullWidth, setFullWidth] = React.useState(true);

    
    //  Toggle passwords
    let togglep1=()=>{
      let input_type=document.getElementById('password1').type;
      if(input_type === 'password'){
        document.getElementById('password1').type='text'
        document.getElementById('togglePassword1').className='fas fa-eye ml-2'
      }
      else{
        document.getElementById('password1').type='password'
        document.getElementById('togglePassword1').className='fas fa-eye-slash ml-2'
      }
    }

    let togglep2=()=>{
      let input_type=document.getElementById('password2').type;
      if(input_type === 'password'){
        document.getElementById('password2').type='text'
        document.getElementById('togglePassword2').className='fas fa-eye ml-2'
      }
      else{
        document.getElementById('password2').type='password'
        document.getElementById('togglePassword2').className='fas fa-eye-slash ml-2'
      }
    }


    



  const handleClose = () => {
    props.setOpenDialogApproveCompany(false);
  };

  let updateCompany=(e)=>{
   
    e.preventDefault()
    handleClose()

    // var FormData = require('form-data');
    // var data = new FormData();
 
    // data.append('approved', 'true')
    var data = '';

    var config = {
        method: 'post',
      maxBodyLength: Infinity,
        url: `${constants.devApiBaseUrl}/api/approve/company/${props.company4approval}`,
        headers: {'Authorization':`Bearer ${authTokens.access}`},
        data : data
      };

    axios(config)
    .then(function (response) {
    props.setOpenAlert(true)
    props.setAlertMsg('company approved successfully !!!')
    props.setAlertSeverity('success')
    setTimeout(
    function() {
        props.setOpenAlert(false)
        props.getCompanies()
        props.getNewCompanies()
        props.getUsers()
        props.setOpenDialogApproveCompany(false);
    }, 2000)

 

    })
    .catch(function (error) {
      props.setOpenAlert(true)
      props.setAlertMsg(`${error.response.data['message']}`)
      props.setAlertSeverity('error')
      setTimeout(
      function() {
          props.setOpenAlert(false);
          props.getCompanies()
          props.getNewCompanies()
          props.getUsers()
          props.setOpenDialogApproveCompany(false);
      }, 4000)
  
    });

    

  }

  
  return (
    <div >
     
      <Dialog
        fullWidth={fullWidth}
   
        fullScreen={fullScreen}
        open={props.opendialogapprovecompany}

        keepMounted
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
        // className='App-header'
      >
        {/* <DialogTitle style={{backgroundColor:'#174291'}} className='shadow-lg text-white'>{"Approve Company"}   
          
        </DialogTitle>
        <br/> */}
        {/* <DialogContent>
          <DialogContentText id="alert-dialog-slide-description" >
           <p className='text-center'> Please confirm you would like to approve company X ?</p>
            <div className='input-group d-inline-flex justify-content-center'>
                <button className='btn btn-danger m-4 p-3'>No</button>
                <button className='btn btn-success m-4 p-3' onClick={approvecompany}>Yes</button>
            </div>
          </DialogContentText>
        </DialogContent> */}
        <DialogTitle id="alert-dialog-title">
          {"Confirm you wish to activate this account ?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Approves new company account {props.company4approval}. A new admin account will also be registered and shared 
            to the company admin via the provided email.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Disagree</Button>
          <Button onClick={updateCompany} autoFocus>
            Agree
          </Button>
        </DialogActions>
    
      </Dialog>
 
    </div>
  );
}


export default  ApproveCompanyDialog