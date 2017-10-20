// ==UserScript==
// @name         Notes helper
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Bring customer notes to the SLA monitor page
// @author       Pushpraj
// @match        https://support.sitecore.net/dashboard/Pages/SLAmonitor.aspx*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //style injector
    $.customStyle={
        stylesheet:null,
        insertRule:function(selector,rules)
        {
            if(!this.stylesheet){
                var context = document,stylesheet;
                context.getElementsByTagName('head')[0].appendChild(context.createElement('style'));
                this.stylesheet=context.styleSheets[context.styleSheets.length-1];
            }
            for(var i=0;i<selector.length;++i){
                this.stylesheet.addRule(selector[i], rules);
            }
        }
    };

    //styles
    $.customStyle.insertRule([".popup"], 'position: relative; display: inline-block; cursor: pointer; user-select: none; float:right;color:red;');
    $.customStyle.insertRule([".popup .popupContent::after"], 'content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #555 transparent transparent transparent;');
    $.customStyle.insertRule([".popup:hover .popupContent"], 'visibility: visible; -webkit-animation: fadeIn .5s; animation: fadeIn .5s;');

    $.customStyle.insertRule([".popupContent"], ' box-shadow: 0px 0px 20px 5px rgba(0,0,0,.5); user-select: initial; cursor: initial; visibility: hidden;  color:initial;   border-radius: 4px;  padding: 2px; background-color: #555;  min-width:3400%; left:-2000%;  position: absolute; z-index: 10000; bottom: 130%;');
    $.customStyle.insertRule([".popupContent .cellstyle td"], 'background-color: #ffffb8; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(204, 204, 204); line-height: normal;');
    $.customStyle.insertRule([".popupContent > .box"], 'margin-bottom:auto !important;');
    $.customStyle.insertRule([".popupContent table"], 'width:100%;');

    $.customStyle.insertRule([".loadingNotes"], 'color:red;float:right;');

    $.customStyle.insertRule(["@-webkit-keyframes fadeIn", "@keyframes fadeIn"],'from {opacity: 0;} to {opacity: 1;}');

    $.customStyle.insertRule(["#container > div"],'overflow:initial !important;');

    //placeholders
    var popupPre = "<div class='popup'>Notes!<div class='popupContent'>";
    var popupPost = "</div></div>";

    //functions
    var injectNotes = function(accountUrl, note){
        //remove prefix url, cause issue with matching
        if(accountUrl.startsWith("https://support.sitecore.net")){
            accountUrl = accountUrl.slice(28);
        }

        //find matching nodes and inject the notes for account
        $("div[style='background: #F3E6A9;'] > a[href='"+accountUrl+"'] > .loadingNotes").remove();
        $.each($("div[style='background: #F3E6A9;'] > a[href='"+accountUrl+"']"),function( index, value ){
            var noteLink = $(popupPre + note + popupPost);
            $(value).parent().append(noteLink);
        });
    };

    //get account urls
    var accountUrls = [];
    $.each($("div[style='background: #F3E6A9;'] > a"), function( index, value ) {
        accountUrls.push(value.href);
        $(value).append("<div class='tooltipHover loadingNotes'>...</div>");
    });

    //fetch notes info for each unique account
    $.each($.unique(accountUrls) ,function( index, url ) {
        var itemKey = "notes_" + url;

        //check if we already have notes
        var note = sessionStorage.getItem(itemKey);
        if(note){
            injectNotes(url, note);
            return;
        }
        //get from the url
        $.get(url, function(data){
            //get notes block from the page
            data = $(data).find("#ctl00_body_gvAccountNotes_divBlock")[0];
            if(!data){
                return;
            }
            //filter out "Suggested to assign..." Auto-generated notes
            var notesData = data.outerHTML.replace(/<tr>[\r\n\s<>\std]*<a[^<]*<\/a>[\r\n\s]*<\/td><td>Suggested(?:.|\n)*?<\/tr>/g,"");
            sessionStorage.setItem(itemKey, notesData );
            injectNotes(url, notesData);
        });
    });
})();
