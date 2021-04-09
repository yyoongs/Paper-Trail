/* Beaverhacks Spring 2021
** Paper Trail
** Team Members: Derth Adams, Kelton Orth, 
**               Yongsung Cho, Patricia Booth
** Instructions: To run locally (node.js required):
    * Navigate to root project directory on terminal
    * Type the following lines:
    *   npm install
    *   node index.js
    * Visit site on http://localhost:5000/
*/

const express = require('express');
const port = process.env.PORT || 5000;

// Initialize express and set view engine to handlebars(.hbs)
const app = express();
const handlebars = require('express-handlebars');
app.set('view engine', 'hbs');
app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    extname: 'hbs'
}));

app.use(express.static('public'));

// Loads main.hbs inside index.hbs
app.get('/', (req, res) => {
    res.render('main', {layout: 'index'})
});

app.listen(port, () => 
    console.log(`Express running on port ${port}`));