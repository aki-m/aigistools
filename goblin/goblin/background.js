var recorder  = null;
var rec_state = 0;
var tab_id    = -1;
var captureStream=null;
var loopback_audio_element = null;
var loopback_audio_stream  = null;

 chrome.runtime.onMessage.addListener(function(req,sender,cb){
   /*********** 最後に操作したタブ。後勝ちで１つだけ有効 ************/
   if(  tab_id != sender.tab.id ){
       if( rec_state == 1 && req.msgid == "rec" ) return; //２画面録画はダメ
       tab_id = sender.tab.id;
       chrome.pageAction.show( tab_id );
   }
   /*********** 有効化(なにもしない) ************/
   if( req.msgid == "online" ){
      chrome.tabs.sendMessage(tab_id, {"msgid":"loadack"} ); //ここでtabsを触っておかないとtabsが見えなくなることがある
   /*********** スクショ保存依頼。PrintScreenキー固定 ************/
   }else if( req.msgid == "printscreen" ){
/*
      var d = new Date();
      var dl_element = document.getElementById("dl");
      dl_element.href = ;
      dl_element.download = "aigis_"+(d.getFullYear()*10000000000+(d.getMonth()+1)*100000000+d.getDate()+1000000+d.getHours()*10000+d.getMinutes()*100+d.getSeconds() )+".png"
      dl_element.click();
*/
      var d = new Date();
      chrome.downloads.download( {
          "url":req.url,
          "filename":"aigis_"+(d.getFullYear()*10000000000+(d.getMonth()+1)*100000000+d.getDate()+1000000+d.getHours()*10000+d.getMinutes()*100+d.getSeconds() )+".png"
      }, function(id){ URL.revokeObjectURL(req.url); });
   /*********** 録画保存依頼。 ************/
   }else if( req.msgid == "rec" ){
      if( rec_state == 1 ) stopRec()
      else if( rec_state == 0 ) startRec();
   /*********** リサイズされた。 ************/
   }else if( req.msgid == "resize" ){
       chrome.windows.getCurrent( null, function(w){
           if( w.id != sender.tab.windowId ) return; //何故かリサイズしていないバック画面でリサイズイベントが発生する
           var rect=null;
           if( /play\/aigis/.test(   sender.url) ) rect=[ -41, -61 ,960,640];
           if( /play\/oshirore/.test(sender.url) ) rect=[  -3, -61,1280,720];
           if( /play\/kamipror/.test(sender.url) ) rect=[-150, -89, 960,640];
           if( /play\/kanpani/.test( sender.url) ) rect=[ -41, -61, 960,590];
           if( /play\/flower/.test(  sender.url) ) rect=[ -43, -60, 960,640];
           if( /app_id=854854/.test( sender.url) ) rect=[ -124,-77, 800,480];
           if( ! rect ) return;
           if( w.state == "normal" ){
                   chrome.tabs.setZoom(tab_id,1.0);//-60,0,1280,720
                   if( req.w != rect[2] || req.h != rect[3] || req.init ){
                       chrome.windows.update( sender.tab.windowId , {
                           "width": (req.w && w.width )?(w.width +rect[2]-req.w/1.0):rect[2],
                           "height":(req.h && w.height)?(w.height+rect[3]-req.h/1.0):rect[3]
                       } );
                       chrome.tabs.sendMessage(tab_id, {"msgid":"setstyle","body":{"left":rect[0]+"px","top":rect[1]+"px" }} );
                   }
          }else if( w.state == "maximized" || w.state == "fullscreen" ){
              if( w.width/1.0/rect[2] > w.height/1.0/rect[3] ){
                  var zm=w.height/1.0/rect[3];
                  chrome.tabs.setZoom( tab_id , zm );
                  var n=(w.width/zm - rect[2])/2+rect[0];
                  chrome.tabs.sendMessage(tab_id, {"msgid":"setstyle","body":{"left":n+"px","top":rect[1]+"px" }} );
              }else{
                  var zm=w.width/1.0/rect[2];
                  chrome.tabs.setZoom(tab_id, zm );
                  //var n=(w.height/zm - rect[3])/2+rect[1];
                  chrome.tabs.sendMessage(tab_id, {"msgid":"setstyle","body":{"left":rect[0]+"px","top":rect[1]+"px" }} );
              }
          }
       });
   }else{
      cb(0);
   }
 });


var dl_id1=-1;
var dl_id2=-1;
chrome.downloads.onChanged.addListener( function(e){
    var dl2url=null;
    if( ! e.state || e.state.current != "complete" ) return;
    if( e.id == dl_id1 ){
        dl_id1 = -1;
        chrome.downloads.search({"id":e.id},function(e2){
            if( e2.length < 1 ) return;
            if( e2[0].url) window.URL.revokeObjectURL(e2[0].url); 
            var fn="%USERPROFILE%\\Downloads\\"+e2[0].filename.match("aigis_[0-9]*.mov$")[0].slice(0,-3)
            var data=new Blob(["ffmpeg.exe -i "+fn+"mov -c:v h264 -r 29.97 -c:a aac "+fn+"mp4"],{"type":"text/plain"});
            dl2url = window.URL.createObjectURL(data);
            chrome.downloads.download( {
                "url":dl2url,
                "filename":"encode.bat"
            }, function(id){ dl_id2=id; });
        });
    }else if( e.id == dl_id2 ){
        dl_id2 = -1;
        if( dl2url){ window.URL.revokeObjectURL(dl2url); dl2url=null; }
        chrome.downloads.open(e.id);
    }
});
var saveMedia=function(ev){
    var d = new Date();
    var fn = "aigis_"+(d.getFullYear()*10000000000+(d.getMonth()+1)*100000000+d.getDate()+1000000+d.getHours()*10000+d.getMinutes()*100+d.getSeconds() )+".mov";
    var url = window.URL.createObjectURL(ev.data);
    chrome.downloads.download( {
        "url":url,
        "filename":fn
    }, function(id){ dl_id1=id; });
};

 /******************* 開始ボタン ***************************/
 var startRec=function(){
     var i,trks,r;
     chrome.tabCapture.getCapturedTabs( function(info){
         for( var i=0 ; i<info.length ; i++) for( var j in info[i] ) console.log("capInfo "+i+": "+j+" = "+info[i][j] );
     });
     if( ! recorder ){
            chrome.tabs.get(tab_id,function(tab){
                chrome.tabCapture.capture(
                    { "video":true , 
                      "audio":true ,
                      "videoConstraints":{ 
                        "mandatory":{
                           "chromeMediaSource": "desktop", 
                           "minWidth":    tab.width,
                           "maxWidth":    tab.width,
                           "minHeight":   tab.height,
                           "maxHeight":   tab.height,
                           "minFrameRate":   29,
                           "maxFrameRate":   30
                    }}},function(stream){
                        var atrks = stream.getAudioTracks();
                        console.log("cap-stream a:"+atrks.length+" v:"+stream.getVideoTracks().length );
                        if( atrks.length < 1 ){ setTimeout( startRec,100); return ; }
                        captureStream = stream;
                        recorder = new MediaRecorder(stream,{"mimeType":'video/webm; codecs="vp9, opus"'} );
                        recorder.ondataavailable = saveMedia;
                        loopback_audio_stream=new MediaStream();
                        atrks.forEach( function(s){ loopback_audio_stream.addTrack(s); } );
                        loopback_audio_element = document.getElementById("a");
                        //loopback_audio_element.src = window.URL.createObjectURL(loopback_audio_stream);
                        loopback_audio_element.srcObject = loopback_audio_stream;
                        loopback_audio_element.play();
                        setTimeout(startRec,1000);
                        return; //tab-capture-cb
                    }
                );
                return; //tab.get-cb
            });
            return; //tabCapture CB待ち
     }
     if( recorder && rec_state == 0 ){
        chrome.pageAction.setIcon( {
                "tabId": tab_id,
                "path":{
                    "128": "icons/gobuw128.png",
                    "16":  "icons/gobuw16.png",
                    "48":  "icons/gobuw48.png"
                }
        });
        rec_state=1; //recording
        recorder.start();
     }
 };

 /******************* 終了ボタン ***************************/
 var stopRec=function(){
        chrome.pageAction.setIcon( {
                "tabId": tab_id,
                "path":{
                    "128": "icons/icon128.png",
                    "16":  "icons/icon16.png",
                    "48":  "icons/icon48.png"
                }
        });
        rec_state=0;
        recorder.stop();
 }

 chrome.pageAction.onClicked.addListener(function(ev){
    if( rec_state == 1 ) stopRec()
    else if( rec_state == 0 ) startRec();
 });

 chrome.commands.onCommand.addListener( function(cmd){
     if(tab_id > 0 && cmd == "toggle_capture"){
       if( rec_state == 1 ) stopRec()
       else if( rec_state == 0 ) startRec();
     }
 });
