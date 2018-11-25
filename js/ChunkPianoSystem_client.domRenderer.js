ChunkPianoSystem_client.domRenderer = function(globalMemCPSDDR){ 
    'use strict'
    
    var domUtil = ChunkPianoSystem_client.utility(),
        createChunkDom, getChunkHeadLine, getSortedChunkHeadLine
    ;
    // todo: チャンクを複数に分けて描画した際の link を指定する引数 parentChunk を追加
    // このメソッドは chunk を 一度に1つしか描画できない．保存データから複数の chunk を描画する際は保存データを
    // for in 文で回し1つずつ描画する．
    createChunkDom = function(chunkPropCCD){ 

        var render, chunkDom, chunkDomId, chunkDomDelBtn; 
            
        if (chunkPropCCD.width  === null || chunkPropCCD.width  === undefined) return;
        if (chunkPropCCD.height === null || chunkPropCCD.width  === undefined) return;
        if (chunkPropCCD.width  <= 5 || chunkPropCCD.height <= 5 ) return;
        
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
            
            
            // chunk dom のテンプレート生成，描画位置情報を css に変換，イベント登録
            chunkDomId = String() + chunkPropCCD.chunkType + 'Chunk_' + globalMemCPSDDR.patternChunkCount;
            chunkDom = $('<div class="chunk pattern" id="' + chunkDomId + '"></div>');

            chunkDom.css({ // jQuery で dom の css を変更するときの書法
                'top'   : chunkPropCCD.top    + 'px',
                'left'  : chunkPropCCD.left   + 'px',
                'width' : chunkPropCCD.width  + 'px',
                'height': chunkPropCCD.height + 'px'
            });
            
            
            chunkDom.mousedown(function(){
                globalMemCPSDDR.isEditedByChunkMovingOrDelete = true; // chunkDom がクリック，または移動された際は編集された，と定義する
                globalMemCPSDDR.isChunkDragging = true;
            });
            
            
            chunkDom.mouseup(function(event){
                // solved: ここにチャンクの頭出し位置を計算する処理，データ構造にその情報を加える処理を追加．
                //         この処理は DOM 追加時，mouseup 時の両方で行う必要あり．
                //         mouseup で移動した後の css top, left を反映するのを忘れていた!
                //         今は生成時の top, left が保持され続けている... 
                
                // this は mouseup された chunkDom 要素を指す，
                // DOM アクセスには時間がかかるので，変数にキャッシュしてアクセス時間を減らす．

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
            
            
            // chunk 消去ボタンのテンプレート生成，css 計算，イベント付与
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
                // !!!! ChunkDom 関連の実装を拡張する際は，オブジェクトのデータ構造とDOMの状態をバラバラにしないように細心の注意を !!!!
                delete globalMemCPSDDR.chunkDataObj.chunkData[parentChunkDomId];
                globalMemCPSDDR.isEditedByChunkMovingOrDelete = true;
                
                globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
                
                console.log(globalMemCPSDDR.chunkDataObj);
            });

            chunkDom.append(chunkDomDelBtn);
        
            // todo: globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] (domrenderer), chunkPropaties (initDomAction) など，
            //       同じ情報もしくはその拡張を複数箇所で定義しており，バグを生みやすい状況にある．
            //       object の ファクトリ関数を定義し，最初から全てのプロパティを定義し，サブクラスでプロパティを拡張しないようにする．
            //       現状ではオブジェクトプロパティを確認するにはプログラムを実行する必要があり，メンテナンス性が低い!!!
            // html への chunkDom の追加と同時に オブジェクトのデータ構造にも chunkDom を追加．
            globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] = {
                left          : chunkPropCCD.left,
                top           : chunkPropCCD.top,
                width         : chunkPropCCD.width,
                height        : chunkPropCCD.height,
                chunkType     : chunkPropCCD.chunkType, // 本メソッドで拡張したプロパティ．ファクトリ関数で最初から生成するように変更すべし．
                chunkHeadLine : getChunkHeadLine(chunkPropCCD), 
                parentChunk   : null  // 本メソッドで拡張したプロパティ．ファクトリ関数で最初から生成するように変更すべし．
            };
            
            
            // グローバルメンバの chunkHeadLinePositions にソート済みのチャンク頭出し位置を配列で格納
            // todo : この処理は delete, mouseup の際にも行う必要あり，
            //        それぞれの処理を終えてからこの処理を行うこと!!
            globalMemCPSDDR.chunkHeadLinePositions = getSortedChunkHeadLine(globalMemCPSDDR.chunkDataObj.chunkData);
            
            globalMemCPSDDR.chunkDrawingArea.append(chunkDom);
            console.log(globalMemCPSDDR.chunkDataObj);
            
            if(chunkPropCCD.chunkType == 'pattern'){
                globalMemCPSDDR.patternChunkCount++; // todo: phraseChunk, hardChunk 描画時のカウンティング処理を追加
            }
        };          
        
        
        // noteLinePosition が正しく受信されていない場合，チャンクの頭出し位置を計算できない．
        // その場合は main class の reqNoteLinePosition を呼び出し再受信する．
        if(globalMemCPSDDR.noteLinePosition == null || globalMemCPSDDR.noteLinePosition == undefined){
            globalMemCPSDDR.reqNoteLinePosition(function(){
                // console.log('----- reqNoteLinePositionCallback -----');
                // console.log(globalMemCPSDDR.noteLinePosition);
                render();
            });
            return 0; // return しないと render が2度実行されてしまう．
        }
        // console.log(globalMemCPSDDR.noteLinePosition);
        
        render(); // 上記if文より下で実行すること．実行順序を入れ替えると，noteLinePosition を再受信した際に render が2度実行される．
    };
    
    
    getChunkHeadLine = function(chunkPropGCL){     // チャンクの左辺の位置情報から最近傍の音符列を取得するメソッド.
        var getPositionByBruteForceSearch, 
            chunkMiddleAxisY = 0
        ;
        
        // 2分木探索によるチャンク頭出し音符列の算出
        // getPosition = function(startIndex, endIndex, notePositionArray){
	       // var arrayCenterIndex = null;
        // };
        
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
        // console.log('chunkMiddleAxisY: ' + chunkMiddleAxisY);
        // console.log(globalMemCPSDDR.noteLinePosition.middleAxisY);
        
        console.log(globalMemCPSDDR.noteLinePosition);
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
        
        for(var chunk_dom_id in chunkData){
            // css プロパティは勝手に string に変換されている場合があるので　parseInt を忘れずに行う．
            sortedChunkHeadLine.push(parseInt(chunkData[chunk_dom_id].chunkHeadLine, 10));
        }
        sortedChunkHeadLine.sort(function(a,b){
            return a - b;
        });
        console.info(sortedChunkHeadLine);        
        return sortedChunkHeadLine;
    };
    
    
    return{createChunkDom:createChunkDom};
};