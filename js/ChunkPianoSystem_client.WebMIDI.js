// WebMidi 実装参考ページ: http://qiita.com/tadfmac/items/e26fdf1034ad6dad4504

ChunkPianoSystem_client.WebMIDI = function(globalMem){
    
    'use strict';
    
    var constructor, midiDataObjFactory, keyNumberConverter, reverseKeyCodeConverter, isSameTimeMidiNoteOn,
        getSameTimeMidiDatakeyCodes, onMIDISuccess, onMIDIFailure, onMidiMessage, onMidiData, onSameTimeMidiData, sendMIDINoteOn, isNoteOn, 
        onMidiDataCallBack       = null, // midi の note on / off ごとに実行したい処理はこの変数に callback 関数を代入．
        sameTimeMidiDataCallBack = null, // 同時打鍵 / 単音を識別した上で　               ;;
        inputs                   = [],
        outputs                  = [],
        sameTimeMidiData         = [],   // 直近で同時に入力された midi データのスタック．先頭要素は同時打鍵とみなした音の内，一番最初に打鍵された midiData.
                                         // システム起動時には，スタックの先頭に1番目の midiData が和音か否かを
                                         // 判定するための midiData (midiDataObjFactory のテンプレート) が格納されている．
        SAME_TIME_MIDI_IOI       = 50,   // IOIが 代入値以下の場合は同時の打鍵とみなす．
        inputPort           = $('#inputPort'),
        outputPort          = $('#outputPort')
    ;
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    midiDataObjFactory = function(){
        return {
            receivedTime: 0,
            noteNumber  : 0,
            keyCode     : null,
            velocity    : 0,
            timeStamp   : 0,
            isNodeOn    : false
        };
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // MIDI key code を note name に変更.
    keyNumberConverter = function(keyNumber){ // keyNumber には midi の key code が格納されている．
        
        var keyNumberPert01 = keyNumber % 12,
            keyNumberPert02 = parseInt(keyNumber / 12)
        ;
        
        switch(keyNumberPert01){
            case 0:
                return 'C' + keyNumberPert02;
                break;
            case 1:
                return 'C#' + keyNumberPert02;
                break;
            case 2:
                return 'D' + keyNumberPert02;
                break;
            case 3:
                return 'D#' + keyNumberPert02;
                break;
            case 4:
                return 'E' + keyNumberPert02;
                break;
            case 5:
                return 'F' + keyNumberPert02;
                break;
            case 6:
                return 'F#' + keyNumberPert02;
                break;
            case 7:
                return 'G' + keyNumberPert02;
                break;
            case 8:
                return 'G#' + keyNumberPert02;
                break;
            case 9:
                return 'A' + keyNumberPert02;
                break;
            case 10:
                return 'A#' + keyNumberPert02;
                break;
            case 11:
                return 'B' + keyNumberPert02;
                break;
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////  
    // keyCode を noteNumber に変換．
    reverseKeyCodeConverter = function(keyName){
        
        try{
            var keyNamePert01, keyNamePert02;

            if(keyName == '00') return 0;

            if(keyName.length ==2){
                keyNamePert01 = keyName.substring(0, 1);
                keyNamePert02 = parseInt(keyName.substring(1, 2));
            } else{
                keyNamePert01 = keyName.substring(0, 2);
                keyNamePert02 = parseInt(keyName.substring(2, 3));
            }

            switch(keyNamePert01){
                case 'C':
                    return keyNamePert02 * 12 + 0;
                    break;
                case 'C#':
                    return keyNamePert02 * 12 + 1;
                    break;
                case 'D':
                    return keyNamePert02 * 12 + 2;
                    break;
                case 'D#':
                    return keyNamePert02 * 12 + 3;
                    break;
                case 'E':
                    return keyNamePert02 * 12 + 4;
                    break;
                case 'F':
                    return keyNamePert02 * 12 + 5;
                    break;
                case 'F#':
                    return keyNamePert02 * 12 + 6;
                    break;
                case 'G':
                    return keyNamePert02 * 12 + 7;
                    break;
                case 'G#':
                    return keyNamePert02 * 12 + 8;
                    break;
                case 'A':
                    return keyNamePert02 * 12 + 9;
                    break;
                case 'A#':
                    return keyNamePert02 * 12 + 10;
                    break;
                case 'B':
                    return keyNamePert02 * 12 + 11;
                    break;
            }
        }catch(e){
            console.log(e);
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////  
    isNoteOn = function(velocityINO){
        if(velocityINO === 0 || velocityINO === 64){ // note off は midi 機器によって出力が異なるので要注意．
            return false;
        }else{
            return true;
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // 同時打鍵された midiData の keyCode のみを文字列で連結し return する関数．
    getSameTimeMidiDatakeyCodes = function(){
        
        var sameTimeMidiDatakeyCodes = '';
                
        for (var midiDataIdx in sameTimeMidiData){
            sameTimeMidiDatakeyCodes += String() + sameTimeMidiData[midiDataIdx].keyCode + ' ';
        }
        
        return sameTimeMidiDatakeyCodes;
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // 同時打鍵か否かを判定する関数．同時打鍵のスタックの1番目の midiData の timeStamp と，
    // 本関数に入力された midiData の timeStamp の差が SAME_TIME_MIDI_IOI 以下であれば同時打鍵とみなす．
    isSameTimeMidiNoteOn = function(midiDataISTMNO){
        
        // 同時打鍵の検出処理．
        // sameTimeMidiData の1番目の midiData との IOI が閾値よりも短く，かつ note on の場合は同時に打鍵したとみなし，
        // sameTimeMidiData に midiData を詰める．
        if(midiDataISTMNO.isNodeOn && ((midiDataISTMNO.timeStamp - sameTimeMidiData[0].timeStamp) < SAME_TIME_MIDI_IOI)){
            return true;
        // IOI が閾値よりも長く，かつ note on の midiData は同時打鍵が終了した後の第1音目とみなし，firstSameTimeMidiData に格納する．
        }else if(midiDataISTMNO.isNodeOn){                
            return false;
        }else{ // 同時打鍵の検出処理は noteOff 時は行わない．これを識別するために，文字列を return する．
            return 'noteOff';
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    onMidiMessage = function(e){
        
        // midi 信号は 30 msec 程度で note on / off に関係なく出力される．
        // note on または note off の時，e.data.length は 1 でなくなるので，それ以外は条件文で弾く．
        if(e.data.length !== 1){
            
            var midiData = midiDataObjFactory();
            
            midiData.receivedTime = e.receivedTime;
            midiData.noteNumber   = e.data[1];
            midiData.keyCode      = keyNumberConverter(e.data[1]);
            midiData.velocity     = e.data[2];
            midiData.timeStamp    = e.timeStamp;
            midiData.isNodeOn     = isNoteOn(e.data[2]);
                        
            // 同時打鍵の検出と処理の分岐．
            if(isSameTimeMidiNoteOn(midiData) === true){
                sameTimeMidiData.push(midiData);            
            }else if (isSameTimeMidiNoteOn(midiData) === false){                
                
                sameTimeMidiData = [];
                sameTimeMidiData.push(midiData);
                
                // !!! 同時打鍵検出のための重要な処理．
                // note on 時に同時打鍵を検出するため，同時打鍵後の1番目の midiData を検出した際に SAME_TIME_MIDI_IOI msec 後に実行される
                // setTimeout を定義する．
                // こうすることで，同時打鍵後の1番目の midiData から SAME_TIME_MIDI_IOI 以内の IOI で 
                // midiData が検出されなかった場合は sameTimeMidiData は 単音となり，
                //    ;;    　　　された場合は sameTimeMidiData は 同時打鍵の和音となる．
                // システム起動後，1回目の打鍵では isSameTimeMidiNoteOn は必ず false になるので，
                // 以下の setTimeout が実行される．詳細は constructor を参照．
                setTimeout(function(){
                    console.log(getSameTimeMidiDatakeyCodes());
                    if(sameTimeMidiDataCallBack) sameTimeMidiDataCallBack(sameTimeMidiData);
                }, SAME_TIME_MIDI_IOI);
                
            }else if(isSameTimeMidiNoteOn(midiData) === 'noteOff'){
                // noteOff 時は何もしない．
            }
                    
            // chekinputModule は midiData を配列として受け取るので，単音で送る場合も
            // 配列化する．
            if(onMidiDataCallBack) {
                if (midiData.isNodeOn) onMidiDataCallBack([midiData]);
            }
        }
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    sendMIDINoteOn = function(note){
        /*
            if(outputs.length > 0){
                outputs[0].send([0x90,note,0x7f]);
            }
        */
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // MIDI 入出力機器選択リストの作成メソッド．
    onMIDISuccess = function(midi){
        
        // todo: inputPort, outputPort の切り替え操作．
        
        var input     = midi.inputs.values(),
            output    = midi.outputs.values(),
            portCount = 0
        ;

        for(var o = input.next(); !o.done; o = input.next()){

            var inputPortList = $('<option value="' + portCount + '">' + o.value.name + '</option>');

            inputs.push(o.value);
            inputPort.append(inputPortList);
        }
        
        portCount = 0;
        
        for(var o = output.next(); !o.done; o = output.next()){

            var outputPortList = $('<option value="' + portCount + '">' + o.value.name + '</option>');

            outputs.push(o.value);
            outputPort.append(outputPortList);
        }

        for(var cnt = 0; cnt < inputs.length; cnt++){
            inputs[cnt].onmidimessage = onMidiMessage;
        }
        
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////    
    onMIDIFailure = function(msg){
      console.error('onMIDIFailure');
      console.error(msg);
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // 打鍵され midiData が生成された際の callback を設定する．
    onMidiData = function(onMidiDataCallBackC){
        onMidiDataCallBack = onMidiDataCallBackC;
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////  
    // 同時打鍵され midiData が生成された際の callback を設定する．
    onSameTimeMidiData = function(sameTimeMidiDataCallBackC){
        sameTimeMidiDataCallBack = sameTimeMidiDataCallBackC;        
    };
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    (function constructor(){
                
        // 初期化時は midiData が1つも存在せず，IOI を利用した同時打鍵の判定ができない．
        // そのため，テンプレートの midiData を sameTimeMidiData の先頭要素に push する．
        sameTimeMidiData.push(midiDataObjFactory());
        
        try {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        }catch(e){
            swal({
                title: 'WebMIDIに非対応の\nブラウザです．', 
                type : 'warning', 
                timer: 2000, 
                showConfirmButton: false 
            });
            console.error(e);
        }
    })();

    return {onMidiData:onMidiData, onSameTimeMidiData:onSameTimeMidiData, keyNumberConverter:keyNumberConverter, reverseKeyCodeConverter:reverseKeyCodeConverter};
    
};