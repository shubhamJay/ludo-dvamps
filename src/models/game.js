const Player = require('./player.js');
const Coin = require('./coin.js');
const Turn = require('./turn.js');
const Cell = require('./cell.js');
const Path = require('./path.js');
const ActivityLog = require('./activityLog.js');
const Board = require('./board.js');

const generateCoins = function() {
  let homeId = -1;
  let coins = [];
  for(let count=0;count<16;count++,homeId--){
    let coinId = count+1;
    coins.push(new Coin(coinId,homeId));
  }
  return coins;
};


class Game {
  constructor(name, ColorDistributor, dice,timeStamp ) {
    this.name = name;
    this.players = [];
    this.status = {};
    this.numberOfPlayers = 4;
    this.colorDistributor = new ColorDistributor();
    this.dice = dice;
    this.activityLog = new ActivityLog(timeStamp);
    this.board = new Board(this.numberOfPlayers);
    this.board.generate();
    this.coins = generateCoins();
  }
  getCoins(color){
    let colors = ['red','green','yellow','blue'];
    let coinIndex = colors.indexOf(color);
    let coins = this.coins.slice(coinIndex*4,(coinIndex+1)*4);
    return coins.map(function(coin){
      coin.setColor(color);
      return coin;
    });
  }
  getName(){
    return this.name;
  }
  getCurrentPlayer(){
    let turn = this.turn;
    return this.players.find((player)=>{
      return player.name == turn.currentPlayer;
    });
  }
  getStatus() {
    return this.status;
  }
  hasEnoughPlayers() {
    return this.numberOfPlayers <= this.players.length;
  }
  neededPlayers() {
    return this.numberOfPlayers - this.players.length;
  }
  getDetails() {
    return {
      name: this.name,
      remain: this.neededPlayers(),
      createdBy: this.players[0].name,
    };
  }
  doesPlayerExist(playerName) {
    return this.players.some((player) => player.name == playerName);
  }
  createPlayer(playerName){
    let playerColor = this.colorDistributor.getColor();
    let coins = this.getCoins(playerColor);
    return new Player(playerName,playerColor,coins,new Path(coins.length));
  }
  addPlayer(playerName) {
    if (this.doesPlayerExist(playerName) || this.hasEnoughPlayers()) {
      return false;
    }
    this.players.push(this.createPlayer(playerName));
    this.setStatus();
    return true;
  }
  getPlayer(playerName) {
    return this.players.find(player => player.name == playerName);
  }
  removePlayer(playerName) {
    let player = this.players.find(player => player.name == playerName);
    let playerIndex = this.players.indexOf(player);
    this.colorDistributor.addColor(player.getColor());
    this.players.splice(playerIndex, 1);
    this.setStatus();
  }
  getGameStatus(){
    let gameStatus = this.getStatus();
    gameStatus.currentPlayerName = this.turn.currentPlayer;
    gameStatus.won = this.hasWon();
    return gameStatus;
  }
  getNoOfPlayers() {
    return this.players.length;
  }
  setStatus() {
    this.status.players = this.players.map(player => player.getStatus());
  }

  decidePlayerPer(move) {
    let currentPlayer = this.getCurrentPlayer();
    this.activityLog.registerMove(currentPlayer.name,currentPlayer.color,move);
    if (this.turn.shouldChange(currentPlayer.hasMovableCoins(move))){
      currentPlayer = this.getCurrentPlayer();
      this.activityLog.registerTurn(currentPlayer.name,currentPlayer.color);
    }
    return currentPlayer;
  }
  getInfoPer(move){
    let currentPlayer = this.decidePlayerPer(move);
    return {
      move:move,
      coins:this.getMovableCoinsOf(move),
      currentPlayer:currentPlayer.getName()
    };
  }
  rollDice(){
    let turn = this.turn;
    if(!turn.hasMovedCoin()) {
      return {message:"first move your coin"};
    }
    let move = turn.rollDice(this.dice);
    return this.getInfoPer(move);
  }

  arrangePlayers(){
    return this.players.reduce((sequence,player)=>{
      let colorSequence = {red:0,green:1,yellow:2,blue:3};
      sequence[colorSequence[player.color]] = player.name;
      return sequence;
    },[]);
  }
  start(){
    let players = this.arrangePlayers();
    this.turn =new Turn(players);
    players.forEach((playerName,index)=>{
      let player = this.getPlayer(playerName);
      let path = this.board.getPathFor(index);
      player.assignPath(path);
    });
    this.activityLog.registerTurn(this.turn.currentPlayer,'red');
  }
  getMovableCoinsOf(move){
    let currentPlayer = this.getCurrentPlayer();
    return currentPlayer.getMovableCoins(move);
  }
  getLogs(){
    return this.activityLog.getLogs();
  }
  isMovableCoin(coinId){
    let move = this.turn.lastMove;
    let currentPlayer = this.getCurrentPlayer();
    let movablecoins = currentPlayer.getMovableCoins(move);
    return movablecoins.some((coin=>coin.id==coinId));
  }

  moveCoin(coinId){//have to refactor this code.
    let currentPlayer = this.getCurrentPlayer();
    let move = this.turn.lastMove;
    if(!this.turn.hasMovedCoin()){
      let status = currentPlayer.moveCoin(coinId,move);
      this.activityLog.registerCoinMoved(currentPlayer.getName(),
        currentPlayer.getColor());
      if(status.killedOppCoin){
        currentPlayer.setKilledOpponent();
        this.turn.increamentChances();
        let oppPlayer = this.players.find((player) =>
          player.getColor()==status.diedCoin.color);
        oppPlayer.moveCoinToHome(status.diedCoin);
        this.activityLog.registerKilledCoin(currentPlayer.name,
          currentPlayer.color,oppPlayer.color);
      }
      if(status.reachedDestination){
        this.turn.increamentChances();
      }
      this.setStatus();
      this.turn.decideTurnOnChance();
      currentPlayer = this.getCurrentPlayer();
      this.activityLog.registerTurn(currentPlayer.getName()
        ,currentPlayer.getColor());
      this.turn.markAsMovedCoin();
      return true;
    }
    return false;
  }

  hasWon() {
    let currentPlayer = this.getCurrentPlayer();
    return currentPlayer.getNoOfCoinsInDest()==4;
  }
  finish(){
    this.turn.endGame();
  }
}

module.exports = Game;
