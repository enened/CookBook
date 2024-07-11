import Axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom';
import { Context } from "./context.js";
import {  useContext } from "react";

function Header(){
    let navigate = useNavigate()
    let currentUrl = useLocation().pathname;
    const {setUser, user} = useContext(Context);

    const signout = ()=>{
        setUser({})
        Axios.post("http://localhost:30015/signout").then((response)=>{
            navigate("/")
        })
    }

    return(
        <>
            <div className="header">
                <h1 className='headerH1' onClick={()=>{navigate("/myRecipes")}}>CookbookAI</h1>

                <div>
                    {!user.userId ? (currentUrl == "/" ? <button onClick={()=>{navigate("/signUp")}}>Signup</button> :  <button onClick={()=>{navigate("/")}}>Login</button>)
                    :
                    <>
                        <button style={{"margin":"5px"}} onClick={()=>{navigate("/profile")}}>Profile</button>
                        <button onClick={signout}>Signout</button>
                    </>
                    }

                </div>
            </div>

            {/* Tabs */}
            {(currentUrl == "/myRecipes" || currentUrl == "/search") &&
            <div>
                <button className = {currentUrl == "/myRecipes" ? "activeTab" : 'unactiveTab'} onClick={()=>{navigate("/myRecipes")}}>My recipes</button>
                <button className = {currentUrl == "/search" ? "activeTab" : 'unactiveTab'} onClick={()=>{navigate("/search")}}>Search</button>
            </div>
            }
        </>
    )
}

export default Header;