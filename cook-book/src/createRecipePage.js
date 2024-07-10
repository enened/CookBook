// delete file once everything tested
// import { useNavigate } from 'react-router-dom';
// import { useState, useContext,  useEffect } from 'react';
// import { Context } from "./context.js";
// import  Axios  from 'axios';
// import checkLoggedIn from "./checkLoggedIn.js";
// import Ingredient from './ingredient.js';
// import Instructions from './instructions.js';
// import DraggableList from "react-draggable-list";

// function CreateRecipePage(){
//     Axios.defaults.withCredentials = true;
//     let navigate = useNavigate()
//     const {user, setUser} = useContext(Context);
//     const [name, setName] = useState("")
//     const [notes, setNotes] = useState("")
//     const [duration, setDuration] = useState()
//     const [cuisine, setCuisine] = useState("")
//     const [ingredients, setIngredients] = useState([{ingredientName: "", amount: null, unit: "", notes: ""}])
//     const [instructions, setInstructions] = useState([{instruction: "", notes: "",  step: 1}])


//     useEffect(()=>{
//         if (!user){
//             checkLoggedIn(setUser).then((response)=>{
//                 if (!response){
//                     navigate("/")
//                 }
//             })  
//         }
//     }, [])

//     const createRecipe = (e)=>{
//         e.preventDefault()
//         if(!ingredients.length){
//             alert("Please add ingredients")
//         }
//         else if(!instructions.length){
//             alert("Please add instructions")
//         }
//         else{
//             Axios.post("http://localhost:30015/createRecipe", {name: name, notes: notes,  duration: duration, cuisine: cuisine, ingredients: ingredients, instructions: instructions, userId: user.userId}).then((response)=>{
//                 alert("Successfully created recipe!")
//                 navigate("/myRecipes")
//             })
//         }
//     }

//     const addIngredient = ()=>{
//         setIngredients((ingredients)=>{
//             let tempIngredients = [...ingredients]
//             tempIngredients.push({ingredientName: "", amount: null, unit: "", notes: ""})
//             return tempIngredients;
//         })
//     }

//     const addStep = ()=>{
//         setInstructions((instructions)=>{
//             let tempInstructions = [...instructions]
//             tempInstructions.push({instruction: "", notes: "", step: tempInstructions.length + 1})
//             return tempInstructions;
//         })
//     }
    
//     const updateInstructionPosition = (newList)=>{
        
//         for (let i = 0; i < newList.length; i++) {
//             newList[i].step = i + 1; 
//         }

//         setInstructions(newList)
//     }



//     return(
//       <>  
//         <h2>Create new recipe</h2>
//         <form onSubmit={createRecipe}> 

//             {/* Recipe general information */}
//             <input type = "text" onChange={(e)=>{setName(e.target.value)}} maxLength={99} required placeholder="Recipe name"/>
//             <br/>
//             <input type = "number" onChange={(e)=>{setDuration(e.target.value)}} required placeholder="Total time (in minutes)"/>
//             <br/>
//             <input type = "text" onChange={(e)=>{setCuisine(e.target.value)}} required placeholder="Cuisine"/>
//             <br/>
//             <textarea type = "text" onChange={(e)=>{setNotes(e.target.value)}} maxLength={1999} placeholder="Recipe notes"></textarea>
//             <br/>

//             <div className='bigSlideOutline'>
//                 {/* Ingredients */}
//                 <h3>Ingredients: </h3>
//                 {ingredients.length == 0 && <p className='inform'>No ingredients added</p>}
//                 {ingredients.map((val, index)=>{
//                     return(
//                         <Ingredient item = {val} index = {index} setIngredients = {setIngredients}/>
//                     )
//                 })}
//                 <button type = "button" onClick={addIngredient}>Add ingredient</button>
//             </div>

//             <div className='bigSlideOutline'>

//                 {/* Instruction/steps */}
//                 <h3>Instructions: </h3>
//                 {instructions.length == 0 && <p className='inform'>No instructions added</p>}
//                 <DraggableList
//                     itemKey= {(o) => {return o.step}}
//                     template={Instructions}
//                     list={instructions}
//                     onMoveEnd={updateInstructionPosition}
//                     container={()=>document.body}
//                     commonProps={{setInstructions: setInstructions, viewOnly: false}}
//                 /> 
//                 <button type = "button" onClick={addStep}>Add step</button>

//             </div>

//             <br/>
//             <button type = "submit">Create</button>
//         </form>
//       </>
//     )
// }

// export default CreateRecipePage;