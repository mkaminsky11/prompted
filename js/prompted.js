//TODO: escape (allow for "<" and ">")
//TODO: autocomplete (uh-oh)
//TODO: cat
//TODO: docs!

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
  this.path = "/";
  this.specialExt = ["png","jpeg","JPEG","tiff","gif","mp3","mp4","mov","svg"];

  //prompt
  if(_prompted_helper.exists(options.prompt)){this.prompt = options.prompt}
  if(_prompted_helper.exists(options.path)){this.path = options.path}
  if(_prompted_helper.exists(options.beforeInput)){this.beforeInput = options.beforeInput}
  if(_prompted_helper.exists(options.afterInput)){this.afterInput = options.afterInput}
  if(_prompted_helper.exists(options.disable)){this.disable = options.disable}
  if(_prompted_helper.exists(options.data)){this.readTree(options.data,this.path)}

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
            this.cd(val.replace("cd","").trim());
          }
          else if(command === "ls"){
            this.ls(val.replace("ls","").trim());
          }

          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-prompt")).reverse()[0].innerHTML = "<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>";
        }
        this.afterInput(val);
    }
  }.bind(this), false);
}

_prompted.prototype.findFiles = function(path){
  //might have *
  //replace all * with (.*?), then make regex

  _path = path.split("/");

  //var r = new RegExp(path.split("*").join("(.*?)"));


  //return all data things in which the parents match
  var ret = [];
  for(var i = 0; i < this.data.length; i++){
    var path = this.data[i].path.split("/");
    var ok = true;
    if(_path.length !== path.length){
      ok = false;
    }
    else{
      for(var j = 0; j < _path.length; j++){
        var r = new RegExp(_path[j].split("*").join("(.*?)"));
        if(r.test(path[j]) === false){ok = false}
      }
    }

    if(ok === true){
      ret.push(this.data[i]);
    }
  }
  return ret;
};

_prompted.prototype.ls = function(arg){
  var files = [];
  if(arg === ""){
    //this.path
    if(this.path === "/"){
      files = this.findFiles("/*");
    }
    else{
      files = this.findFiles(this.path + "/*");
    }
  }
  else{
    //something else...resolve to this.path
    r_path = this.resolve(this.path, arg);
    if(r_path === "/"){
      files = this.findFiles("/*");
    }
    else{
      files = this.findFiles(r_path + "/*");
    }
  }

  html = "<ul class=\"flex-list\">";
  for(var i = 0; i < files.length; i++){
    if(files[i].folder === true){
      html += "<li class=\"prompted-accent-2\">" + files[i].name + "</li>";
    }
    else if(this.specialExt.indexOf(_prompted_helper.ext(files[i].name)) !== -1){
      html += "<li class=\"prompted-accent-3\">" + files[i].name + "</li>";
    }
    else{
      html += "<li>" + files[i].name + "</li>";
    }
  }

  html += "</ul>";
  this.insert(html);
};

_prompted.prototype.print = function(text){
  //display inline text!
  var newNode = document.createElement("div");
  newNode.className = "prompted-row";
  newNode.innerHTML = "<pre>" + text + "</pre>";
  var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
  this.elem.insertBefore(newNode, last_row);
};

_prompted.prototype.insert = function(html){
  var newNode = document.createElement("div");
  newNode.className = "prompted-row";
  newNode.innerHTML = html;
  var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
  this.elem.insertBefore(newNode, last_row);
};

_prompted.prototype.resolve = function(path, cd){

  //add these on at the end
  if(cd[0] === "~"){cd=cd.replace("~","/")} //will be taken care of...
  if(path[0] === "/"){path=path.replace("/","")}
  if(cd[0] === "/"){cd=cd.replace("/","");path=""}

  path = path.split("/").join(" ").trim().split(" ");
  cd = cd.split("/").join(" ").trim().split(" ");
  for(var i = 0; i < cd.length; i++){
    if(cd[i] === ".."){
      path = path.reverse().slice(1).reverse();
    }
    else if(cd[i] !== "." && cd[i].trim() !== ""){
      //no change if . or ..
      path.push(cd[i]);
    }
  }

  return "/" + path.join(" ").trim().split(" ").join("/");
};

_prompted.prototype.cd = function(arg){
  //resolve everything along the way
  cd = arg.split("/");
  if(cd[0] === ""){cd[0]="/"}
  if(arg[0] === "~"){cd[0]="~"}
  for(var i = 1; i < cd.length; i++){
    var r_path = this.resolve(this.path, cd.slice(0,i).join("/"));
    if(this.canCd(r_path) === false){
      this.print("cd: this folder was not found");
      return;
    }
  }
  this.path = this.resolve(this.path, arg);
};

_prompted.prototype.canCd = function(path){
  if(path === "/"){return true}
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

    to_push.path = this.resolve(path, tree[i].path);
    to_push.name = to_push.path.split("/").reverse()[0];
    to_push.parent = to_push.path.split("/").reverse().slice(1).reverse().join("/");
    if(to_push.parent === ""){to_push.parent === "/"}

    to_push.folder = tree[i].folder;
    if(to_push.folder === false){
      to_push.contents = tree[i].contents;
    }
    else if(_prompted_helper.exists(tree[i].contents)){
      //a folder with contents
      this.readTree(tree[i].contents, tree[i].path);
    }

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

_prompted_helper.ext = function(name){
  if(name.indexOf(".") === -1){
    return null;
  }
  else{
    return name.split(".").reverse()[0];
  }
};
