const getIdGen = function(){
  var index = 0;
  return function(){
    var ids = ['1234','1235','1236','1237'];
    var id = ids[index];
    index = index+1;
    return id;
  }
}

module.exports = getIdGen;
