/* Braije Christophe - Aria controlers May 2018 - http://sharamiz.com/works/2018/aria-control */
/* MODE DEBUG ON */


/* ------------------ content from 'aria.js'  -------------------*/

// -------------------------------------------------
// ARIA-CONTROLER - Braije Christophe Mai 2018
// -------------------------------------------------

(function(win, doc, previous){

  // get nearest parent that fit the selector
  var prev = function(e,s) {
    var a = {};
    for ( ; e && e !== document; e = e.parentNode ) {
      var c = e.querySelectorAll(s);
      if( c.length >= 2 ) {
        a.children = c;
        a.parent = e;
        break;
      }
    };
    return a;
  },

  // TODO - allow multiple configuration
  // trap = function( {
  //    parent    : false,
  //    children  : '[role="tab"]',
  //    keys      : ["esc","up","dow","home","end","right","left"],
  //    loop      : true,
  //    limited   : false
  //    ...
  // }) { ... }

  // trap tabbing keyboard navigation inside an element
  trap = function(elm) {
    var E = elm.querySelectorAll("a[href], input, select, textarea, button"),
        F = E[0],
        L = E[E.length-1];
    F.focus();
    elm.onkeydown = function(e) {
      if ((e.key === 'Tab' || e.keyCode === 9)) {
        if (e.shiftKey) {
          if (doc.activeElement===F) {
            L.focus();
            e.preventDefault();
          }
        }
        else {
          if (doc.activeElement===L) {
            F.focus();
            e.preventDefault();
          }
        }
      }
    };
    return elm;
  },

  // use from dropdown
  reset = function(e){
    var current = e.target || false;
    if (previous && current && previous !== current ) {
      // reset brother if need
      [].forEach.call( previous.from, function(f){
        if( f.get("aria-expanded") === "true" ) {
          f.set("aria-expanded", false);
        }
      });
      // reset target if need
      [].forEach.call( previous.to, function(t){
        if (!t.has("hidden")) {
          t.set("hidden", "");
        }
      });
      previous = false;
    }
  },

  // dropdown is show
  menu = function(elm) {
    if (!this.has("hidden")) {
      previous = elm;
    }
  },

  // modal is show
  dialog = function(elm, toClose){
    if (!toClose && !this.has("hidden")) {
      win.lastFocus = elm;
      doc.body.setAttribute("aria-hidden",true);
      trap(this, true);
      win.lastDialog = this;
    }
    else {
      doc.body.removeAttribute("aria-hidden");
      if(win.lastFocus) {
        win.lastFocus.focus();
        win.lastFocus = false;
      };
      if(win.lastDialog){
        win.lastDialog.set("hidden","");
        win.lastDialog = false;
      };
    }
  },

  // tab is show
  tab = function(elm, init, focus ) {

    var P =  prev(elm,'[role="tab"]');

    [].forEach.call( P.children, function(t,i){

      // init
      if (init) {

        // init tabindex
        t.setAttribute("tabindex", (t.getAttribute("aria-selected")==="true")? 0 : -1);

        // keyboard navigation
        t.index = i;
        t.onkeydown = function(e){

          var e = e || win.event,
              D = false,
              k = /35|36|37|39/.test(e.keyCode);

          if( /39/.test(e.keyCode) ) { // up|down|right|left
            D = P.children[t.index+1]||P.children[0];
          }
          else if( /37/.test(e.keyCode) ) {
            D = P.children[t.index-1]||P.children[P.children.length-1];
          }
          else if( e.keyCode === 36 ) { // home
            D = P.children[0];
          }
          else if( e.keyCode === 35 ) { // end
            D = P.children[P.children.length-1];
          }
          if (k && D) {
            if ( D !== this ) {
              //tab( D, false, true );
              D.click();
              D.focus();
            }
            e.preventDefault();
          }

        };

      }

      // click -> reset
      else {
        t.set("aria-selected","false");
        t.set("tabindex",-1);
        var C = t.get("aria-controls");
        [].forEach.call( doc.querySelectorAll("."+C+", #"+C) , function(p){
          p.setAttribute("hidden","");
        });
      }

    });

    if (!init) {
      elm.set("aria-selected","true");
      elm.set("tabindex",0);
      if (focus) {
        elm.focus();
      }
    }

  },

  // "accordion"
  heading = function(elm){
    var P = prev(elm,'[role="heading"] [aria-controls]');
    [].forEach.call( P.children, function(t,i) {
      if( !t.index ) {
        t.index = i;
        t.onkeydown = function(e){
          var e = e || win.event,
              D = false,
              k = /35|36|38|40/.test(e.keyCode);
          if( /40/.test(e.keyCode) ) { // up
            D = P.children[t.index+1]||P.children[0];
          }
          else if( /38/.test(e.keyCode) ) { // down
            D = P.children[t.index-1]||P.children[P.children.length-1];
          }
          else if( e.keyCode === 36 ) { // home
            D = P.children[0];
          }
          else if( e.keyCode === 35 ) { // end
            D = P.children[P.children.length-1];
          }
          if (k && D) {
            if ( D !== this ) {
              D.focus();
            }
            e.preventDefault();
          }
        };
      };
    });
  },

  // utils
  bind = function( elm ) {
    elm.has = elm.hasAttribute;
    elm.get = elm.getAttribute;;
    elm.set = elm.setAttribute;
    elm.del = elm.removeAttribute;
    elm.menu = menu;
    elm.dialog = dialog;
    elm.tab = tab;
    elm.heading = heading;
    return elm;
  },

  // init
  aria = function(redo) {

    [].forEach.call( doc.querySelectorAll('[aria-controls]'), function(elm) {

      if (!elm.get || redo) {

        // bind shortcut events
        bind(elm);

        // INIT ANY ROLE
        //    -> TAB
        //    -> HEADING (accordion)
        var P = bind(elm.parentNode);
        var R = elm.get("role") || P.get("role");
        if( R && elm[R]) {
          elm[R](elm,true);
        };

        elm.onclick = function(e){

          // avoid native events from link
          e.preventDefault();

          // shortcut
          var C = this.get("aria-controls"),
              S = this.get("aria-selected");

          // do nothing if this element is selected
          if(S&&S==="true") {
            return;
          };

          // reset any previous open dropdown
          reset(e);

          // synchronise controler that use the same controlers "id"
          var brothers = doc.querySelectorAll('[aria-controls="'+C+'"]');
          [].forEach.call( brothers, function(FROM){

            var FE = FROM.get("aria-expanded"),
                FR = FROM.get("role");

            if (FE) {
              FROM.set("aria-expanded", (FE==="false"));
            }

            // TAB
            if( FR && FROM[FR]) {
              FROM[FR](elm);
            };

          });

          // TO -> toggle visibility + trigger events
          var children = doc.querySelectorAll("."+C+", #"+C);
          [].forEach.call( children, function(TO){

            bind(TO);

            var TH = TO.has("hidden"),
                TM = TO.get("role");

            // disable enable CSS :-)
            if (TO.tagName==="LINK" && C === TO.id ){
              (TO.has("disabled"))?TO.del("disabled"):TO.set("disabled","");
              //(TO.has("as"))?TO.del("as"):TO.set("as","style");
              //(TO.get("rel")==="preload")?TO.set("rel","stylesheets"):TO.set("rel","preload");
            }
            else {

              // TO SHOW
              if (TH) {
                TO.del("hidden");
              }

              // TO HIDE
              else {
                TO.set("hidden","");
              }

              // MENU - DIALOG - REGION
              if( TM && TO[TM]) {
                elm.from = brothers;
                elm.to = children;
                TO[TM](elm);
              };

              // also a controler
              if ( TO.has("aria-controls") ) {
                TO.focus();
              };
            }

          });

          // Trigger events javascript
          if(typeof window[C]==="function"){window[C](this);}

        };

      }

    });

  }();

  // reset any previous dropdown open
  document.body.addEventListener("click", reset);

  // catch ESC to close any dialog
  document.body.addEventListener("keydown", function(e){
    if (e.keyCode===27) {
      dialog(false,true);
    }
  });

  // expose
  win.aria = aria;

})(window, document, false, []);