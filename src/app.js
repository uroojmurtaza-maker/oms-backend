const express = require('express');
const cors = require('cors'); 
const routes = require('./routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use('/api', routes);


module.exports = app;