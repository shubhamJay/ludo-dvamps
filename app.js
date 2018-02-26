const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const GamesManager = require(path.resolve('src/models/gamesManager.js'));
const getHandlers = require(path.resolve('src/handlers/getHandlers.js'));
const postHandlers = require(path.resolve('src/handlers/postHandlers.js'));
const deleteHandler = require(path.resolve('src/handlers/deleteHandler.js'));
const lib = require(path.resolve('src/handlers/middleWares.js'));
const GameRoute = require(path.resolve('src/handlers/gameRoute.js'));

const app = express();
/*eslint-disable*/
const ludo = express.Router();
/*eslint-enable*/

app.initialize = function(gamesManager,fs) {
  app.gamesManager = gamesManager;
  app.fs = fs;
};

app.use(lib.logger);
app.use(express.urlencoded({
  extended: false
}));
app.use(express.json());
app.use(cookieParser());
app.use(lib.checkGame);
app.use(lib.restrictValidPlayer);
app.use(express.static('public'));
app.use('/game',GameRoute);

app.get('/getAvailableGames', getHandlers.serveAvailableGames);
app.get('/waitingStatus',lib.checkIsGamePresent,getHandlers.serveWaitingStatus);

app.post('/createGame',lib.verifyReqBody,lib.verifyCreateGameReq,
  lib.checkCharacterLimit,lib.blockIfUserHasGame,
  postHandlers.createNewGame);
app.post('/joinGame',lib.verifyReqBody,lib.verifyCreateGameReq,
  lib.checkPlayerNameLimit,lib.checkGamesExists,postHandlers.joinPlayerToGame);

app.delete('/player', deleteHandler.removePlayer);

module.exports = app;
