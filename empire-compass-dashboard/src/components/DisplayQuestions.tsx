import React from 'react'

const DisplayQuestions = (props) => {
  return (
    <div style={{padding: "20px", borderRadius: "16px", boxShadow: "0 0 17px 1px lightgrey", textAlign: "center", margin: "20px auto 20px auto", maxWidth: "90vw"}}>
      <h2> {props.question} </h2>
      {props.children}
    </div>
  )
}

export default DisplayQuestions
