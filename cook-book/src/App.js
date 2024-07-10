import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import Header from './header.js';
import LoginPage from "./loginPage.js";
import SignupPage from "./signUpPage.js"
import MyRecipes from './myRecipes.js';
import Search from './search.js';
import ProfilePage from './profilePage.js';
import RecipeForm from './RecipeForm.js';
import ViewRecipePage from './viewRecipePage.js';
import {Context} from "./context.js";
import Axios from 'axios'

function App() {
  Axios.defaults.withCredentials = true;
  const [user, setUser] = useState({})
  const [recipes, setRecipes] = useState([])
  const [display, setDisplay] = useState("light");
  
  useEffect(()=>{
    if (user.display){
      setDisplay(user.display);
    }
    else{
      setDisplay("light")
    }
  }, [user.display])


  return (
    <div className={display}>
      <Context.Provider value={{user, setUser, recipes, setRecipes}}>
        <Router>

          <Header/>
          <Routes>

            <Route exact path="/" element={<LoginPage />}/>
            <Route exact path="/signup" element={<SignupPage />}/>
            <Route exact path="/myRecipes" element={<MyRecipes />}/>
            <Route exact path="/search" element={<Search />}/>
            <Route exact path="/profile" element={<ProfilePage />}/>
            <Route exact path="/createRecipe" element={<RecipeForm />}/>
            <Route exact path="/editRecipe/:recipeId" element={<RecipeForm />}/>
            <Route exact path="/viewRecipe/:recipeId" element={<ViewRecipePage />}/>
            <Route path="*" element={<Navigate to="/" />}/>

          </Routes>

        </Router>
      </Context.Provider>
    </div>
  )
}

export default App;
