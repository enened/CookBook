import Popup from 'reactjs-popup';
import { useState, useEffect, useContext } from 'react';
import { Context } from "./context.js";

function FilterSlide({setCurrentRecipes, allRecipes}){
    const { user } = useContext(Context);
    const [duration, setDuration] = useState()
    const [cuisine, setCuisine] = useState("")

    const applyFilter = (e)=>{
        if (e){
            e.preventDefault();
        }
        setCurrentRecipes(()=>{
            let tempAllRecipes = [...allRecipes];
            for (let i = tempAllRecipes.length - 1; i >  -1; i--) {
                if((duration && duration > 0 && tempAllRecipes[i].duration > duration) || (cuisine.length > 1 && tempAllRecipes[i].cuisine.toLowerCase().trim() != cuisine.toLowerCase().trim())){
                    tempAllRecipes.splice(i, 1);
                }
            }
            return tempAllRecipes;
        })
    }

    useEffect(()=>{
        applyFilter(null);
    }, [allRecipes])

    return(
        <Popup trigger={<button className='filterButton'>Filter</button>} position={"bottom right"}>
            <form className={user.display == "light" ? "smallSlide" : "smallSlideDark"} onSubmit={applyFilter}>
                <input type="number" onChange={(e)=>{setDuration(e.target.value)}} min={1} step={1} id='duration' placeholder='Max duration (minutes)' defaultValue={duration}/>
                <input type="text" onChange={(e)=>{setCuisine(e.target.value)}} placeholder='Cuisine' defaultValue={cuisine}/>
                <button>Apply filter</button>
            </form>
        </Popup>
    )
}

export default FilterSlide;