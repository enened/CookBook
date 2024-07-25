import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useContext,  useEffect } from 'react';
import { Context } from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";
import Ingredient from './ingredient.js';
import Instructions from './instructions.js';
import DraggableList from "react-draggable-list";

function RecipeForm(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    let currentUrl = useLocation().pathname;
    const { recipeId } = useParams();
    const {user, setUser} = useContext(Context);
    const [recipeLink, setRecipeLink] = useState("")
    const [name, setName] = useState("")
    const [notes, setNotes] = useState("")
    const [duration, setDuration] = useState()
    const [cuisine, setCuisine] = useState("")
    const [ingredients, setIngredients] = useState([])
    const [instructions, setInstructions] = useState([])
    const [deletedInstructions, setDeletedInstructions] = useState([])
    const [deletedIngredients, setDeletedIngredients] = useState([])
    const [scrappingLoading, setScrappingLoading] = useState(false)
    const [scrappingError, setScrappingError] = useState()
    const [generatedRecipeQuery, setGeneratedRecipeQuery] = useState("")
    const [generationLoading, setGenerationLoading] = useState(false)

    const getNoParamURL = ()=>{
        for (let i = 1; i < currentUrl.length; i++) {
            if (currentUrl[i] == "/"){
                return currentUrl.slice(0, i)
            }
        }
        return currentUrl
    }

    const getRecipeInfo = ()=>{
        Axios.post("http://localhost:30015/getRecipeInfo", {userId: user.userId, recipeId: recipeId}).then((response)=>{
            if (response.data == "Recipe not found"){
                alert("Recipe not found")
                navigate("/myRecipes")
            }
            else if (response.data.recipeInfo.userId != user.userId){
                alert("You don't have access to this recipe.");
                navigate("/myRecipes")
            }
            else{
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
                console.log(response)
                if (!response){
                    navigate("/")
                }
                else{
                    if (getNoParamURL() == "/editRecipe"){
                        getRecipeInfo()
                    }
                }
            })  
        }
        else{
            if (getNoParamURL() == "/editRecipe"){
                getRecipeInfo()
            }
        }
    }, [])

    const editRecipe = ()=>{
        if(!ingredients.length){
            alert("Please add ingredients")
        }
        else if(!instructions.length){
            alert("Please add instructions")
        }
        else{
            Axios.post("http://localhost:30015/editRecipe", {name: name, notes: notes, duration: duration, cuisine: cuisine, ingredients: ingredients, instructions: instructions, deletedInstructions: deletedInstructions, deletedIngredients: deletedIngredients, userId: user.userId, recipeId}).then((response)=>{
                if (response.data == "Unauthorized access"){
                    alert("You don't have access to this recipe.");
                    navigate("/home")
                }
                else if (response.data == "Recipe not found"){
                    alert("Recipe not found")
                    navigate("/home")
                }
                else{
                    navigate("/viewRecipe/" + recipeId)
                }
            })
        }
    }

    const createRecipe = ()=>{
        if(!ingredients.length){
            alert("Please add ingredients")
        }
        else if(!instructions.length){
            alert("Please add instructions")
        }
        else{
            Axios.post("http://localhost:30015/createRecipe", {name: name, notes: notes,  duration: duration, cuisine: cuisine, ingredients: ingredients, instructions: instructions, userId: user.userId}).then((response)=>{
                alert("Successfully created recipe!")
                navigate("/myRecipes")
            })
        }
    }

    const addIngredient = ()=>{
        setIngredients((ingredients)=>{
            let tempIngredients = [...ingredients]
            tempIngredients.push({ingredientName: "", amount: null, unit: "", notes: ""})
            return tempIngredients;
        })
    }

    const addStep = ()=>{
        setInstructions((instructions)=>{
            let tempInstructions = [...instructions]
            tempInstructions.push({instruction: "", notes: "", step: tempInstructions.length + 1})
            return tempInstructions;
        })
    }

    const updateInstructionPosition = (newList)=>{

        for (let i = 0; i < newList.length; i++) {
            newList[i].step = i + 1; 
        }

        setInstructions(newList)
    }

    const scrapeWebsite = (e)=>{
        e.preventDefault();
        setScrappingError()
        setScrappingLoading(true);
        Axios.post("http://localhost:30015/scrapeWebsite", {recipeLink: recipeLink}).then((response)=>{
            setScrappingLoading(false);
            if (response.data.recipe.error){
                setScrappingError(response.data.recipe.error)
            }
            else{
                setName(response.data.recipe.name);
                setNotes(response.data.recipe.notes);
                setDuration(response.data.recipe.duration);
                setCuisine(response.data.recipe.cuisine);
                setIngredients(response.data.recipe.ingredients);
                setInstructions(response.data.recipe.instructions);
            }
        })    
    }

    const generateRecipe = (e)=>{
        e.preventDefault();
        setGenerationLoading(true);
        Axios.post("http://localhost:30015/generateRecipe", {generatedRecipeQuery: generatedRecipeQuery, currRecipe: {name: name, notes: notes, duration: duration, cuisine: cuisine, ingredients: ingredients, instructions: instructions}}).then((response)=>{
            setGenerationLoading(false);
            setName(response.data.recipe.name);
            setNotes(response.data.recipe.notes);
            setDuration(response.data.recipe.duration);
            setCuisine(response.data.recipe.cuisine);
            setIngredients(response.data.recipe.ingredients);
            setInstructions(response.data.recipe.instructions);
        })    
    }

    return(
      <>  

        {getNoParamURL() == "/createRecipe" && 
            <>
                {/* Recipes from websites using input link */}
                <form onSubmit={scrapeWebsite}>
                    <p>Already have a recipe? Paste a link to it to automatically fill out recipe info!</p>
                    <input type = "text" onChange={(e)=>{setRecipeLink(e.target.value)}} maxLength={1000} required placeholder="Recipe link" value={recipeLink}/>
                    <br/>
                    <button type='submit'>Scrape</button>
                    {scrappingLoading && <p>...Loading info from website</p>}
                    {scrappingError && <p>An error occured while gathering info: {scrappingError}</p>}
                    <br/>
                </form>

                <form onSubmit={generateRecipe}>
                    {/* AI to  generate recipe */}
                    <p>Need some help with your recipe? Just fill in any of the recipe fields below (ex. recipe name, ingredients, cuisine, etc) and use AI to automatically generate the rest!</p>
                    <input type = "text" onChange={(e)=>{setGeneratedRecipeQuery(e.target.value.trim())}} maxLength={500} placeholder="Enter any other specific requests (optional)"/>
                    <br/>
                    <button>Generate recipe</button>
                    {generationLoading && <p>...Generating recipe</p>}
                </form>
            </>
        }

        {/* All recipe info */}
        <h2>{name}</h2>
        <form onSubmit={(e)=>{
                e.preventDefault();
                if (getNoParamURL() == "/editRecipe"){
                    editRecipe();
                }
                else if (getNoParamURL() == "/createRecipe"){
                    createRecipe();
                }
            }
        }> 
            {/* Recipe general information */}
            <input type = "text" onChange={(e)=>{setName(e.target.value)}} maxLength={99} required placeholder="Recipe name" value={name}/>
            <br/>
            <input type = "number" onChange={(e)=>{setDuration(e.target.value)}} min={1} required placeholder="Total time (in minutes)" value={duration}/>
            <br/>
            <input type = "text" onChange={(e)=>{setCuisine(e.target.value)}}  maxLength={99} required placeholder="Cuisine" value={cuisine}/>
            <br/>
            <textarea type = "text" onChange={(e)=>{setNotes(e.target.value)}} maxLength={1999} required placeholder="Recipe notes" value={notes}></textarea>
            <br/>

            <div className='bigSlideOutline'>
                {/* Ingredients */}
                <h3>Ingredients: </h3>
                {ingredients.length == 0 && <p className='inform'>No ingredients added</p>}
                {ingredients.map((val, index)=>{
                    return(
                        <Ingredient item = {val} index = {index} setIngredients = {setIngredients} setDeletedIngredients = {setDeletedIngredients} viewOnly = {false}/>
                    )
                })}
                <button type = "button" onClick={addIngredient}>Add ingredient</button>
            </div>

            <div className='bigSlideOutline'>

                {/* Instruction/steps */}
                <h3>Instructions: </h3>
                
                {instructions.length == 0 && <p className='inform'>No instructions added</p>}

                <DraggableList
                    itemKey= {(o) => {return o.step}}
                    template={Instructions}
                    list={instructions}
                    onMoveEnd={updateInstructionPosition}
                    container={()=>document.body}
                    commonProps={{setInstructions: setInstructions, setDeletedInstructions: setDeletedInstructions, viewOnly: false}}
                /> 

                <button type = "button" onClick={addStep}>Add step</button>
            </div>

            <br/>
            <button type = "submit">Save</button>
        </form>
      </>
    )
}

export default RecipeForm;