(function(){
 var recorder=null;
 var tabid=-1;
 chrome.runtime.onMessage.addListener(function(req,sender,cb){
   /*********** 最後に操作したタブ。後勝ちで１つだけ有効 ************/
   if(  tabid != sender.tab.id ){
       if( tabid >= 0 ){
           chrome.tabs.get( tabid,function(tab){ if(tab) chrome.pageAction.hide( tab.id ); } );
       }
       tabid=sender.tab.id;
       chrome.pageAction.show( tabid );
   }
   /*********** 有効化(なにもしない) ************/
   if( req.msgid == "online" ){
      cb(true);
   /*********** スクショ保存依頼。PrintScreenキー固定 ************/
   }else if( req.msgid == "printscreen" ){
      var d=new Date();
      var obj=document.getElementById("dl");
      obj.href=req.url;
      obj.download="aigis_"+(d.getFullYear()*10000000000+(d.getMonth()+1)*100000000+d.getDate()+1000000+d.getHours()*10000+d.getMinutes()*100+d.getSeconds() )+".png"
      obj.click();
      cb("fin");
      setTimeout( function(){ window.URL.revokeObjectURL(req.url); } , 1000 );
   /*********** 録画保存依頼。 ************/
   }else if( req.msgid == "recseg" ){
      var d=new Date();
      var obj=document.getElementById("dl");
      obj.href=req.url;
      obj.download="aigis_"+(d.getFullYear()*10000000000+(d.getMonth()+1)*100000000+d.getDate()+1000000+d.getHours()*10000+d.getMinutes()*100+d.getSeconds() )+".mov"
      obj.click();
      cb("fin");
      setTimeout( function(){ window.URL.revokeObjectURL(req.url); } , 1000 );
   }else{
      cb(0);
   }
 });

 chrome.pageAction.onClicked.addListener(function(ev){
    if( recorder ){
        chrome.tabs.sendMessage(tabid,{"msgid":"stop"},function(res){
            chrome.pageAction.setIcon( {
                "tabId": tabid,
                "path":{
                    "128": "icons/icon128.png",
                    "16":  "icons/icon16.png",
                    "48":  "icons/icon48.png"
                }
            },function(){ recorder=null; });
        });
    }else{
        chrome.tabs.sendMessage(tabid,{"msgid":"record"},function(res){
            chrome.pageAction.setIcon( {
                "tabId": tabid,
                "path":{
                    "128": "icons/gobuw128.png",
                    "16":  "icons/gobuw16.png",
                    "48":  "icons/gobuw48.png"
                }
            },function(){ recorder=1; });
        });
    }
/*
    chrome.tabs.sendMessage(tabid,{"msgid":"getimage"},function(res){
         if( res ){
           var obj=document.getElementById("dl");
           obj.href=res;
           obj.click();
         }
    });
*/
 });

})();
