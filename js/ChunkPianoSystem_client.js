var ChunkPianoSystem_client = function(){
    'use strict'    
    
    var initSocketIo,
        resetChunkDrawingAreaAndChunkData, 
        // 複数のクラスで利用するメンバはこの globalMem オブジェクトに定義し，インスタンス生成時に引数として渡す.
        globalMem = { // 複数のクラスで利用するメンバ/メソッドはここで定義すること        
            chunkDrawingArea:$('#chunkDrawingArea'),
            socketIo:null,
            reqNoteLinePosition:null,
            turnNotEditedMode:null, // 後方参照ができないので，一旦 null を代入し，クラス内メンバの宣言が終わってからメンバを代入
            isFromLoadChunkButton:false,
            practicePointMode:null,//音符列orグループで頭出し
            groupMode:null,//色分けグループ形成
            groupDisplayMode:null,//グループごと表示
            isEditedByChunkMovingOrDelete:false, 
            isEditedByNewChunk:false,
            noteLinePosition:null,
            chunkHeadLinePositions:[], // チャンクによる頭出し位置を昇順ソートして格納．チャンクの移動が生じる度にソートしなおす．
            nowNoteRowCount:0,
            chunkDataObj:{
                userName:null,
                chunkData:{},
                practiceDay:null
            },
            groupCount:{}
        }
    ;

    var domRenderer =  ChunkPianoSystem_client.domRenderer(globalMem);
   
    //↓11/28追加
    console.log(`domRenderer: ${domRenderer}`);
    
    // このメソッドは chunkDataObj の chunkData のみを初期化する
    // チャンクのカウントもリセットするので注意...
    resetChunkDrawingAreaAndChunkData = function(){
        globalMem.chunkDataObj.chunkData = {};
        globalMem.patternChunkCount = 0;
        globalMem.phraseChunkCount = 0;
        globalMem.hardChunkCount = 0;
        globalMem.chunkDrawingArea.empty();
    };
    
    
    // turnNotEditedMode はクラスにして編集状態の変更をメソッドで実行するようにする
    globalMem.turnNotEditedMode = function(){                        
        globalMem.isEditedByChunkMovingOrDelete = false;
        globalMem.isEditedByNewChunk = false;
    };
    
    
    initSocketIo = function(){
        
        var reqNoteLinePositionCallback = null;
        globalMem.socketIo = io.connect();
        
        // noteLinePosition が正しく受信されていない場合に domRenderer クラスは 再受信のために reqNoteLinePosition を呼び出す．
        // そのため, reqNoteLinePosition を globalMem に追加した．
        // このメソッドは必ず即時実行すること (忘れてもバックアップがあるけども)．
        (globalMem.reqNoteLinePosition = function(callback){
            globalMem.socketIo.emit('reqNoteLinePosition', {data:0});
            //  noteLinePosition 再受信の再，domRenderer クラスは noteLinePosition の受信が完了してから
            //  dom rendering を行う必要がある．
            //  そのため，callback で処理を受け取り，initSocketIo スコープ変数 reqNoteLinePositionCallback を経由し
            //  noteLinePosition の socket on 時にこれを実行．
            if(callback){reqNoteLinePositionCallback = callback;}
        })();
        
        
        globalMem.socketIo.on('noteLinePosition', function(data){ 
            globalMem.noteLinePosition = data.noteLinePosition;
            if(reqNoteLinePositionCallback != null){
                reqNoteLinePositionCallback();
                reqNoteLinePositionCallback = null; // これを行わなければ reqNoteLinePositionCallback が null でも実行されバグる．
            }
        });
        
        
        globalMem.socketIo.on('disconnect', function(client){            
	    });
        
        
        globalMem.socketIo.on('chunkDataSaveRes', function(data){
            
            var isFromLoadChunkButtonProcessing,
                WAIT_TIME = 2000
            ;
            
            isFromLoadChunkButtonProcessing = function(){
                // loadChunkButton を押し，保存するを選択．正しい練習日数を記入し，保存をクリックした際に呼ばれる処理
                if(globalMem.isFromLoadChunkButton){ 
                    // todo: 通信エラー時に globalMem.isFromLoadChunkButton を false にできない可能性がある．
                    //       ユーザがブラウザをリロードすれば解決するが...
                    globalMem.isFromLoadChunkButton = false; // これを行わないと，保存処理を行うたびにロード処理のモーダルウィンドウも表示される
                    globalMem.socketIo.emit('chunkFileNameReq',{});
                }
            };
            
            // セーブが完了したら，編集モードを未編集にする． 
            globalMem.turnNotEditedMode();
            
            setTimeout(isFromLoadChunkButtonProcessing, (WAIT_TIME + 500));

            swal({   
                title: data.message, 
                type: data.status, timer: WAIT_TIME, 
                showConfirmButton: false 
            });
        });
        
        
        globalMem.socketIo.on('chunkFileNameList', function(data){

            // console.log(data.fileNameList);
            
            var pullDownMenuTemplate = '<select class="pullDownMenu" id="chunkDataSelectMenu">'
            
            
            // todo: プルダウンメニューに ChunkPianoData や .json を描画する必要は無いので，split して消去
            for(var i in data.fileNameList){ //  i をインデックスとして data.fileNameList の長さ分 for 文を実行
                pullDownMenuTemplate += '<option value ="' + data.fileNameList[i] + '">' + data.fileNameList[i] + '</option>';
            }
            
            pullDownMenuTemplate += '</select>';
            
            swal({
                title: '読み込むチャンクデータを<br>指定してください...',
                text: pullDownMenuTemplate,
                type: 'info',
                html: true,
                showCancelButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
            }, function(){
                setTimeout(function () {
                    // 上記で生成したプルダウンメニューでユーザが選択したファイル名を取得
                    var chunkDataSelectMenuVal = $('#chunkDataSelectMenu').val();
                    console.log('chunkDataSelectMenuVal: ' + chunkDataSelectMenuVal);
                    
                    globalMem.socketIo.emit('chunkDataReq',{requestChunkDataFileName:chunkDataSelectMenuVal});
                    // swal.close();
                }, 1000); // chunkDataSelectMenu DOM の描画を待つ必要があるため，1.5 秒待つ．
            }); 
        });
        
        
        globalMem.socketIo.on('reqestedChunkData', function(data){ // ロードリクエストをした chunkData がレスポンスされた時
                        
            resetChunkDrawingAreaAndChunkData();
            data.reqestedChunkData = JSON.parse(data.reqestedChunkData);
            
            for(var chunkId in data.reqestedChunkData.chunkData){
                domRenderer.createChunkDom(data.reqestedChunkData.chunkData[chunkId]);
            }
            
            globalMem.turnNotEditedMode();
                        
            swal(data.message, '', data.status);
        });
        
        
        $(window).unload(function(){
        });     
        
    };
        
    (function constructor() {
        initSocketIo();
        ChunkPianoSystem_client.initDomAction(globalMem, domRenderer);
    })();

};

$(function main(){
    ChunkPianoSystem_client();
});