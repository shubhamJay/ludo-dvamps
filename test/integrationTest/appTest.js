
const assert = require('chai').assert;
const request = require('supertest');
const path = require('path');
const app = require(path.resolve('app.js'));
const GamesManager = require(path.resolve('src/models/gamesManager.js'));

let doesNotHaveCookies = (res)=>{
  const keys = Object.keys(res.headers);
  let key = keys.find(currentKey=>currentKey.match(/set-cookie/i));
  if(key){
    throw new Error(`Didnot expect Set-Cookie in header of ${keys}`);
  }
};

describe.only('#App', () => {
  beforeEach(function(){
    app.initialize(new GamesManager());
  });
  describe('POST /createGame', () => {
    it('should set gameName and playerName in cookie', (done) => {
      request(app)
        .post('/createGame')
        .send('gameName=newGame&playerName=dhana')
        .expect(200)
        .expect('set-cookie','gameName=newGame,playerName=dhana')
        .expect(JSON.stringify({gameCreated:true}))
        .end(done);
    });
    it('should set gameName and playerName in cookie', (done) => {
      let gamesManager = new GamesManager();
      gamesManager.addGame('newGame');
      app.initialize(gamesManager);
      request(app)
        .post('/createGame')
        .send('gameName=newGame&playerName=dhana')
        .expect(200)
        .expect(JSON.stringify(
          {
            gameCreated:false,
            message:'game name already taken'
          }))
        .expect(doesNotHaveCookies)
        .end(done);
    });
  });
});
