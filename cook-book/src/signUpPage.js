import {useNavigate} from 'react-router-dom';
import { useState,useContext,  useEffect} from 'react';
import {Context} from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";

function SignupPage(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    const {user, setUser} = useContext(Context);
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [confirmPassword, setConfirmPassword] = useState();

    useEffect(()=>{
        if (!user.userId){
            checkLoggedIn(setUser).then((response)=>{
                if (response){
                    navigate("/myRecipes")
                }
            })  
        }
        else{
            navigate("/myRecipes")
        }
    }, [])

    const signup = (e) =>{
        e.preventDefault();
        if (confirmPassword == password){
            Axios.post("http://localhost:30015/signup", {username: username, password: password}).then((response) =>{
                if (response.data == "username in use"){
                    alert(`Username ${username} in use. Please pick a different username.`)
                }
                else{
                    setUser(response.data.user);
                    navigate("/myRecipes")
                }
            })
        }
        else{
            alert("Confirm password doesn't match password")
        }
    }
    

    return(
      <>  
        <form onSubmit={signup}>
            <h2>Signup</h2>
            <input type = "text" maxLength={250} onChange={(e)=>{setUsername(e.target.value)}} required placeholder="Username"/>
            <br/>
            <input type = "password" maxLength={100} onChange={(e)=>{setPassword(e.target.value)}} required placeholder="Password"/>
            <br/>
            <input type = "password" maxLength={100} onChange={(e)=>{setConfirmPassword(e.target.value)}} required placeholder="Confirm password"/>
            <br/>
            <button type = "submit">Signup</button>
        </form>
      </>
    )
}

export default SignupPage;