// delete file once everything tested
// import {useNavigate} from 'react-router-dom';
// import { useState, useContext, useEffect } from 'react';
// import {Context} from "./context.js";
// import  Axios  from 'axios';
// import checkLoggedIn from "./checkLoggedIn.js";
// import Popup from 'reactjs-popup';

// function HomePage(){
//     Axios.defaults.withCredentials = true;
//     let navigate = useNavigate()
//     const {user, setUser, recipes, setRecipes} = useContext(Context);
//     const [currentRecipes, setCurrentRecipes] = useState(recipes)

//     useEffect(()=>{
//         if (!user){
//             checkLoggedIn(setUser).then((response)=>{
//                 if (!response){
//                     navigate("/")
//                 }
//                 else{
//                     Axios.post("http://localhost:30015/getRecipes", {userId: user.userId}).then((response) =>{
//                         setRecipes(response.data.recipes)
//                         setCurrentRecipes(response.data.recipes)
//                     })
//                 }
//             })  
//         }
//         else{
//             Axios.post("http://localhost:30015/getRecipes", {userId: user.userId}).then((response) =>{
//                 setRecipes(response.data.recipes)
//                 setCurrentRecipes(response.data.recipes)
//             })
//         }
//     }, [])

//     const getFormattedDuration = (duration)=>{
//         let str = "";
//         if (duration >= 60){
//             str += Math.floor(duration/60) + " hour";
//             if (duration/60 >= 2){
//                 str += "s";
//             }
//             if (duration%60 != 0){
//                 str += " and " + (duration%60) + " minute";
//             }
//             if (duration%60 >= 2){
//                 str += "s";
//             }
//         }
//         else{
//             str += (duration%60) + " minutes";
//         }
//         return str;
//     }  

//     const getSearchResults = (e)=>{
//         if (e.target.value.trim() == ""){
//             setCurrentRecipes(recipes)
//         }
//         else{
//             Axios.post("http://localhost:30015/getSearchResults", {userId: user.userId, query: e.target.value.trim()}).then((response) =>{
//                 console.log(response)
//                 setCurrentRecipes(response.data.recipes)
//             })
//         }
//     }

//     return(
//       <>  
//         <h2>Your recipes:</h2>
//         <Popup trigger={<button className='filterButton'>Sort by</button>}>
//             <div className='smallSlide'>
//                 <h3>Sort by</h3>
//                 <input className='radioInput' type="radio" id='duration' value="duration"/>
//                 <label for="duration">Duration</label>
                
//             </div>
//         </Popup>
        
//         <input onChange={getSearchResults} type = "text" className='search' placeholder='Search using recipe names, notes, duration, or ingredients'/>
//         <br/>
//         <button onClick={()=>{navigate("/createRecipe")}}>Create recipe</button>
//         {recipes.length == 0 && <p className='inform'>No recipes found</p>}
        
//         <div className='flexCenter' style={{"flex-wrap": "wrap"}}>
//             {currentRecipes.map((val, index)=>{
//                 return (
//                     <div className='squareSlide' onClick={()=>{navigate("/viewRecipe/" + val.recipeId)}}>
//                         <h3>{val.name}</h3>
//                         <p>{val.notes}</p>
//                         <p>Total time: {getFormattedDuration(val.duration)}</p>
//                     </div>
//                 )
//             })}
//         </div>
//       </>
//     )
// }

// export default HomePage;