# CookBookAI
A web application where you can create and view recipes and use various AI tools to assist you. Won 3rd place in the Congressional App challenge. 

## Features
* Add and view recipes manually
* Scrape recipes from websites, audio, videos (local or youtube), and images to automatically fill out recipe fields
* Generate a new recipe based on a prompt
* AI powered search
* Filter recipes by cook time and cuisine

## Built With
* Node.js/Express
* MySQL database
* React.js

## Getting Started
1. Clone repository

```bash
git clone https://github.com/enened/testMaker.git
```

2. Start React
```bash
cd cook-book
npm install
npm start
```

3. Set up MySQL database by running the sqlScript.sql file
4. Enter database credentials and OpenAI API key in a .env file
```env
DB_HOST = localhost
DB_USER = youruser
DB_PASSWORD = yourpassword
API_KEY = yourapikey
```

5. Enter your google client id in an env file inside the cook-book folder
```env
REACT_APP_CLIENT_ID = yourclientid
```

6. Start express server
```bash
npm install
node index.js
```
