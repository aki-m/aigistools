(function(){
 var canvas=null;
 var capstream=null;
 var recorder=null;


 chrome.runtime.onMessage.addListener(function(req,sender,cb){
   if( req.msgid == "getimage" && canvas ){
     canvas.toBlob(function(blob){
       var url=window.URL.createObjectURL(blob);
       cb(url);
     });
     return true;
   }else if( req.msgid == "record" && canvas ){
     if( ! capstream ) capstream = canvas.captureStream(30);
     if( ! recorder ){
         recorder = new MediaRecorder(capstream);
         recorder.ondataavailable = function(e){
            chrome.runtime.sendMessage( {"msgid":"recseg","url":window.URL.createObjectURL(e.data)} );
         }
     }
     recorder.start();
     cb( true );
   }else if( req.msgid == "stop" && canvas ){
     recorder.stop();
   }else{
     cb(0);
   }
 });

             window.focus();
             setTimeout(function(){
                 window.addEventListener("keyup",function(ev){
                     if( ev.keyCode == 44 ){
                         canvas.toBlob(function(blob){
                             chrome.runtime.sendMessage( {"msgid":"printscreen","url":window.URL.createObjectURL(blob)} );
                         });
                     }else if( ev.keyCode == 19 ){
                     }
                 });
             },0);

 var init=function(){
     if( ! canvas ){
         var objs = document.getElementsByTagName("CANVAS");
         if( objs == null || objs.length < 1 ){ setTimeout(init,1000); return; }
         canvas=objs[0];

         //setTimeout(function(){
         //},5000);

     }
     chrome.runtime.sendMessage( {"msgid":"online"},function(res){
         if( ! res ){
             setTimeout(init,1000);
         }else{


         }
    });
 }

 init();

})();

