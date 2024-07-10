import { useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect } from 'react';
import { Context } from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";
import RecipeSlide from './recipeSlide.js';
import FilterSlide from './filterSlide.js';

function Search(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    const {user, setUser} = useContext(Context);
    const [searchResults, setSearchResults] = useState([])
    const [currentRecipes, setCurrentRecipes] = useState([])

    useEffect(()=>{
        if (!user.userId){
            checkLoggedIn(setUser).then((response)=>{
                if (!response){
                    navigate("/")
                }
            })  
        }
    }, [])

    useEffect(()=>{
        for (let x = currentRecipes.length - 1; x > -1; x--) {
            for (let i = 0; i < searchResults.length; i++) {
                if(currentRecipes[x].recipeId == searchResults[i].recipeId){
                    break
                }
                else if(x == 0){
                    let tempRecipes = [...currentRecipes]
                    tempRecipes.splice(x, 1)
                    setCurrentRecipes(tempRecipes)
                }
            }
        }

    }, [searchResults])

    const getSearchResults = (e)=>{
        if (e.target.value.trim() != ""){
            Axios.post("http://localhost:30015/getSearchResults", {userId: user.userId, query: e.target.value.trim()}).then((response) =>{
                setSearchResults(response.data.recipes)
                setCurrentRecipes(response.data.recipes)
            })  
        }
        else{
            setSearchResults([]);
            setCurrentRecipes([])
        }

    }

    return(
      <>  

        <FilterSlide setCurrentRecipes = {setCurrentRecipes} allRecipes={searchResults}/>

        <input onChange={getSearchResults} type = "text" className='search' placeholder='Search using recipe names, notes, duration, or ingredients'/>
        <br/>

        <h3>Search results:</h3>
        {currentRecipes.length == 0 && <p>No recipes found</p>}
        
        <div className='flexCenter' style={{"flex-wrap": "wrap"}}>
            {currentRecipes.map((val)=>{
                return (
                    <RecipeSlide val={val} setRecipes = {setSearchResults}/>
                )
            })}
        </div>
      </>
    )
}

export default Search;