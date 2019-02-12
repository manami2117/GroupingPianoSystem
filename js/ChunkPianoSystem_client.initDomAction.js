ChunkPianoSystem_client.initDomAction = function(globalMemCPSCIDA, domRenderer){    
    'use strict'
        
    var init, setPlayPosition, 
        playPosition = $('#playPosition')
    ;
    
    init = function(){
        //Question. なぜオブジェクトじゃないのか
        //$(element) 指定したDOM要素をjQueryオブジェクトにして返す
        var saveChunkButton = $('#saveChunkButton'), //"グループを保存"ボタン
            loadChunkButton = $('#loadChunkButton'), //"ファイル読込"ボタン
            practicePointModeSelector = $('#practicePointModeSelector'), //"音符列 or グループで頭出し"セレクタ
            groupModeSelector = $('#groupModeSelector'), //"譜面 or 演奏 or 知識応用グループ"セレクタ
            groupDisplayModeSelector = $('#groupDisplayModeSelector'), //形成したグループのうち"譜面 or 演奏 or 知識応用"のいずれかのグループだけを表示するセレクタ
            leftPositionButton = $('#leftPositionButton'), //"←"ボタン
            rightPositionButton = $('#rightPositionButton'), //"→"ボタン
            isChunkDrawing = false,
            chunkDrawingAreaMouseDowmPosX = 0,
            chunkDrawingAreaMouseDowmPosY = 0,
            chunkHeadLinePositionsNowIndex = 0,
            swalPromptOptionForUserNameProp,
            defaultUserName = null,
            userNameSetter, //ユーザー名を記入する際のウィンドウ
            saveConfirmModalWindow, //"グループを保存"をクリックした時に表示されるウィンドウ
            rejectChunkPracticeMode //"グループで頭出し"を選択する際にグループが1つも記入されていなかった場合のアラート
        ;

        //Question. globalMemCPSCIDAはglobalMemじゃダメなのか →ChunkPianoSystem_client.jsのコンストラクタの変数として指定されている
        //クラスなどを2つ以上定義するときは，はじめのクラス名のあとスペース必要！
        //jsでselectタグを選択状態にする方法：https://techacademy.jp/magazine/18491
        //jsでoptionのvalueを取得する方法：https://www.deep-blog.jp/engineer/archives/5476/
        globalMemCPSCIDA.practicePointMode = $('#practicePointModeSelector option:selected').val(); //"音符列 or グループで頭出しセレクタ"のvalueを取得
        globalMemCPSCIDA.groupMode = $('#groupModeSelector option:selected').val(); //"譜面 or 演奏 or 知識応用グループセレクタ"のvalueを取得
        globalMemCPSCIDA.groupDisplayMode = $('#groupDisplayModeSelector option:selected').val(); //"グループごとに表示セレクタ"のvalueを取得

        // user name 入力処理        
        // 一度ユーザネームを入力している場合，次回以降は localStorage に保存されている unerName をデフォルトで入力する．
        // localStrage はブラウザのバージョンによっては実装されていないので念のため try - catch する. 
        //try-catch：https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Exception_Handling_Statements/try...catch_Statement
        //
        try{
            defaultUserName = localStorage.getItem('chunkPianoSystem_userName');//chunkPianoSystem_userNameのvalue (ユーザーネーム) を取得．
            if(defaultUserName == null || defaultUserName == undefined){ //ユーザーネームがないまたは定義されていない場合
                defaultUserName = ''; //defaultUserNameは空
            }
        }catch(e){
            console.log(e);
        }
        
        //参考になりそう (A replacement for the "prompt" function)：https://lipis.github.io/bootstrap-sweetalert/
        //Question. okボタンがどこで生成されているか分からない…
        swalPromptOptionForUserNameProp = { //ユーザーネーム入力フォーム．プロンプト機能付きアラート．
            title: 'ユーザ名を入力してください...', //文字通りタイトル
            type: 'input', //入力タイプなんだろうけど…．//Question. 公式に書いてないけど違うページには書いてある…納得いかない…．
            inputValue: defaultUserName, //Question. ネットで調べるとだいたい関数で書かれているんだけど，なぜオブジェクト…？
            //↓Question. showCancelButtonとcloseOnConfirmはなんで書いているのか…あ，そういう型なのか…？
            showCancelButton: false, //キャンセルボタンを表示するか否か．trueは表示，falseは非表示
            closeOnConfirm: false, // これを true にすると practiceDayChecker が呼び出されなくなる!!! //Question. これはなんなんだろう…
            animation: 'slide-from-top', //アラートの現れ方．上からスライドされて出て来る．
            inputPlaceholder: 'ここにユーザ名を入力' //プレースホルダ：とりあえず入れておく仮の情報のこと．ex. フォーム入力欄にあらかじめ記入されている薄い灰色のテキスト．          
        };
        
        userNameSetter = function(userNameUNS){

            if(userNameUNS == '' || userNameUNS == null || userNameUNS == undefined){//ユーザーネームを記入せずokを押したとき
                swal.showInputError('ユーザ名は必須です!');
            }else{//
                globalMemCPSCIDA.chunkDataObj.userName = userNameUNS;
                // 何度もユーザ名を入力しなくても済むよう，localStorage にユーザネームを登録．
                // localStrage はブラウザのバージョンによっては実装されていないので念のため try - catch する. 
                try{
                    localStorage.setItem('chunkPianoSystem_userName', userNameUNS);
                }catch(e){
                    console.log(e);
                }
                swal.close();
            }
        };
        
        //Question. 関数の実行みたいな立ち位置な気がするけど，swalPromptOptionForUserNamePropは関数ではなくない？という謎．
        swal(swalPromptOptionForUserNameProp, userNameSetter);   
                
        // 演奏位置初期化処理
        // noteLinePosition を受け取ってから処理をしなければならないため，
        // callback を利用し サーバから noteLinePosition を受け取ってから下記の処理を行う．
        // todo: 実行順序の管理が大変になってきた... スマートな解決策はないか? 
        globalMemCPSCIDA.reqNoteLinePosition(function(){      
            globalMemCPSCIDA.nowNoteRowCount = 0;//多分現在の音符番号を初期化
            setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[0].axisX, //多分現在の演奏音（現在のインジケータの位置にある音符）のx軸？
                            globalMemCPSCIDA.noteLinePosition.noteLine[0].axisY //多分現在の演奏音のy軸？
                           )
            ;    
        });        
        
        //Question. 関数の中に関数が入っているよく分からんやつ．swalはおおよそ大丈夫
        saveConfirmModalWindow = function(callback){//保存ウィンドウ 動作①
            swal({ //動作②
                title: '変更を保存しますか?',
                type: 'info',
                showCancelButton: true,
                confirmButtonColor: '#26642d',
                confirmButtonText: '保存する',
                cancelButtonColor: '#7c0c0c',
                cancelButtonText: '保存しない',
                closeOnConfirm: false,
                closeOnCancel: false
            }, function (isConfirm){ // 保存する をクリックした場合　動作③
                if(isConfirm){
                    // saveChunkButton をクリックすれば．保存モードに移行できる．
                    globalMemCPSCIDA.isFromLoadChunkButton = true;
                    saveChunkButton.click(); 
                }else{            
                    globalMemCPSCIDA.turnNotEditedMode();
                    // 保存しない をユーザが選択した場合は，意図的に編集モードを未編集に変更し，
                    // loadChunkButton click イベントを再度呼び出す．
                    if(callback) callback();
                }
            });
        };
        
        // Chunk 描画処理．mousedown 時に描画開始位置を取得し，mouseup 時に描画終了位置を取得する．
        globalMemCPSCIDA.chunkDrawingArea.mousedown(function(e){
            chunkDrawingAreaMouseDowmPosX = parseInt(e.offsetX, 10);
            chunkDrawingAreaMouseDowmPosY = parseInt(e.offsetY, 10);
            isChunkDrawing = true;
        });
        
        globalMemCPSCIDA.chunkDrawingArea.mouseup(function(e){

            if(isChunkDrawing){
                var chunkSizeX = 0,
                    chunkSizeY = 0,
                    chunkProperties = {}
                ;        

                chunkSizeX = parseInt(e.offsetX, 10) - chunkDrawingAreaMouseDowmPosX;
                chunkSizeY = parseInt(e.offsetY, 10) - chunkDrawingAreaMouseDowmPosY;

                // todo: globalMemCPSDDR.chunkDataObj.chunkData[chunkDomId] (domrenderer), chunkPropaties (init) など，
                //       同じ情報もしくはその拡張を複数箇所で定義しており，バグを生みやすい状況にある．
                //       object の ファクトリ関数を定義し，最初から全てのプロパティを定義し，サブクラスでプロパティを拡張しないようにする．
                //       現状ではオブジェクトプロパティを確認するにはプログラムを実行する必要があり，メンテナンス性が低い!!!
                chunkProperties = {
                    left       : chunkDrawingAreaMouseDowmPosX,
                    top        : chunkDrawingAreaMouseDowmPosY,
                    width      : chunkSizeX,
                    height     : chunkSizeY,
                    groupMode  : globalMemCPSCIDA.groupMode,
                    parentChunk: null
                };

                domRenderer.createChunkDom(chunkProperties);

                globalMemCPSCIDA.isEditedByNewChunk = true;
                isChunkDrawing = false;
            }
        });    
        
        saveChunkButton.click(function(mode){

            if(Object.keys(globalMemCPSCIDA.chunkDataObj.chunkData).length == 0){ // chunk が一つも描画されていない時は保存処理を行わない．
                swal('保存するにはグループを\n1つ以上記入してください!', '', 'warning');
            }else{
                var practiceDayChecker, swalPromptOptionForPracDayProp; 

                practiceDayChecker = function(practiceDay){

                    if(practiceDay == 0 || practiceDay == undefined || practiceDay == null){                        
                        swal.showInputError('半角数字で練習日を入力してください．');
                    }else{
                        // 001 のように不要な 0 が含まれている数値から 0 を除去
                        practiceDay += String();
                        practiceDay.replace(new RegExp('^0+'),'');
                        practiceDay = parseInt(practiceDay, 10);
                        practiceDay += String();

                        // todo: 半角英数字 + 大文字でも処理を通過するバグを修正
                        if(practiceDay.match(/^[0-9]+$/)){ // 練習日数の入力が正しい，つまり入力値が半角数字の時
                            // todo: 既に存在しているファイル名の際に，上書きするか確認. 
                            // todo: ファイルネームにメタデータをパース可能な状態で付与しているので，この処理は意味がないかもしれない．
                            globalMemCPSCIDA.chunkDataObj.practiceDay = practiceDay;
                            globalMemCPSCIDA.socketIo.emit('chunkSaveReq', {chunkDataObj:globalMemCPSCIDA.chunkDataObj});                            
                        }else{
                            swal.showInputError('半角数字で練習日を入力してください．');
                        }
                    }
                };

                swalPromptOptionForPracDayProp = {
                    title: '今日は何日目の練習日ですか?',
                    type: 'input',
                    showCancelButton: true,
                    closeOnConfirm: false, // これを true にすると practiceDayChecker が呼び出されなくなる!!!
                    animation: 'slide-from-top',
                    inputPlaceholder: '半角数字で練習日を入力してください．'                    
                };

                swal(swalPromptOptionForPracDayProp, practiceDayChecker);                
            }
        });
        
        rejectChunkPracticeMode = function(){
            swal('グループで頭出しするには\nグループを1つ以上記入する\n必要があります...', '', 'warning');
            globalMemCPSCIDA.practicePointMode = 'notePosition';
            practicePointModeSelector.val('notePosition');
            globalMemCPSCIDA.nowNoteRowCount = 0;
            setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisX, 
                            globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisY
                           )
            ;  
        };        
                
        practicePointModeSelector.change(function(){
            
            //Question. 初期値で指定しているのにわざわざここでもう1回書く意味が分からない
            globalMemCPSCIDA.practicePointMode = $('#practicePointModeSelector option:selected').val();
            
            if(globalMemCPSCIDA.practicePointMode == 'chunk'){
                if(globalMemCPSCIDA.chunkHeadLinePositions.length == 0){
                    rejectChunkPracticeMode();
                }else{                    
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[0];
                    setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.chunkHeadLinePositions[0]].axisX, 
                                    globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.chunkHeadLinePositions[0]].axisY
                                   )
                    ;  
                    
                }
            }else if(globalMemCPSCIDA.practicePointMode == 'notePosition'){
                globalMemCPSCIDA.nowNoteRowCount = 0;
                setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[0].axisX, 
                                globalMemCPSCIDA.noteLinePosition.noteLine[0].axisY
                               )
                ;  
            }
        });
        
        groupModeSelector.change(function(){ 
            globalMemCPSCIDA.groupMode = $('#groupModeSelector option:selected').val();
        });

        groupDisplayModeSelector.change(function(){ //グループごとに表示  //.change(): セレクターなどから任意の項目を選択したときに何らかのイベント処理を自動的に実行 (https://www.sejuku.net/blog/41231) //Question. これを書いてどうなのかあまり想像つかない     
            globalMemCPSCIDA.groupDisplayMode = $('#groupDisplayModeSelector option:selected').val(); // all, score, performance, KnowledgeApplicationのいずれかを代入 //.val(): HTML内のvalue属性を取得・変更できる
            globalMemCPSCIDA.chunkHeadLinePositions = domRenderer.getSortedChunkHeadLine(globalMemCPSCIDA.chunkDataObj.chunkData);//被験者が保存したグループデータを代入
            
            if(globalMemCPSCIDA.groupDisplayMode === 'all') {//全て表示の場合 
                $('.chunk').css({'display':'block'});//cssの.chunk部分をブロックで表示 (https://www.sejuku.net/blog/52636)
            } else {
                $('.chunk').css({'display':'none'});//特定の要素が非表示になる (https://www.clrmemory.com/web/display-visibility-distinguish)
                $('.chunk.' + globalMemCPSCIDA.groupDisplayMode).css({'display':'block'});
            } 
        });
        
        leftPositionButton.click(function(){
            
            var isRejectChunkPractice = false;
            
            if(globalMemCPSCIDA.practicePointMode == 'notePosition'){

                chunkHeadLinePositionsNowIndex = 0;

                if(globalMemCPSCIDA.nowNoteRowCount == 0){
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.noteLinePosition.noteLine.length - 1;
                }else{
                    globalMemCPSCIDA.nowNoteRowCount -= 1;                
                }          
            }else if(globalMemCPSCIDA.practicePointMode == 'chunk'){
                
                var isChunkExists = globalMemCPSCIDA.chunkHeadLinePositions.length > 0;

                if(!isChunkExists){
                    rejectChunkPracticeMode();
                    isRejectChunkPractice = true;
                // グループの頭出し位置が既に先頭要素を指している場合に「←」が押下された場合は、頭出し位置を末尾要素にする。
                }else if(chunkHeadLinePositionsNowIndex === 0){
                    chunkHeadLinePositionsNowIndex = globalMemCPSCIDA.chunkHeadLinePositions.length - 1;
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[chunkHeadLinePositionsNowIndex];
                }else{
                    chunkHeadLinePositionsNowIndex--;
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[chunkHeadLinePositionsNowIndex];
                }                

            }
            
            if(!isRejectChunkPractice){
                setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisX, 
                                globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisY
                               )
                ; 
            }
        });
                
        rightPositionButton.click(function(){
            
            var isRejectChunkPractice = false;
            
            if(globalMemCPSCIDA.practicePointMode == 'notePosition'){
            
                chunkHeadLinePositionsNowIndex = 0;
    
                if(globalMemCPSCIDA.nowNoteRowCount == globalMemCPSCIDA.noteLinePosition.noteLine.length - 1){
                    globalMemCPSCIDA.nowNoteRowCount = 0;
                }else{
                    globalMemCPSCIDA.nowNoteRowCount += 1;                
                }
            }else if(globalMemCPSCIDA.practicePointMode == 'chunk'){
           
                var isChunkExists = globalMemCPSCIDA.chunkHeadLinePositions.length > 0;

                if(!isChunkExists){
                    rejectChunkPracticeMode();
                    isRejectChunkPractice = true;
                // グループの頭出し位置が既に末尾要素を指している場合に「→」が押下された場合は、頭出し位置を先頭要素にする。
                }else if(chunkHeadLinePositionsNowIndex === globalMemCPSCIDA.chunkHeadLinePositions.length - 1){
                    chunkHeadLinePositionsNowIndex = 0;
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[0];
                }else{
                    chunkHeadLinePositionsNowIndex++;
                    globalMemCPSCIDA.nowNoteRowCount = globalMemCPSCIDA.chunkHeadLinePositions[chunkHeadLinePositionsNowIndex];
                }                
            }
            
            if(!isRejectChunkPractice){
                setPlayPosition(globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisX, 
                                globalMemCPSCIDA.noteLinePosition.noteLine[globalMemCPSCIDA.nowNoteRowCount].axisY
                               )
                ;  
            }
        });
        
        loadChunkButton.click(function(){
            // todo: data で userName をサーバに渡し，その userName のファイルだけを req するようにする．
            // ここではサーバに保存されている ChunkPianoData 名のリストをリクエストしているだけ．
            // リストがレスポンスされた際の処理は globalMemCPSCIDA.socketIo.on の 'chunkFileNameList' 
            // !!!! 保存データの描画処理は globalMemCPSCIDA.socketIo.on の reqestedChunkData に記述されている !!!!

            // chank が編集された際の処理
            // 編集の定義... chank が動かされた，削除された，記入された とき．
            if(globalMemCPSCIDA.isEditedByChunkMovingOrDelete || globalMemCPSCIDA.isEditedByNewChunk){ 
                saveConfirmModalWindow(function(){
                    loadChunkButton.click();
                });
            }else{
                globalMemCPSCIDA.socketIo.emit('chunkFileNameReq',{});
            }
        });
                
    };
    
    setPlayPosition = function(left, top){
        var playPositionHeight = parseInt(playPosition.css('height'), 10),
            playPositionWidth = parseInt(playPosition.css('width'), 10)
        ;
        
        playPosition.css({
            'top' : (top  - (playPositionHeight / 2)),
            'left': (left - (playPositionWidth  / 2))
        });
    };

    (function constructor () {
        init();
    })();

};