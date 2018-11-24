module.exports = function(mode){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var readIoiFile, getIoiMaxMin,
        fs = require('fs')
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // todo: ioi などの打鍵データを処理するモジュールを分離．
    readIoiFile = function(fileName){        
        var ioi;

        ioi = fs.readFileSync('./files/' + fileName, 'utf-8');
        splitedIoi = ioi.split('\n');
        for(var i in splitedIoi){
           splitedIoi[i] = parseInt(splitedIoi[i], 10);
        }
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    getIoiMaxMin = function(callback){
        try{
            var ioiMax = 0,
                ioiMin = 0
            ;
            // 比較する初期値として splitedIoi の先頭要素を代入
            ioiMax = splitedIoi[0]; 
            ioiMin = splitedIoi[0];

            for(var i in splitedIoi){

                // 最大値を抽出
                if(ioiMax < splitedIoi[i]){
                    ioiMax = splitedIoi[i];
                }
                // 最小値を抽出
                if(ioiMin > splitedIoi[i]){
                    ioiMin = splitedIoi[i];
                }            
            }

            if(ioiMax == undefined || ioiMin == undefined){
                throw new Error('readIoiFile を先に実行すべし');
            }

            callback({ioiMax: ioiMax, ioiMin: ioiMin}); // callback の実体は main 関数の getIoiMaxMin 引数に与えた無名関数

        }catch(e){ // もしエラーを検出したら: e はただの変数名
            console.log(e);
        }
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    return {readIoiFile:readIoiFile, getIoiMaxMin:getIoiMaxMin};
};