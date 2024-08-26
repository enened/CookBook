import { useNavigate, useParams } from 'react-router-dom';
import { useState, useContext,  useEffect} from 'react';
import {Context} from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";
import Ingredient from './ingredient.js';
import Instructions from './instructions.js';

function ViewRecipePage(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    const { recipeId } = useParams();
    const {user, setUser} = useContext(Context);
    const [recipeUserId, setRecipeUserId] = useState()
    const [name, setName] = useState("")
    const [notes, setNotes] = useState("")
    const [duration, setDuration] = useState()
    const [cuisine, setCuisine] = useState("")
    const [ingredients, setIngredients] = useState([])
    const [instructions, setInstructions] = useState([])

    const getRecipeInfo = ()=>{
        Axios.post("http://localhost:30015/getRecipeInfo", {recipeId: recipeId}).then((response)=>{
            if (response.data == "Recipe not found"){
                alert("Recipe not found")
                navigate("/home")
            }
            else{
                setRecipeUserId(response.data.recipeInfo.userId)
                setName(response.data.recipeInfo.name);
                setNotes(response.data.recipeInfo.notes);
                setDuration(response.data.recipeInfo.duration);
                setCuisine(response.data.recipeInfo.cuisine)
                setIngredients(response.data.ingredients);
                setInstructions(response.data.instructions);
            }
        })
    }

    useEffect(()=>{
        if (!user.userId){
            checkLoggedIn(setUser).then((response)=>{
                if (!response){
                    navigate("/")
                }
                else{
                    getRecipeInfo()
                }
            })  
        }
        else{
            getRecipeInfo()
        }
    }, [])

    const getFormattedDuration = (duration)=>{
        let str = "";
        if (duration >= 60){
            str += Math.floor(duration/60) + " hour";
            if (duration/60 >= 2){
                str += "s";
            }
            if (duration%60 != 0){
                str += " and " + (duration%60) + " minute";
            }
            if (duration%60 >= 2){
                str += "s";
            }
        }
        else{
            str += (duration%60) + " minutes";
        }
        return str;
    }

    return(
      <>  
        <h2>{name}</h2>
        <p>Total time: {getFormattedDuration(duration)}</p>
        <p>Cuisine: {cuisine}</p>
        <p>Extra notes: {notes}</p>

        {/* Ingredients */}
        <h3>Ingredients: </h3>
        <table classname = "listTable">
            <tr>
                <th>Ingredient</th>
                <th>Amount</th>
                <th>Notes</th>
            </tr>
            {ingredients.map((val, index)=>{
                return(
                    <Ingredient item = {val} index = {index} setIngredients = {setIngredients} viewOnly = {true}/>
                )
            })}
        </table>


        {/* Instruction/steps */}
        <h3>Instructions: </h3>
        
        <table classname = "listTable">
            <thead>
                <tr>
                    <th>Step</th>
                    <th>Instruction</th>
                    <th>Note</th>
                </tr>
            </thead>

            <tbody>
                {instructions.map((val, index)=>{
                    return(
                        <Instructions item = {val} commonProps = {{setInstructions: setInstructions, viewOnly: true}}/>
                    )
                })}
            </tbody>
        </table>
        
        {user.userId == recipeUserId && <button onClick={()=>{navigate("/editRecipe/" + recipeId)}}>Edit recipe</button>}
      </>
    )
}

export default ViewRecipePage;