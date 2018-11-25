module.exports = function(fileName){
    'use strict'

    var fs = require('fs'), 
        constructor, scoreDataJson, getNoteLinePosition, getRawData
    ;

    getNoteLinePosition = function(){
        
        var noteLinePositionObj = {
                noteLine:[],
                upperY:scoreDataJson.scoreRow.upperAxisY,
                lowerY:scoreDataJson.scoreRow.lowerAxisY,
                middleAxisY:null, // チャンク先頭位置が上段か下段かの判定に利用
                scoreCol:{}
            },
            scoreColCounter = 1,
            isScoreColFirstLine = true,
            scoreColFirstLine = null
        ;
        
        noteLinePositionObj.middleAxisY = Math.floor(noteLinePositionObj.upperY + 
                                                     ((noteLinePositionObj.lowerY - noteLinePositionObj.upperY) / 2)
                                                     )
        ;
         
        for(var noteLine in scoreDataJson.notesCol){ //scoreDataJson.notesColのkeyをnoteLineに入れる　ex) "0"はkey，{"name":"B5",〜,"practiceMode":"rightHand"}はvalue (TurcoScore参照)だよ
            
            var intNoteLine = parseInt(noteLine, 10), //parseInt(string, radix); radixはstringに対する基数(今回の場合10進数)
                beforeStringNoteLine = null
            ;

            // 音符列番号のどこからどこまでが譜面の1段目，2段目かをデータ化
            // 出力例: { '1': { start: '0', end: '48' }, '2': { start: '49', end: 82 } }
            if((intNoteLine > 0) && (intNoteLine < (Object.keys(scoreDataJson.notesCol).length -1))){
                beforeStringNoteLine = String() + (intNoteLine-1) // オブジェクトのキーにするために String に変換．
                // 各譜面の段の最初の音符番号を抽出．
                if(isScoreColFirstLine){ 
                    scoreColFirstLine = beforeStringNoteLine;
                    isScoreColFirstLine = false;
                }
    
                // 各譜面の段の最後の音符番号を抽出． 
                // 音符列の y 座標は列の中央 y 座標 middleAxisY になっている．これが変わった瞬間が段が切り替わった瞬間，
                if(scoreDataJson.notesCol[noteLine].axisY != scoreDataJson.notesCol[beforeStringNoteLine].axisY){
                    noteLinePositionObj.scoreCol[scoreColCounter] = {'start':scoreColFirstLine, 'end':beforeStringNoteLine};
                    isScoreColFirstLine = true;
                    scoreColCounter++
                }
            // 譜面の最後の音符番号のみ別処理．
            }else if(noteLine == (Object.keys(scoreDataJson.notesCol).length -1)){
                noteLinePositionObj.scoreCol[scoreColCounter] = {'start':scoreColFirstLine, 'end':intNoteLine};
            }

            // ScoreData から音符列の x 座標，y 座標のみを抽出．
            // 音符個別の y 座標は取得しない．音符個別の y 座標も取得したい場合は，getRawData を利用すべし．
            noteLinePositionObj.noteLine[noteLine] = {
                'axisX':scoreDataJson.notesCol[noteLine].axisX,                                       
                'axisY':scoreDataJson.notesCol[noteLine].axisY
            };
        }
        
        return noteLinePositionObj; 
    };

    // ScoreData の生データを返す．
    getRawData = function(){
        return scoreDataJson; 
    };
    // constructor が行うのは json データのロードのみ
    (constructor = function(){
        scoreDataJson = fs.readFileSync('./ScoreData/' + fileName, 'utf-8');    
        var a = '{"result":true, "count":42}';
        scoreDataJson = JSON.parse(scoreDataJson);
    
    })();

    return{getNoteLinePosition:getNoteLinePosition, getRawData:getRawData};
};