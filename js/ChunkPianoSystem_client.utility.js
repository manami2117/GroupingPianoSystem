ChunkPianoSystem_client.utility = function(){
    'use strict'
    
    
    var appendDruggAndDropEvent, removeDruggAndDropEvent, getElementPosition;
    
     
    appendDruggAndDropEvent = function(elementADADE, parentElement){

        var draggableArea = parentElement,
            elementMouseOffsetX, elementMouseOffsetY,
            isOnMouse = false
        ;
        
          
        elementADADE.mousedown(function(){
            
            var elementPosition;

            isOnMouse = true; 
            
            elementPosition = getElementPosition(elementADADE);
            
            elementMouseOffsetX = event.pageX - elementPosition.offsetLeft;
            elementMouseOffsetY = event.pageY - elementPosition.offsetTop;            
        })
        
                
        draggableArea.mousemove(function(){
            if(isOnMouse){
                elementADADE.css({'left':event.pageX - elementMouseOffsetX,
                                   'top':event.pageY - elementMouseOffsetY
                                  });
            }
        });
        
        
        draggableArea.mouseup(function(){
            isOnMouse = false;
        });
        
    };
    
    // private. 引数... 適用するエレメント
    removeDruggAndDropEvent = function(elementADADE){
        
        try{            
            elementADADE
                .unbind('mousedown')
                .unbind('mouseup')
            ;
            
        }catch(e){
        }
        
    };
    
     
    getElementPosition = function(elementGEO){
        
        var offset = elementGEO.offset(),
            position = elementGEO.position(),
            elementProp = {
                offsetTop:null,
                offsetLeft:null,
                positionTop:null,
                positionLeft:null,
                width:null,
                height:null
            }
        ;
        
        elementProp.offsetTop = offset.top;
        elementProp.offsetLeft = offset.left;
        elementProp.offsetTop = position.top,
        elementProp.offsetLeft = position.left,
        elementProp.width = elementGEO.width(),
        elementProp.height = elementGEO.height();
        
        return elementProp;
    };
    
     
    return {appendDruggAndDropEvent:appendDruggAndDropEvent, 
            removeDruggAndDropEvent:appendDruggAndDropEvent,
            getElementPosition:getElementPosition
           }
    ;
};