/*
* JUST FOR INIT
*/

function prompted(elems, options){
  //if elems is an array
  if(elems.constructor === Array){
    var ret = [];
    for(var i = 0; i < elems.length; i++){
      //is this element a dom element?
      var elem = elems[i];
      if(_prompted_helper.isNode(elem) || _prompted_helper.isElement(elem)){
        ret.push(new _prompted(elem, options));
      }
      else{
        throw "Must be an array of dom elements or a dom element";
      }
    }
    return ret;
  }
  else if(_prompted_helper.isNode(elems) || _prompted_helper.isElement(elems)){
    //just a single dom element
    var elem = elems;
    return [new _prompted(elem, options)];
  }
  else{
    //other
    throw "Must be an array of dom elements or a dom element";
  }
}






/*
* THIS IS THE GOOD STUFF
*/

function _prompted(elem, options){
  this.prompt = "$";
  this.beforeInput = function(e){};
  this.afterInput = function(e){};
  this.disable = false; //disable default output?
  this.data = [];

  //prompt
  if(_prompted_helper.exists(options.prompt)){this.prompt = options.prompt}
  if(_prompted_helper.exists(options.beforeInput)){this.beforeInput = options.beforeInput}
  if(_prompted_helper.exists(options.afterInput)){this.afterInput = options.afterInput}
  if(_prompted_helper.exists(options.disable)){this.disable = options.disable}
  if(_prompted_helper.exists(options.data)){this.data = options.data}

  var main = document.createElement("DIV");
  main.className = "prompted prompted-s-default";
  main.innerHTML = "<div class=\"prompted-row\"><span class=\"prompted-prompt\">"+this.prompt+"</span><input type=\"text\" class=\"prompted-input\"></div>";
  elem.appendChild(main);

  this.elem = main;

  _prompted_helper.toArray(main.getElementsByClassName("prompted-input")).reverse()[0].focus();
  _prompted_helper.toArray(main.getElementsByClassName("prompted-input")).reverse()[0].addEventListener("keyup", function(e){
    e.which = e.which || e.keyCode;
    if(e.which == 13) {
        // submit
        this.beforeInput
        if(this.disable === false){
          var val = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0].value;
          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0].value = "";
          _prompted_helper.toArray(main.getElementsByClassName("prompted-input")).reverse()[0].focus();

          var newNode = document.createElement("DIV");
          newNode.className = "prompted-row";
          newNode.innerHTML = "<span class=\"prompted-prompt\">"+this.prompt+"</span><input type=\"text\" class=\"prompted-input\" readonly value=\""+val+"\">";

          //insert new row after the last row
          var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];

          this.elem.insertBefore(newNode, last_row);

          //output should be inserted before newNode


        }
        this.afterInput(val);
    }
  }.bind(this), false);
}

_prompted.prototype.readTree = function(tree, path){
  if(path[0] === "/"){path = path.replace("/","")} //don't start with a "/"
  //initial population
  for(var i = 0; i < tree.length; i++){
    /*
    THINGS THEY SHOULD HAVE:
    - path *
    - folder? *
    - contents
    -- if file, the text *
    -- if folder, another tree (opt)
    */

    
  }
};



/*
* HELPER FUNCTIONS
*/
var _prompted_helper = {};
_prompted_helper.isNode = function(o){
  return (
    typeof Node === "object" ? o instanceof Node :
    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
};
_prompted_helper.isElement = function(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
  );
};

_prompted_helper.exists = function(test){
  if((typeof test) === (typeof undefined) || test === undefined || (typeof test) === undefined || (typeof test) === "undefined"){
    return false;
  }
  return true;
};

_prompted_helper.escape = function(text){
  return text.split("<").join("&lt;").split(">").join("&gt;");
};

_prompted_helper.toArray = function(nl){
  //nodelist to array
  var arr = [];
  for(var i = nl.length; i--; arr.unshift(nl[i]));
  return arr;
}
