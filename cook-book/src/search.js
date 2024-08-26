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
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)

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

    const getSearchResults = ()=>{
        if (query.trim() != ""){
            setLoading(true)
            Axios.post("http://localhost:30015/getSearchResults", {userId: user.userId, query: query.trim()}).then((response) =>{
                setLoading(false)
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

        <input onChange={(e)=>{setQuery(e.target.value)}} type = "text" className='search' placeholder='Search using recipe names, notes, duration, or ingredients'/>
        <button onClick={getSearchResults}>Search</button>
        <br/>

        <h3>Search results:</h3>
        {loading && <p>Loading...</p>}
        {currentRecipes.length == 0 && !loading && <p>No recipes found</p>}
        
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