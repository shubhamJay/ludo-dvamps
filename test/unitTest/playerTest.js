const assert = require('chai').assert;
const _path = require('path');
const Path = require(_path.resolve('src/models/path.js'));
const Player = require(_path.resolve('src/models/player.js'));
const Coin = require(_path.resolve('src/models/coin.js'));
const Cell = require(_path.resolve('src/models/cell.js'));
const UnsafeCell = require(_path.resolve('src/models/unsafeCell.js'));
const DestinationCell = require(_path.resolve('src/models/destinationCell.js'));

const generateSafeCells = function(from,to) {
  let cells = [];
  for(let index=from;index<=to;index++){
    cells.push(new Cell(index));
  };
  return cells;
};

const generateUnsafeCells = function(from,to) {
  let cells = [];
  for(let index=from;index<=to;index++){
    cells.push(new UnsafeCell(index));
  };
  return cells;
};

describe('#Player', () => {
  const initCoin = function(id,homePos,color){
    let coin = new Coin(id,homePos);
    coin.setColor(color);
    return coin;
  }
  let player,coins,path,firstCoin,secondCoin,thirdCoin,fourthCoin,oppCoin;
  beforeEach(function(){
    firstCoin = initCoin(1,-2,'red');
    secondCoin = initCoin(2,-3,'red');
    thirdCoin = initCoin(3,-4,'red');
    fourthCoin = initCoin(4,-5,'red');
    coins = [firstCoin,secondCoin];
    path = new Path(2,[new UnsafeCell(-2),new UnsafeCell(-3)]);
    player = new Player('john','red',coins,path);
  })
  describe('#getName', () => {
    it('should give name of player', () => {
      assert.equal(player.getName(),'john');
    });
  });
  describe('#getColor', () => {
    it('should give color of player', () => {
      assert.equal(player.getColor(),'red');
    })
  });
  describe('#getStatus', () => {
    it('should return playerStatus', () => {
      let firstCoin = new Coin(1,-2);
      let secondCoin = new Coin(2,-3);
      firstCoin.color = 'red';
      secondCoin.color = 'red';
      let coins = [firstCoin,secondCoin];
      let player = new Player('john','red',coins);
      let expectedStatus={
        name:'john',
        color:'red',
        coins:[{id:1,color:'red',position:-2},
          {id:2,color:'red',position:-3}]
      };
      assert.deepEqual(player.getStatus(),expectedStatus);
    });
  });
  describe('#getCoins', () => {
    it('should return the coins of the player', () => {
      coins = [initCoin(1,-2,'red'),initCoin(2,-3,'red')];
      assert.deepEqual(player.getCoins(),coins);
    });
  });
  describe('#getPath', () => {
    it('should return path of the player', () => {
      coins = [];
      let path = new Path(4,[]);
      let player = new Player('kaka','red',coins,path);
      assert.deepEqual(player.getPath(),path);
    });
  });
  describe('#getMovableCoins', () => {
    beforeEach(()=>{
      let cells = generateUnsafeCells(-6,7);
      path = new Path(4,cells);
      player.path = path;
    })
    describe('#unPairedCoins', () => {
      it('should return empty list if there are no movable coins', () => {
        let expected = [];
        assert.deepEqual(player.getMovableCoins(3),expected);
      });
      it('should return coins list if there are movable coins', () => {
        let cells = generateUnsafeCells(-3,6);
        player.path = new Path(4,cells)
        let expected = [initCoin(1,-2,'red'),initCoin(2,-3,'red')];
        assert.deepEqual(player.getMovableCoins(6),expected);
      });
      it('should not allow coin to reach Destination if players has not killed opp. coin',()=>{
        player.path = path;
        player.path.getCell(6).addCoin(secondCoin);
        assert.deepEqual(player.getMovableCoins(1),[]);
      });
      it('should allow coin to reach Destination if players has killed opp. coin',()=>{
        player.setKilledOpponent()
        player.path.getCell(3).addCoin(secondCoin);
        assert.deepEqual(player.getMovableCoins(1),[secondCoin]);
      });
      it('should return empty list if two opp coins block player coin path',function(){
        player.moveCoin(1,6);
        [1,2].forEach(function(id){
          let coin = new Coin(id,2);
          coin.setColor('green');
          player.path.cells[3].addCoin(coin)
        });
        let actual = player.getMovableCoins(2);
        assert.deepEqual(actual,[]);
      });
      it('should not allow to pass single coin over double coins of same colors',()=>{
        player.moveCoin(1,6);
        [thirdCoin,fourthCoin].forEach(function(coin){
          player.path.cells[3].addCoin(coin);
          player.coins.push(coin);
          player.moveCoin(coin.getId(),1);
        });
        let actual = player.getMovableCoins(3);
        assert.deepEqual(actual,[]);
      })
    });
    describe('#pairedCoins', () => {
      beforeEach(()=>{
        let cells = generateUnsafeCells(-4,7);
        path = new Path(4,cells);
        player.path = path;
        player.moveCoin(1,6);
        player.moveCoin(2,6);
      })
      it('should not return paired coins if move is odd', () => {
        let expected = [];
        assert.deepEqual(player.getMovableCoins(),expected);
      });
      it('should return paired coins if move is even', () => {
        let expected = [initCoin(1,-2,'red'),initCoin(2,-3,'red')];
        expected[0].setPosition(0);
        expected[1].setPosition(0);
        assert.deepEqual(player.getMovableCoins(2),expected);
      });
      it('should allow double coin to pass over single coin of same color',function(){
        player.path.cells[5].addCoin(thirdCoin);
        player.coins.push(thirdCoin);
        let actual = player.getMovableCoins(4);
        assert.deepEqual(actual,[firstCoin,secondCoin,thirdCoin]);
      });
      it('should allow double coin to pass over double coin of same color',function(){
        player.path.cells[5].addCoin(thirdCoin);
        player.path.cells[5].addCoin(fourthCoin);
        player.coins.push(thirdCoin);
        player.coins.push(fourthCoin);
        let actual = player.getMovableCoins(4);
        assert.deepEqual(actual,[firstCoin,secondCoin,thirdCoin,fourthCoin]);
      });
      it('should allow double coin to pass over double coin of different color',function(){
        thirdCoin.setColor('green');
        fourthCoin.setColor('green');
        player.path.cells[5].addCoin(thirdCoin);
        player.path.cells[5].addCoin(fourthCoin);
        let actual = player.getMovableCoins(4);
        assert.deepEqual(actual,[firstCoin,secondCoin]);
      });
    });
  });
  describe('#hasMovableCoins', () => {
    beforeEach(()=>{
      let cells = generateSafeCells(-3,-2).concat(generateUnsafeCells(1,6));
      player.path = new Path(4,cells);
    })
    it('should return true if there are movable coins', () => {
      assert.isOk(player.hasMovableCoins(6));
    });
    it('should return false if there are no movable coins', () => {
      assert.isNotOk(player.hasMovableCoins(3));
    });
  });
  describe('#moveCoin', () => {
    let oppCoin = initCoin(1,1,'blue');
    beforeEach(()=>{
      let cells = generateSafeCells(-3,-2).concat(generateUnsafeCells(0,9));
      player.path = new Path(2,cells);
      player.setKilledOpponent();
    })
    it('should move given coin by given specific moves', () => {
      player.path.getCell(0).addCoin(firstCoin);
      player.path.getCell(1).addCoin(oppCoin);
      let status = player.moveCoin(1,1);
      assert.isOk(status.killedOppCoin);
      assert.deepEqual(status.diedCoin,oppCoin.getStatus());
      assert.equal(firstCoin.getPosition(),1);
      assert.deepEqual(player.path.getCell(-2).coins,[]);
    });
    it('should not move given coin by given specific moves if move is not posible', () => {
      player.path.getCell(-2).addCoin(firstCoin);
      player.moveCoin(1);
      assert.equal(player.getCoin(1).position,-2)
      assert.lengthOf(player.path.getCell(-2).coins,1);
      assert.lengthOf(player.path.getCell(1).coins,0);
    });
    it('should move double coin by half of the move ', () => {
      player.moveCoin(1,6);
      player.moveCoin(2,6);
      let initPosOfFirstCoin = firstCoin.getPosition();
      let initPosOfSecondCoin = secondCoin.getPosition();
      player.moveCoin(1,4);
      let finalPosOfFirstCoin = firstCoin.getPosition();
      let finalPosOfSecondCoin = secondCoin.getPosition();
      assert.equal(finalPosOfFirstCoin,initPosOfFirstCoin+2)
      assert.equal(finalPosOfSecondCoin,initPosOfSecondCoin+2)
    });
    it('should give moved status of first move coin',function(){
      player.moveCoin(1,6);
      player.moveCoin(2,6);
      player.path.cells[3].addCoin(initCoin(1,2,'green'));
      let status = player.moveCoin(1,2);
      assert.isOk(status.killedOppCoin);
    });
  });
  describe('#getNoOfCoinsInDest', () => {
    beforeEach(()=>{
      let cells = generateUnsafeCells(-3,-2);
      cells.push(new DestinationCell(61));
      player.path = new Path(2,cells);
      [firstCoin,secondCoin,thirdCoin].forEach(function(coin){
        player.path.getCell(61).addCoin(coin);
      });
    });
    it('should give number of coins in destination', () => {
      assert.equal(player.getNoOfCoinsInDest(),3);
    });
    it('should give number of coins in destination', () => {
      player.path.getCell(61).addCoin(fourthCoin);
      assert.equal(player.getNoOfCoinsInDest(),4);
    });
  });
  describe('#getNextPos', () => {
    beforeEach(()=>{
      let cells = generateUnsafeCells(-3,3);
      player.path = new Path(3,cells);
    })
    it('should return next postion of given coinId ', () => {
      assert.equal(player.getNextPos(1,6),0);
    });
    it('should return next position as half of even dice roll',()=>{
      player.moveCoin(1,6);
      player.moveCoin(2,6);
      let initPos = firstCoin.getPosition();
      let nextPos = player.getNextPos(1,4);
      assert.equal(nextPos,initPos+2);
    });
  });
});
