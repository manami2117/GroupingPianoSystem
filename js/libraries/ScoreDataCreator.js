 // このライブラリは引数に jQuery の DOM をとることに注意!
var ScoreDataCreator = function(){
    'use strict'
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    var constructor, initScoreAreaAction, showHelp, 
        scoreArea, addElementToScoreDataObj, createNotesTemplate,
        scoreDataObj = {
            notesCol:{},
            scoreRow:{
                upperAxisY:null,
                lowerAxisY:null
            }
        },
        notesColCounter = 0,
        inputState = 'upper', // キー入力の状態. デフォルトは上段中央のy座標を入力する upper モード．
        isUpperCol = true, // 上段を入力中か否か
        notePosX = 0, 
        notePosY = 0
    ;
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    createNotesTemplate = function(){
        var template = {
            'note-0': {
                name: null, // 例: A3
                time: null, // 拍情報．4分音符なら 1.0
                axisX: null,
                axisY: null
            },
            'note-1': {
                name: null,  // ここにアクセスする方法.... scoreDataObj.notesCol[0].notes['note-1'].name
                time: null, 
                axisX: null,
                axisY: null
            },
            'note-2': {
                name: null, 
                time: null, 
                axisX: null,
                axisY: null
            },
            axisX:null, // 今回はこの部分の座標を登録
            axisY:null
        };
        return template;
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    initScoreAreaAction = function(){
        
        $(document).keypress(function(e){
            
            switch(e.which){
                case 117: // u
                    inputState = 'upper';
                    isUpperCol = true;
                    console.log(scoreDataObj);
                    showHelp();
                    break;
                case 110: // n
                    inputState = 'notesInput';
                    console.log(scoreDataObj);
                    showHelp();
                    break;
                case 108: // l
                    inputState = 'lower';
                    isUpperCol = false;
                    console.log(scoreDataObj);
                    showHelp();
                    break;
                case 100: // d        
                    inputState = 'delete';
                    console.log(scoreDataObj);
                    if(notesColCounter > 0) notesColCounter--;
                    console.log('notesColCounter: ' + notesColCounter);
                    showHelp();
                    break;
                case 115: // s
                    var blob, url, blobURL, fileName, a;
                    
                    inputState = 'save';

                    strScoreDataObj = JSON.stringify(scoreDataObj);
                    blob = new Blob([strScoreDataObj]);
                    url = window.URL || window.webkitURL;
                    blobURL = url.createObjectURL(blob);

                    fileName = 'scoreData';

                    a = document.createElement('a');
                    a.download = fileName + '.json';
                    a.href = blobURL;
                    a.click();
                    showHelp();
                    break;
            }                   
        });
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////
        scoreArea.mousedown(function(e){   

            notePosX = parseInt(e.offsetX, 10);
            notePosY = parseInt(e.offsetY, 10);
            console.info('notePosX: ' + notePosX);
            console.info('notePosY: ' + notePosY);

            if(inputState == 'upper'){
                scoreDataObj.scoreRow.upperAxisY = notePosY;
                console.log(scoreDataObj);
            }else if(inputState == 'lower'){
                scoreDataObj.scoreRow.lowerAxisY = notePosY;
                console.log(scoreDataObj);
            }else if(inputState == 'notesInput'){
                var notesTemplate = createNotesTemplate();
                if(isUpperCol){
                    if(notesTemplate.axisY = scoreDataObj.scoreRow.upperAxisY != null){
                        notesTemplate.axisX = notePosX;
                        notesTemplate.axisY = scoreDataObj.scoreRow.upperAxisY;
                        scoreDataObj.notesCol[notesColCounter] = notesTemplate;
                        console.log(scoreDataObj);
                        notesColCounter++;
                    }else{
                        alert('scoreDataObj.scoreRow.upperAxisY が null です');
                    }
                }else{
                    if(notesTemplate.axisY = scoreDataObj.scoreRow.lowerAxisY != null){
                        notesTemplate.axisX = notePosX;
                        notesTemplate.axisY = scoreDataObj.scoreRow.lowerAxisY;
                        scoreDataObj.notesCol[notesColCounter] = notesTemplate;
                        console.log(scoreDataObj);
                        notesColCounter++;
                    }else{
                        alert('scoreDataObj.scoreRow.upperAxisY が null です');
                    }
                }   
            }
        });
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    showHelp = function(){
        console.info('USAGE...');
        console.info('  u キーを押下し，上段の中央のy座標を1回クリック．');
        console.info('  n キーを押下し，上段の音列を左からクリック');
        console.info('  l キーを押下し，下段の中央のy座標を1回クリック．');
        console.info('  n キーを押下し，下段の音列を左からクリック');
        console.info('  d キーを押下すると音符番号が戻り，再入力可能');
        console.info('  s でデータを保存．');
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    constructor = function(scoreAreaC){
        scoreArea = scoreAreaC;
        showHelp();
        initScoreAreaAction();
    };
    ///////////////////////////////////////////////
    /////////////////////////////////////////////// 
    return {constructor:constructor};
};
///////////////////////////////////////////////
/////////////////////////////////////////////// 
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
$(function(){
     var sdc = ScoreDataCreator();
     sdc.constructor($('#chunkDrawingArea'));    
});