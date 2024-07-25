import  Axios  from 'axios';
import DeleteButton from "./deleteButton.png";

function Ingredient({item, index, setIngredients, viewOnly, setDeletedIngredients}){
  Axios.defaults.withCredentials = true;

  const deleteIngredient = async ()=>{
    setIngredients((ingredients)=>{
      let tempIngredients = [...ingredients]
      
      if (item.ingredientId){
        setDeletedIngredients((deletedIngredients)=>{return [...deletedIngredients, item.ingredientId]})
      }
      
      tempIngredients.splice(index, 1)
      
      return tempIngredients
    })

  }

  const getIngredientName = (e)=>{
    setIngredients((ingredients)=>{
      let tempIngredients = [...ingredients]
      tempIngredients[index].ingredientName = e.target.value;
      return tempIngredients
    })  
  }

  const getAmount = (e)=>{
    setIngredients((ingredients)=>{
      let tempIngredients = [...ingredients]
      tempIngredients[index].amount =  e.target.value;
      return tempIngredients
    })
  }

  const getUnit = (e)=>{
    setIngredients((ingredients)=>{
      let tempIngredients = [...ingredients]
      tempIngredients[index].unit =  e.target.value;
      return tempIngredients
    })
  }

  const getNotes = (e)=>{
    setIngredients((ingredients)=>{
      let tempIngredients = [...ingredients]
      tempIngredients[index].notes =  e.target.value;
      return tempIngredients
    })
  }


  if (viewOnly){
    return(
      <tr>
        <td>{item.ingredientName}</td> 
        <td>{item.amount ? item.amount: "N/A"} {item.amount && item.unit}</td> 
        <td>{item.notes ? item.notes : "N/A"}</td> 
      </tr>
    )
  }
  else{
    return(
      <div className={"ingredientSlide"} key={index}>
        <input id = 'ingredientNameInput' type = "text" className='ingredientInput' onChange={getIngredientName} maxLength={499} required placeholder = "Ingredient name" value = {item.ingredientName}/>
        <input type = "number" id = 'ingredientAmountInput' className='ingredientInput' onChange={getAmount} min = {0} step={0.01} placeholder = "Amount" value  = {item.amount}/>
        <input type = "text" id = 'ingredientUnitInput' className='ingredientInput' onChange={getUnit} maxLength={49} placeholder = "Unit" value  = {item.unit}/>
        <textarea id = 'ingredientNotesInput' type = "text" className='ingredientInput' onChange={getNotes} maxLength={999} placeholder = "Notes" value  = {item.notes}/>
        <img onClick = {deleteIngredient} className='deleteButton' src = {DeleteButton} alt ='Remove ingredient button'/>
      </div>
    )
  }

}

export default Ingredient;