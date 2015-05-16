//GOAL: terminal emulator in less than 1000 lines

//TODO: autocomplete (uh-oh)
//TODO: docs!
//TODO: add own functions
//TODO: find (-iname, etc) <-- tags are iffy
//TODO: mv <--replace start with new...
//TODO: quotes + dquote? <-- iffy
//TODO: cleanup!
//TODO: intro text
//TODO: file manipulation via functions
//TODO: cp
//TODO: images and url
//TODO: nano

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
  this.prompt = "root@localhost";
  this.beforeInput = function(e){};
  this.afterInput = function(e){};
  this.disable = false; //disable default output?
  this.data = [];
  this.path = "/";
  this.specialExt = ["png","jpeg","JPEG","tiff","gif","mp3","mp4","mov","svg"];
  this.commands = ["mv","rm","touch","mkdir","pwd","echo","clear","cat","ls","cd","history"];
  this.commandHistory = [];

  //prompt
  if(_prompted_helper.exists(options.prompt)){this.prompt = options.prompt}
  if(_prompted_helper.exists(options.path)){this.path = options.path}
  if(_prompted_helper.exists(options.beforeInput)){this.beforeInput = options.beforeInput}
  if(_prompted_helper.exists(options.afterInput)){this.afterInput = options.afterInput}
  if(_prompted_helper.exists(options.disable)){this.disable = options.disable}
  if(_prompted_helper.exists(options.data)){this.readTree(options.data,this.path)}

  var main = document.createElement("DIV");
  main.className = "prompted prompted-s-default";
  main.innerHTML = "<div class=\"prompted-row\"><span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>" +"</span><input spellcheck=\"false\" type=\"text\" class=\"prompted-input\"></div>";
  elem.appendChild(main);

  this.elem = main;
  var inp = _prompted_helper.toArray(main.getElementsByClassName("prompted-input")).reverse()[0];
  inp.focus();
  inp.addEventListener("keyup", function(e){
    e.which = e.which || e.keyCode;
    if(e.which == 13) {
        // submit
        this.beforeInput
        if(this.disable === false){
          var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0];
          var val = inp.value;
          inp.value = "";
          inp.focus();

          var newNode = document.createElement("DIV");
          newNode.className = "prompted-row";
          newNode.innerHTML = "<span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>"+"<span class=\"prompted-accent-2\">" + this.path + "</span>"+"</span><input type=\"text\" class=\"prompted-input\" readonly spellcheck=\"false\" value=\""+val+"\">";

          //insert new row before the last row
          var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
          this.elem.insertBefore(newNode, last_row);

          //output should be inserted before the last row
          this.commandHistory.push(val.trim());
          if(val.trim() !== ""){
            var commands = val.trim().split(/&&|;/);
            for(var i = 0; i < commands.length; i++){
              this.eval(commands[i]);
            }
          }

          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-prompt")).reverse()[0].innerHTML = "<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>";
        }
        this.afterInput(val);
    }
  }.bind(this), false);
}

_prompted.prototype.eval = function(val){
  val = val.trim();
  if(val.trim() !== ""){
    var command = val.split(" ")[0];
    if(val.split(" ").indexOf("--help") === -1){
      //now, remove tags
      var raw_val = val; //keep this...
      val = _prompted_helper.removeTags(val);

      if(_prompted_helper.exists(this[command]) && this.commands.indexOf(command) !== -1){
        this[command](val.replace(command,"").trim())
      }
      else{
        console.log(command);
        this.print("This command does not exist")
      }
    }
    else{
      if(_prompted_helper.exists(this[command].help)){
        this.print(this[command].help);
      }
    }
  }
}

_prompted.prototype.hideInput = function(){
  _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0].style.display = "none";
};

_prompted.prototype.showInput = function(){
  _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0].style.display = "block";
};

_prompted.prototype.inputHidden = function(){
  return _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0].style.display === "none";
};


_prompted.prototype.regexp = function(path){
  return new RegExp("^" + path.split("*").join("(.*)").split("/").join("\/") + "$");
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
};

_prompted.prototype.exists = function(path){
  for(var i = 0; i < this.data.length; i++){
      if(this.data[i].path === path){
        return true;
      }
  }
  return false;
};

_prompted.prototype.readTree = function(tree, path){
  for(var i = 0; i < tree.length; i++){

    var to_push = {};

    to_push.path = _prompted_helper.resolve(path, tree[i].path);
    to_push.name = to_push.path.split("/").reverse()[0];
    to_push.parent = _prompted_helper.getParent(to_push.path);
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
COMMANDS
*/

_prompted.prototype.history = function(arg){
  this.print(this.commandHistory.join("\n"));
};

_prompted.prototype.mv = function(arg){
	/*
	if(place to move doesn't exist but parent exists)
		create, move in all contents
	if(place to move exists)
		add entire contents into this folder
	else
		error! not found


	mv 1 2 //moves 1 inside of 2
	*/
};


_prompted.prototype.rm = function(arg){
	if(arg.trim() !== ""){
		arg = arg.split(" ");
		for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      var reg1 = this.regexp(path)
      if(path === "/"){path = "/*"}
      else{path = path + "/*"}
      var reg2 = this.regexp(path);
      for(var j = 0; j < this.data.length; j++){
        if(reg1.test(this.data[j].path) === true || reg2.test(this.data[j].path)){
          this.data.splice(j,1);
          j--;
        }
      }

		}
	}
}
_prompted.prototype.rm.help = (function () {/*usage: rm [-f | -i] [-dPRrvW] file ...
       unlink file*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.touch = function(arg){
  this.create(arg, false);
};
_prompted.prototype.touch.help = (function () {/*usage:
touch [-A [-][[hh]mm]SS] [-acfhm] [-r file] [-t [[CC]YY]MMDDhhmm[.SS]] file ...*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.mkdir = function(arg){
  this.create(arg, true);
};
_prompted.prototype.mkdir.help = (function () {/*usage: mkdir [-pv] [-m mode] directory ...*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.create = function(arg, folder){
  arg = arg.split(" ");
  for(var i = 0; i < arg.length; i++){
    var path = _prompted_helper.resolve(this.path, arg[i]);
    var name = path.split("/").reverse()[0];
    var par = _prompted_helper.getParent(path);
    var reg = this.regexp(par);

    if(par === "/"){
      var to_push = {};
      to_push.path = "/" + name;
      to_push.name = name;
      to_push.parent = "/";
      to_push.folder = folder;

      if(this.exists(to_push.path)){
        this.print("mkdir: "+to_push.name+" already exists");
      }
      else{
        this.data.push(to_push);
      }
      continue;
    }

    var found = false;
    for(var j = 0; j < this.data.length; j++){
      if(reg.test(this.data[j].path) === true && par.split("/").length === this.data[j].path.split("/").length && this.data[j].folder === true){
        found = true;
        var to_push = {};
        to_push.path = _prompted_helper.resolve(this.data[j].path, name);
        to_push.name = name;
        to_push.parent = this.data[j].path;
        to_push.folder = folder;

        if(this.exists(to_push.path)){
          this.print("mkdir: "+to_push.name+" already exists");
        }
        else{
          this.data.push(to_push);
        }

        if(arg[i].indexOf("*") === -1){
          continue;
        }
      }
    }
    if(found === false){
      this.print("mkdir: "+par+" does not exist");
    }

  }
};


_prompted.prototype.pwd = function(arg){
  this.print(this.path);
};


_prompted.prototype.echo = function(text){
  this.print(_prompted_helper.escape(text));
};


_prompted.prototype.clear = function(arg){
  //remove all rows but the last
  var rows = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row"));
  for(var i = 0; i < (rows.length - 1); i++){
    rows[i].parentNode.removeChild(rows[i]);
  }
};

_prompted.prototype.cat = function(arg){
  if(arg !== ""){
    arg = arg.split(" ");
    for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      var reg = this.regexp(path);
      var ok = false;
      for(var j = 0; j < this.data.length; j++){
        if(reg.test(this.data[j].path) === true && path.split("/").length === this.data[j].path.split("/").length && this.data[j].folder === false){
          //ok, add it on
          this.print(_prompted_helper.escape(this.data[j].contents));

          ok = true;
          if(arg[i].indexOf("*") === -1){
            continue;
          }
        }
      }
      if(ok === false){
        this.print("cat: no file found");
      }
    }

  }
  else{
    //uh-oh
    this.print("cat: no file specified");
  }
}
_prompted.prototype.cat.help = (function () {/*usage: cat [-benstuv] [file ...]*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

//TODO: output results organized by location
_prompted.prototype.ls = function(arg){
  if(arg === ""){
    //list all in this.path
    var path = this.path + "/*"
    if(this.path === "/"){path="/*"}
    var files = [];
    var reg = this.regexp(path);
    for(var i = 0; i < this.data.length; i++){
      if(reg.test(this.data[i].path) === true && path.split("/").length === this.data[i].path.split("/").length){
        files.push(this.data[i]);
      }
    }
    this.listFiles(files, false);
  }
  else{
    arg = arg.split(" ");
    for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      if(path !== "/"){
        var reg = this.regexp(path);
        for(var j = 0; j < this.data.length; j++){
          if(reg.test(this.data[j].path) === true && path.split("/").length === this.data[j].path.split("/").length && this.data[j].folder === true){
            //found a folder that matches
            var title = this.data[j].name;
            var _path = this.data[j].path + "/*";
            var reg2 = this.regexp(_path);
            var files = [];
            for(var k = 0; k < this.data.length; k++){
              if(reg2.test(this.data[k].path) === true && _path.split("/").length === this.data[k].path.split("/").length){
                files.push(this.data[k]);
              }
            }
            this.listFiles(files, title);
          }
        }
      }
      else{
        //TODO: if /
        var reg = this.regexp("/*");
        var files = [];
        for(var j = 0; j < this.data.length; j++){
          if(reg.test(this.data[j].path) === true && "/".split("/").length === this.data[j].path.split("/").length){
            files.push(this.data[j]);
          }
        }
        this.listFiles(files, false);
      }
    }
  }
};

_prompted.prototype.listFiles = function(files, title){
  files = files.sort(_prompted_helper.nameSort);
  var html = "<ul class=\"flex-list\">";
  if(title !== false){this.print(title + ":")}
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

_prompted.prototype.ls.help = (function () {/*usage: ls [-ABCFGHLOPRSTUWabcdefghiklmnopqrstuwx1] [file ...]*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.cd = function(arg){
  //resolve everything along the way
  cd = arg.split("/");
  if(cd[0] === ""){cd[0]="/"}
  if(arg[0] === "~"){cd[0]="~"}
  for(var i = 1; i <= cd.length; i++){
    var r_path = _prompted_helper.resolve(this.path, cd.slice(0,i).join("/"));
    if(this.canCd(r_path) === false){
      this.print("cd: this folder was not found");
      return;
    }
  }
  this.path = _prompted_helper.resolve(this.path, arg);
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
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

_prompted_helper.nameSort = function(a,b){
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;
    return 0;
}

_prompted_helper.removeTags = function(text){
  var ret = [];
  text = text.split(" ");
  for(var i = 0; i < text.length; i++){
    if(text[i][0] !== "-"){
      ret.push(text[i]);
    }
  }
  return ret.join(" ");
};

_prompted_helper.getParent = function(path){
  var name = path.split("/").reverse()[0];
  var parent = path.split("").reverse().join("").replace(name.split("").reverse().join(""),"");
  if(parent === "/"){
    return "/"
  }
  else{
    return parent.replace("/","").split("").reverse().join("");
  }
};

_prompted_helper.startsWith = function(start, test){
	//does test start with start?
	return test.indexOf(start) === 0;
};

_prompted_helper.resolve = function(path, cd){

  if(cd[0] === "~"){cd=cd.replace("~","/")}
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
