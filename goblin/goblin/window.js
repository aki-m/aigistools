var timer = false;
var timeout=200;
var fit=function(e){
    if(timer){
        clearTimeout(timer);
        if( timeout < 2000 ) timeout += 200;
    }else{
        timeout=200;
    }
    timer = setTimeout( function(){
        timer=null;
        document.body.style['position'] = 'fixed';
        chrome.runtime.sendMessage({"msgid":"resize",
          "w":""+document.documentElement.clientWidth,"h":""+document.documentElement.clientHeight,
          "rect":document.getElementById("game_frame").getBoundingClientRect(),
          "init":e.init
        });
    },timeout);
};

chrome.runtime.onMessage.addListener(function(req,sender,cb){
    switch( req.msgid ){
        case "loadack":  fit({"init":true}); break;
        case "setstyle": for( var i in req.body ) document.body.style[i]= req.body[i]; break;
    }
});

window.addEventListener("resize",fit );

window.focus();
setTimeout(function(){
     window.addEventListener("keyup",function(ev){
         if( ev.keyCode == 19 ) chrome.runtime.sendMessage( {"msgid":"rec"} );
     });
},0);


chrome.runtime.sendMessage( {"msgid":"online"} );

