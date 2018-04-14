
window.focus();
setTimeout(function(){
     window.addEventListener("keyup",function(ev){
         if( ev.keyCode == 44 ){
             document.getElementsByTagName("CANVAS")[0].toBlob(function(blob){
                 chrome.runtime.sendMessage( {"msgid":"printscreen","url":window.URL.createObjectURL(blob)} );
             });
         }
     });
},0);

