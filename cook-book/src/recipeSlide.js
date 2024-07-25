import { useNavigate } from 'react-router-dom';
import DeleteButton from "./deleteButton.png";
import Popup from 'reactjs-popup';
import { useContext, useEffect, useState } from 'react';
import {Context} from "./context.js";

import  Axios  from 'axios';

function RecipeSlide({val, setRecipes, index}){
    let navigate = useNavigate()
    const {user} = useContext(Context);

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
    
    const getFormatedNotes = (notes)=>{
        if (notes.length < 100){
            return notes;
        }
        return notes.slice(0, 100) + "..."
    }

    const deleteRecipe = ()=>{
        Axios.post("http://localhost:30015/deleteRecipe", {userId: user.userId, recipeId: val.recipeId}).then((response)=>{
            if (response.data == "Unauthorized access"){
                alert("You don't have access to edit this recipe.");
            }
            else{
                setRecipes((recipes)=>{
                    let tempRecipes = [...recipes];
                    tempRecipes.splice(index, 1);
                    return tempRecipes;
                })
            }
        })
    }


    return(
        <div className='squareSlide' onClick={()=>{navigate("/viewRecipe/" + val.recipeId)}}>

            <div style={{"width": "100%"}}>
                {user.userId == val.userId && <Popup  trigger={<img style={{"float": "right", "display":"inline"}} className='deleteButton' src = {DeleteButton} alt ='Remove recipe'/>} position={"bottom right"}>
                    {close => (
                        <div className={user.display == "light" ? "smallSlide" : "smallSlideDark"}>
                            <p>Are you sure you want to delete this recipe?</p>
                            <button onClick={close}>No</button>
                            <button onClick={deleteRecipe}>Yes</button>
                        </div>
                    )}
                </Popup>}
                <h3 style={user.userId == val.userId ? {"display":"inline", "position":"relative", "left": "10px" } : {}}>{val.name}</h3>
            </div>
            
            <p>Cuisine: {val.cuisine}</p>
            <p>Total time: {getFormattedDuration(val.duration)}</p>
            <p>{getFormatedNotes(val.notes)}</p>

            
        </div>
    )
}

export default RecipeSlide;