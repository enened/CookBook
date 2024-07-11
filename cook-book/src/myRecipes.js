import {useNavigate} from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import {Context} from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";
import RecipeSlide from './recipeSlide.js';
import FilterSlide from './filterSlide.js';

function MyRecipes(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    const {user, setUser, recipes, setRecipes} = useContext(Context);
    const [currentRecipes, setCurrentRecipes] = useState([])
    
    useEffect(()=>{
        if (!user.userId){
            checkLoggedIn(setUser).then((response)=>{
                if (!response){
                    navigate("/")
                }
                else{
                    Axios.post("http://localhost:30015/getRecipes", {userId: response.userId}).then((response) =>{
                        setRecipes(response.data.recipes);
                        setCurrentRecipes(response.data.recipes);
                    })
                }
            })  
        }
        else{
            Axios.post("http://localhost:30015/getRecipes", {userId: user.userId}).then((response) =>{
                setRecipes(response.data.recipes);
                setCurrentRecipes(response.data.recipes);
            })
        }
    }, [])


    useEffect(()=>{
        for (let x = currentRecipes.length - 1; x > -1; x--) {
            for (let i = 0; i < recipes.length; i++) {
                if(currentRecipes[x].recipeId == recipes[i].recipeId){
                    break
                }
                else if(x == 0){
                    let tempRecipes = [...currentRecipes]
                    tempRecipes.splice(x, 1)
                    setCurrentRecipes(tempRecipes)
                }
            }
        }

    }, [recipes])

    return(
      <>  
        <h2>Your recipes:</h2>
        <FilterSlide setCurrentRecipes = {setCurrentRecipes} allRecipes={recipes}/>

        
        <button onClick={()=>{navigate("/createRecipe")}}>Create recipe</button>
        {currentRecipes.length == 0 && <p>No recipes found</p>}
        
        <div className='flexCenter' style={{"flex-wrap": "wrap"}}>
            {currentRecipes.map((val, index)=>{
                return (
                    <RecipeSlide val={val} setRecipes = {setRecipes} index = {index}/>
                )
            })}
        </div>
      </>
    )
}

export default MyRecipes;