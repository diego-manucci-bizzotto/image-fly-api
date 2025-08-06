const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');

require('dotenv').config();

//var indexRouter = require('./routes/index');
const imagesRouter = require('./routes/images');

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/images', imagesRouter);

module.exports = app;
