import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ReactPaginate from 'react-paginate';

let Pagination = (props) => {


    
  return (
    <div style={{fontSize:"10px"}}>
      <ReactPaginate 
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={props.pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={props.handlePageClick}
        containerClassName={"pagination pagination-sm justify-content-center"}
        pageClassName={"page-item "}
        pageLinkClassName={"page-link"}
        previousClassName={"page-item"}
        previousLinkClassName={"page-link"}
        nextClassName={"page-item"}
        nextLinkClassName={"page-link"}
        breakClassName={"page-item  "}
        breakLinkClassName={"page-link "}
        activeClassName={"active"}
  
      />

    </div>
   
  )
}

export default Pagination