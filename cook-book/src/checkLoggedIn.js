import Axios from 'axios';

async function checkLoggedIn(setUser){

    const response = await Axios.get("http://localhost:30015/login")

    if (response.data.user){
        setUser(response.data.user)
        return response.data.user
    }

    return false

}

export default checkLoggedIn;