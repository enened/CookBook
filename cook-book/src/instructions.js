import { useState, useEffect } from 'react';
import  Axios  from 'axios';
import DeleteButton from "./deleteButton.png";

function Instructions({item, itemSelected, dragHandleProps, commonProps}){
  Axios.defaults.withCredentials = true;
  const scale = itemSelected * 0.05 + 1;
  const dragged = itemSelected !== 0;

  const deleteStep = async ()=>{
    commonProps.setInstructions((instructions)=>{
      let tempInstructions = [...instructions]

      if (item.instructionId){
        commonProps.setDeletedInstructions((deletedinstructions) => {return [...deletedinstructions, item.instructionId]});
      }

      tempInstructions.splice(item.step - 1, 1)

      for (let i = item.step - 1; i < tempInstructions.length; i++) {
        tempInstructions[i].step -= 1
      }

      return tempInstructions
    })

  }

  const getInstruction = (e)=>{
    commonProps.setInstructions((instructions)=>{
      let tempInstructions = [...instructions]
      tempInstructions[item.step - 1].instruction =  e.target.value;
      return tempInstructions
    })
  }

  const getNotes = (e)=>{
    commonProps.setInstructions((instructions)=>{
      let tempInstructions = [...instructions]
      tempInstructions[item.step - 1].notes =  e.target.value;
      return tempInstructions
    })
  }


  if (commonProps.viewOnly){
    return(
      <tr>
        <td>{item.step}. </td> 
        <td>{item.instruction}</td> 
        <td>{item.notes ? item.notes : "N/A"}</td> 
      </tr>
    )
  }
  else{
    return(
      <>  
        <div
          className={dragged ? 'item' + dragged : 'item'}
          style={{
            width: "100%",
            margin: "auto",
          }}
        >
          <div className = {'instructionSlide'}>
            <div className="dragHandle" {...dragHandleProps} />
            <p>{item.step}. </p>
            <textarea type = "text" className='instructionInput' onChange={getInstruction} maxLength={4999} required placeholder = {`Step ${item.step}`} value = {item.instruction}/>
            <textarea type = "text" className='notesInput' onChange={getNotes} maxLength={1999} placeholder = "Notes" value = {item.notes}/>
            <img onClick = {deleteStep} className='deleteButton' src = {DeleteButton} alt ='Remove step button'/>
          </div>

        </div>


      </>
    )
  }
}

export default Instructions;