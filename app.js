const express = require('express')
const path = require('path')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static('public'));

module.exports.app = app;
module.exports.port = port;
