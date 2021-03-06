﻿ChunkPianoSystem_client.domRenderer = function(globalMemCPSDDR){ 
    'use strict'
    
    var domUtil = ChunkPianoSystem_client.utility(),
        createChunkDom, getChunkHeadLine, getSortedChunkHeadLine
    ;

    // todo: チャンクを複数に分けて描画した際の link を指定する引数 parentChunk を追加
    // このメソッドは chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
    // for in 文で回し1つずつ描画する．
    createChunkDom = function(chunkPropCCD){ 

        var render, chunkDom, chunkDomId, chunkDomDelBtn, 
            isGroupCountUninitialized = globalMemCPSDDR.groupCount[chunkPropCCD.groupMode] === undefined //Question. 分からない…
        ; 

        if (chunkPropCCD.width  === null || chunkPropCCD.width  === undefined) return;
        if (chunkPropCCD.height === null || chunkPropCCD.width  === undefined) return;
        if (chunkPropCCD.width  <= 5 || chunkPropCCD.height <= 5 ) return;
        
        if (isGroupCountUninitialized){
            globalMemCPSDDR.groupCount[chunkPropCCD.groupMode] = 0;
        }

        // noteLinePosition が正しく受信されている / されていない で chunk 描画処理の順番を変更する必要がある．
        // そのため，チャンク描画処理を render 関数としてまとめた．
        render = function(){
            // マウスドラッグの x 方向がマイナス方向だった時に正しく描画するための処理．
            if(chunkPropCCD.width < 0){ 
                chunkPropCCD.left += chunkPropCCD.width;
                chunkPropCCD.width = Math.abs(chunkPropCCD.width); // Math.abs() は絶対値を返す．
            }
            // マウスドラッグの y 方向がマイナス方向だった時
            if(chunkPropCCD.height < 0){ 
                chunkPropCCD.top += chunkPropCCD.height;
                chunkPropCCD.height = Math.abs(chunkPropCCD.height);
            }
            
            chunkDomId = String() + chunkPropCCD.groupMode + 'Chunk_' + globalMemCPSDDR.groupCount[chunkPropCCD.groupMode];
            chunkDom = $('<div class="chunk ' + chunkPropCCD.groupMode + '" id="' + chunkDomId + '"></div>');
            //console.log("せやかて: " + '<div class="chunk ' + chunkPropCCD.groupMode + '" id="' + chunkDomId + '"></div>');
            
            chunkDom.css({ // jQuery で dom の css を変更するときの書法
                'top'   : chunkPropCCD.top    + 'px',
                'left'  : chunkPropCCD.left   + 'px',
                'width' : chunkPropCCD.width  + 'px',
                'height': chunkPropCCD.height + 'px'
            });
            
            //昨日追加
            var div = document.createElement('div');
            //div.textContent = 'hoge';
            var eisa = document.getElementById('chunkDrawingArea');
            eisa.appendChild(div);
            //

            chunkDom.mousedown(function(){
                globalMemCPSDDR.isEditedByChunkMovingOrDelete = true; // chunkDom がクリック，または移動された際は編集された，と定義する
                globalMemCPSDDR.isChunkDragging = true;
            });
                        
            chunkDom.mouseup(function(event){

                var mouseupedChunkDom = $(this),
                    mouseupedChunkDomData = globalMemCPSDDR.chunkDataObj.chunkData[mouseupedChunkDom[0].id]
                ;
            
                mouseupedChunkDomData.left = parseInt(mouseupedChunkDom.css('left'), 10);
                mouseupedChunkDomData.top = parseInt(mouseupedChunkDom.css('top'), 10);
                mouseupedChunkDomData.chunkHeadLine = getChunkHeadLine(mouseupedChunkDomData);
                
                globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);

                globalMemCPSDDR.isChunkDragging = false;
                console.log(globalMemCPSDDR.chunkDataObj.chunkData);
            });
            
            domUtil.appendDruggAndDropEvent(chunkDom, globalMemCPSDDR.chunkDrawingArea);
                        
            chunkDomDelBtn = $('<div class="chunkDeleteButton" id="' + chunkDomId +'_DeleteButton">' + 
                                    '<p class="chunkDeleteButtonFont">×</p>' + 
                                '</div>'
                                )
            ;

            chunkDomDelBtn.click(function(){
                var parentChunkDom = $(this).parent(),
                    parentChunkDomId = parentChunkDom[0].id
                ;
                parentChunkDom.remove(); // クリックされた chunkDomDelBtn の親要素 == ユーザが消したい chunk dom
                // html の chunkDom の削除と同時に オブジェクトのデータ構造内の該当する chunkDom も削除．
                delete globalMemCPSDDR.chunkDataObj.chunkData[parentChunkDomId];
                globalMemCPSDDR.isEditedByChunkMovingOrDelete = true;
                
                globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
                
                console.log(globalMemCPSDDR.chunkDataObj);
            });

            chunkDom.append(chunkDomDelBtn);

            chunkPropCCD['chunkHeadLine'] = getChunkHeadLine(chunkPropCCD);
            globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] = chunkPropCCD;

            // グローバルメンバの chunkHeadLinePositions にソート済みのチャンク頭出し位置を配列で格納
            // todo : この処理は delete, mouseup の際にも行う必要あり，
            //        それぞれの処理を終えてからこの処理を行うこと!!
            globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
            
            globalMemCPSDDR.chunkDrawingArea.append(chunkDom);
            console.log(globalMemCPSDDR.chunkDataObj);
            
            globalMemCPSDDR.groupCount[chunkPropCCD.groupMode]++;
        };          
        
        // noteLinePosition が正しく受信されていない場合，チャンクの頭出し位置を計算できない．
        // その場合は main class の reqNoteLinePosition を呼び出し再受信する．
        if(globalMemCPSDDR.noteLinePosition == null || globalMemCPSDDR.noteLinePosition == undefined){
            globalMemCPSDDR.reqNoteLinePosition(function(){
                render();
            });
            return 0; // return しないと render が2度実行されてしまう．
        }
        
        render(); // 上記if文より下で実行すること．実行順序を入れ替えると，noteLinePosition を再受信した際に render が2度実行される．
    };
    
    getChunkHeadLine = function(chunkPropGCL){
        var getPositionByBruteForceSearch, 
            chunkMiddleAxisY = 0
        ;
                
        // 力任せ法によるチャンク頭出し音符列の算出
        getPositionByBruteForceSearch = function(startIndex, endIndex, chunkLeftPosition, notePositionArray){
            var euclidDistance = 0,
                nearestNotePosition = null;
            for(var i = startIndex; i<= endIndex; i++){
                // console.log(notePositionArray[i]);
                euclidDistance = chunkLeftPosition - notePositionArray[i].axisX;
                
                if(euclidDistance < 0){ // チャンクの左辺 - 音符列の x 座標がマイナスになった瞬間が，チャンク内の左端の音符列
                    nearestNotePosition = i;
                    break;
                }
            }
            return nearestNotePosition;
        };
        
        chunkMiddleAxisY = chunkPropGCL.top + (Math.floor(chunkPropGCL.height / 2));
        
        // チャンクが上段に描画された場合のチャンク頭出し位置の算出
        if(chunkMiddleAxisY <= globalMemCPSDDR.noteLinePosition.middleAxisY){
        
            // todo: チャンクの y 座標を引数として与えると，譜面の何段目に当たっているかを判定するメソッドを追加．これじゃハードコーディングでダサい!
            //     : ScoreDataParser で判定メソッドをオブジェクトに詰めてここで実行する? 
            return getPositionByBruteForceSearch(globalMemCPSDDR.noteLinePosition.scoreCol['1'].start, // '1' は1段目の音符列を意味する．
                                                 globalMemCPSDDR.noteLinePosition.scoreCol['1'].end,
                                                 parseInt(chunkPropGCL.left, 10),
                                                 globalMemCPSDDR.noteLinePosition.noteLine
                                                )
            ;
        // チャンクが上段に描画された場合のチャンク頭出し位置の算出
        }else{
            return getPositionByBruteForceSearch(globalMemCPSDDR.noteLinePosition.scoreCol['2'].start, // '2' は2段目の音符列を意味する．
                                                 globalMemCPSDDR.noteLinePosition.scoreCol['2'].end,
                                                 parseInt(chunkPropGCL.left, 10),
                                                 globalMemCPSDDR.noteLinePosition.noteLine
                                                )
            ;
        }
    };
    
    getSortedChunkHeadLine = function(chunkData){
        
        var sortedChunkHeadLine = []; 
        
        for(var chunk_dom_id in chunkData){//  // 例）chunk_dom_id: knowledeApplicationChunk_0
            if (globalMemCPSDDR.groupDisplayMode === 'all') {
                sortedChunkHeadLine.push(parseInt(chunkData[chunk_dom_id].chunkHeadLine, 10));//chunkHeadLine: おそらくそれぞれのグループの先頭の音符番号だと思われる          
            } else {
                if (globalMemCPSDDR.groupDisplayMode === chunkData[chunk_dom_id].groupMode) {
                    sortedChunkHeadLine.push(parseInt(chunkData[chunk_dom_id].chunkHeadLine, 10));           
                }
            }    
        }
        //console.info("chunk_dom_id: "+ chunk_dom_id);
        sortedChunkHeadLine.sort(function(a,b){ // 昇順にソート (https://qiita.com/ymk83/items/3d53e0965a278b5cfd4d) 戻り値が正のときaをbの後ろに並べ替え，戻り値が負のときaをbの前に並べ替え
            return a - b;
        });
        return sortedChunkHeadLine;
    };
    
    return{createChunkDom:createChunkDom, getSortedChunkHeadLine:getSortedChunkHeadLine};//Question. なんとなくわかるけどなぜvalueとkeyが同じなのか…やっぱりわからない…
    //console.log("createChunkDom: "+ createChunkDom);
    //console.log("getSortedChunkHeadLine: "+ getSortedChunkHeadLine);
};