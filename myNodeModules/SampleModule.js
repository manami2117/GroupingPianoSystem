'use strict';

const SampleModule = function (count) {

  let self, 
      counter = 0
  ;

  function countUp() {
    counter++;
    return self;
  }

  function countDown() {
    counter--;
    return self;
  }

  function printCount() {
    console.log('Current count: ' + String(counter));    
  }

  (function constructor (){
    if (count) {
      counter = count;
    }
  })();

  self = {countUp:countUp, countDown:countDown, printCount:printCount}; // public methods
  return self;
};


// 1つしか必要のないモジュールの場合
const SampleModuleSingleton = (function (count) {

  let self, 
      counter = 0
  ;

  function countUp() {
    counter++;
    return self;
  }

  function countDown() {
    counter--;
    return self;
  }

  function printCount() {
    console.log('Current count: ' + String(counter));    
  }

  (function constructor (){
    if (count) {
      counter = count;
    }
  })();

  self = {countUp:countUp, countDown:countDown, printCount:printCount}; // public methods
  return self;
})();

(function main () {
  const sm1 = SampleModule(10);
  sm1.countUp().countUp().countUp().countDown().printCount();

  // const sms = SampleModuleSingleton(); // インスタンス化できない ≒ static モジュール
  SampleModuleSingleton.printCount();
})();
