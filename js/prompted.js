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
  this.prompt = "root@you.com";
  this.beforeInput = function(e){};
  this.afterInput = function(e){};
  this.disable = false; //disable default output?
  this.data = [];
  this.path = "";

  //prompt
  if(_prompted_helper.exists(options.prompt)){this.prompt = options.prompt}
  if(_prompted_helper.exists(options.path)){this.path = options.path}
  if(_prompted_helper.exists(options.beforeInput)){this.beforeInput = options.beforeInput}
  if(_prompted_helper.exists(options.afterInput)){this.afterInput = options.afterInput}
  if(_prompted_helper.exists(options.disable)){this.disable = options.disable}
  if(_prompted_helper.exists(options.data)){this.readTree(options.data,"")}

  var main = document.createElement("DIV");
  main.className = "prompted prompted-s-default";
  main.innerHTML = "<div class=\"prompted-row\"><span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>" +"</span><input type=\"text\" class=\"prompted-input\"></div>";
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
          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0].focus();

          var newNode = document.createElement("DIV");
          newNode.className = "prompted-row";
          newNode.innerHTML = "<span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>"+"<span class=\"prompted-accent-2\">" + this.path + "</span>"+"</span><input type=\"text\" class=\"prompted-input\" readonly value=\""+val+"\">";

          //insert new row before the last row
          var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
          this.elem.insertBefore(newNode, last_row);

          //output should be inserted before the last row

          var command = val.split(" ")[0];
          if(command === "cd"){
            var res = this.cd(val.replace("cd","").trim());
            if(res !== null){
              this.inline("cd:" + res);
            }
          }

          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-prompt")).reverse()[0].innerHTML = "<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>";
        }
        this.afterInput(val);
    }
  }.bind(this), false);
}

_prompted.prototype.inline = function(text){
  //display inline text!
  var newNode = document.createElement("div");
  newNode.className = "prompted-row";
  newNode.innerHTML = "<pre>" + text + "</pre>";
  var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
  this.elem.insertBefore(newNode, last_row);
};

_prompted.prototype.cd = function(arg){
  //first, resolve path

  var path = this.path;
  if(arg[0] === "/"){path="";arg=arg.replace("/","")} //remove leading /
  if(arg[0] === "~"){path="";arg=arg.replace("~","")}
  arg = arg.split("/");
  for(var i = 0; i < arg.length; i++){
    if(arg[i] !== "." && arg[i] !== ""){
      //not nothing
      if(arg[i] === ".."){
        if(path === ""){
          //nothing...
        }
        else{
          //remove the last one
          path = path.split("/").reverse().slice(1).reverse().join("/");
        }
      }
      else{
        //just something normal
        if(this.canCd(path + "/" + arg[i])){
          path = path + "/" + arg[i];
        }
        else{
          return "This folder does not exist";
        }
      }
    }
  }

  //if nothing happens...
  if(path[0] === "/"){path=path.replace("/","")}
  this.path = path;
  return null;
};

_prompted.prototype.canCd = function(path){
  for(var i = 0; i < this.data.length; i++){
    if(this.data[i].path === path){
      if(this.data[i].folder === true){
        return true;
      }
      return false;
    }
  }
  return false;
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

    var to_push = {};
    to_push.path = tree[i].path;
    if(tree[i].path.indexOf("/") === -1){
      to_push.name = tree[i].path;
      to_push.parent = path;
      to_push.path = path + "/" + to_push.path
    }
    else{
      to_push.name = tree[i].path.split("/").reverse()[0];
      to_push.parent = path + "/" + tree[i].path.split("/").reverse().slice(1).reverse().join("/");
    }

    to_push.folder = tree[i].folder;
    if(to_push.folder === false){
      to_push.contents = tree[i].contents;
    }
    else if(_prompted_helper.exists(tree[i].contents)){
      //a folder with contents
      this.readTree(tree[i].contents, tree[i].path);
    }

    if(to_push.parent[0] === "/"){to_push.parent = to_push.parent.replace("/","")}

    this.data.push(to_push);
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
