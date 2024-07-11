import {useNavigate} from 'react-router-dom';
import { useState,useContext,  useEffect} from 'react';
import {Context} from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";
import { jwtDecode } from "jwt-decode";

function LoginPage(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    const {user, setUser} = useContext(Context);
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();

    const handleCallbackResponse = (response)=>{
        Axios.post("http://localhost:30015/login", {username: jwtDecode(response.credential).email, googleLogin: true}).then((response2)=>{
            setUser({username: jwtDecode(response.credential).email, ...response2.data.user})
            navigate("/myRecipes")
        })
    }

    useEffect(()=>{
        if (!user.userId){
            checkLoggedIn(setUser).then((response)=>{
                if (response){
                    navigate("/myRecipes")
                }
                else{
                    /* global google */
                    google.accounts.id.initialize({
                        client_id: "166074828687-prontca2mjfsuajnmv7mp6pl6crte0v9.apps.googleusercontent.com",
                        callback: handleCallbackResponse
                    });
                    
                    google.accounts.id.renderButton(
                        document.getElementById("signInDiv"),
                        {theme: "outline"}
                    );
                }
            })  
        }
        else{
            navigate("/myRecipes")
        }
    }, [])

    const login = (e) =>{
        e.preventDefault();
        Axios.post("http://localhost:30015/login", {username: username, password: password}).then((response) =>{

            if (response.data == "Wrong combo"){
                alert("Wrong username or password")
            }
            else if (response.data == "Wrong username"){
                alert("No account with that username")
            }
            else{
                setUser(response.data.user);
                navigate("/myRecipes")
            }
        })
    }

    return(
      <>  

        <form onSubmit={login}>
            <h2>Login</h2>
            <input type = "text"  maxLength={250}  onChange={(e)=>{setUsername(e.target.value)}} required placeholder="Username"/>
            <br/>
            <input type = "password"  maxLength={100} onChange={(e)=>{setPassword(e.target.value)}} required  placeholder="Password"/>
            <br/>
            <button type = "submit">Login</button>

            <div className='flexCenter'>
                <div id = "signInDiv"></div>
            </div>
        </form>
      </>
    )
}

export default LoginPage;