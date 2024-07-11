import {useNavigate} from 'react-router-dom';
import { useState, useContext,  useEffect } from 'react';
import {Context} from "./context.js";
import  Axios  from 'axios';
import checkLoggedIn from "./checkLoggedIn.js";
import Select from 'react-select';

function ProfilePage(){
    Axios.defaults.withCredentials = true;
    let navigate = useNavigate()
    const {user, setUser} = useContext(Context);
    const [currentPass, setCurrentPass] = useState();
    const [newPass, setNewPass] = useState();
    const [confirmNewPass, setConfirmNewPass] = useState();
    const [display, setDisplay] = useState({});

    const getUserInfo = (user)=>{
        Axios.post("http://localhost:30015/getUserInfo", {userId: user.userId}).then((response)=>{
            setDisplay({value: response.data.userInfo.display, label: response.data.userInfo.display.charAt(0).toUpperCase() + response.data.userInfo.display.slice(1) + " mode"});
        })
    }

    useEffect(()=>{
        if (!user.userId){
            checkLoggedIn(setUser).then((response)=>{
                if (!response){
                    navigate("/")
                }
                else{
                    getUserInfo(response)
                }
            })  
        }
        else{
            getUserInfo(user)
        }
    }, [])

    const changePassword = (e)=>{
        e.preventDefault()
        if (confirmNewPass == newPass){
            Axios.post("http://localhost:30015/changePassword", {userId: user.userId, currentPass: currentPass, newPass: newPass}).then((response)=>{
                if (response.data == "Wrong password"){
                    alert("Incorrect current password")
                }
                else{
                    alert("Password succesfully changed!")
                }
            })
        }   
        else{
            alert("Confirmed password doesn't match new password.")
        }
    }

    const updateDisplay = (display)=>{
        Axios.post("http://localhost:30015/setUserDisplay", {userId: user.userId, display: display.value}).then(()=>{
            setUser((user)=>{
                let temp = {...user};
                temp.display = display.value;
                return temp;
            })
    
            setDisplay(display) 
        })

    }


    return(
      <>  
        <h2>{user && user.username}'s profile</h2>
        <form onSubmit={changePassword}>
            <h3>Change password: </h3>
            <input required onChange={(e)=>{setCurrentPass(e.target.value)}} type='password' placeholder='Current password'/>
            <br/>
            <input required onChange={(e)=>{setNewPass(e.target.value)}} type='password' placeholder='New password'/>
            <br/>
            <input required onChange={(e)=>{setConfirmNewPass(e.target.value)}} type='password' placeholder='Confirm new password'/>
            <br/>
            <button>Change</button>

            <h3>Display: </h3>
            <Select
                className='dropdown'
                placeholder = "Select display"
                onChange={updateDisplay}
                options={[{value: "light", label: "Light mode"}, {value: "dark", label: "Dark mode"}]}
                value={display}
            />
            
        </form>
      </>
    )
}

export default ProfilePage;