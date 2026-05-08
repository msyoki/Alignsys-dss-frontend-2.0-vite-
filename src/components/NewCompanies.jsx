

import React, {useState,useContext} from 'react'
import Authcontext from '../context/Authcontext';
import SweetPagination from "sweetpagination";
import { fontFamily } from '@mui/system';
import { ButtonComponent  } from '@syncfusion/ej2-react-buttons';

import Pagination from './Pagination'

function NewCompanies(props) {
  

    const [currentPageData, setCurrentPageData] = useState([]);


    let approveAccount=(id,email)=>{
        props.setOpenDialogApproveCompany(true)
        props.setCompany4Approval(id)
        props.setCompany4ApprovalEmail(email)
        // alert(`${id} - ${email}`)
    }

    const primaryColor={
        color:'#174291',
     
    }

      // Example items, to simulate fetching from another resources.
    // const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

 


    // Here we use item offsets; we could also use page offsets
    // following the API or data you're working with.
    const itemsperpage= 10
    const [itemOffset, setItemOffset] = useState(0);
    
    // Simulate fetching items from another resources.
    // (This could be items from props; or items loaded in a local state
    // from an API endpoint with useEffect and useState)
    const endOffset = itemOffset + itemsperpage;
    console.log(`Loading items from ${itemOffset} to ${endOffset}`);
    const currentItems = props.newcompanies.slice(itemOffset, endOffset);
  
    const pageCount = Math.ceil(props.newcompanies.length / itemsperpage);
    
    // Invoke when user click to request another page.
    const handlePageClick = (event) => {
        const newOffset = (event.selected * itemsperpage) % props.newcompanies.length;
        console.log(
        `User requested page number ${event.selected}, which is offset ${newOffset}`
        );
        setItemOffset(newOffset);
    }

  return (
    <>
        <table className="table table-sm  text-center table-hover table-responsive card-body" style={{fontSize:'14px'}}>
            
            <thead>
                <tr style={primaryColor} >  
                   
                    <th scope="col" style={{fontWeight:'initial'}}>NAME</th>
                    <th scope="col" style={{fontWeight:'initial'}}>EMAIL</th>
                   
                    {/* <th scope="col" style={{fontWeight:'initial'}}>REGISTERED</th> */}
                    {/* <th scope="col" style={{fontWeight:'initial'}}>APPROVED</th> */}
                    <th scope="col" style={{fontWeight:'initial'}}>ACTION</th>
                </tr>
            </thead>
            <tbody>
            {currentItems.map((c,index)=>(
                <>  
                    {c.is_admin == 'True'?(
                        <>
                        </>
                    ):(
                        <>
                            {c.name == "techedge africa ltd"?(
                                <></>
                            ):(
                                <>
                                    <tr key={index}>
                            
                                        <td scope="col">{c.name} </td>
                                        <td scope="col">{c.email}</td>
                                        {/* <td scope="col"> {c.registered_date}</td>  */}
                                        {/* <td scope="col">{c.approved} </td> */}
                                        <td scope="col">
                                            {/* <button className='btn btn-outline-success btn-sm ' onClick={(e)=>approveAccount(c.id,c.email)}>
                                                <small>Approve</small>
                                            </button>  */}
                                            <ButtonComponent cssClass='e-success e-outline' onClick={(e)=>approveAccount(c.id,c.email)} style={{textTransform: 'none',fontWeight:'lighter',fontSize:'12px'}} className='m-1'  disabled={false}>  Approve</ButtonComponent>
                        
                                        </td>
                                    </tr>
                                </>
                            )}
                     
                        </>
                    )}
                   
                </>
                
            ))}
             
            
            </tbody>


        </table>
  
        <span className='input-group  d-inline-flex justify-content-center' >
        
            <Pagination
                          
                items={props.newcompanies}
                pageCount={pageCount}
                handlePageClick={handlePageClick}
            />

        </span>
        <p className='text-center mb-0' style={{fontSize:'13px'}}>Pages</p>
           
  
    </>
  )
}


export default NewCompanies
