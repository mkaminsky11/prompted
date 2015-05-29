//TODO: docs!
//TODO: find (-iname, etc) <-- tags are iffy
//TODO: cp
//TODO: images and url
//TODO: nano
//TODO: functions to
//rename (mv)

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

  //prompt
  if(_prompted_helper.exists(options.prompt)){this.prompt = options.prompt}
  if(_prompted_helper.exists(options.path)){this.path = options.path}
  if(_prompted_helper.exists(options.beforeInput)){this.beforeInput = options.beforeInput}
  if(_prompted_helper.exists(options.afterInput)){this.afterInput = options.afterInput}
  if(_prompted_helper.exists(options.disable)){this.disable = options.disable}
  if(_prompted_helper.exists(options.data)){this.readTree(options.data,this.path)}
  if(_prompted_helper.exists(options.introText)){this.introText = options.introText}
  if(_prompted_helper.exists(options.disabledCommands)){this.disabledCommands = options.disabledCommands}
  if(_prompted_helper.exists(options.theme)){this.theme = options.theme}

  var main = document.createElement("DIV");
  main.className = "prompted prompted-s-" + this.theme;
  main.innerHTML = "<div class=\"prompted-row\"><span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>" +"</span><input spellcheck=\"false\" type=\"text\" class=\"prompted-input\"></div>";
  elem.appendChild(main);

  this.elem = main;
  this.bindInput();
  this.print(this.introText);
}

_prompted.prototype.prompt = "root@localhost";
_prompted.prototype.beforeInput = function(e){};
_prompted.prototype.afterInput = function(e){};
_prompted.prototype.disable = false; //disable default output?
_prompted.prototype.data = [];
_prompted.prototype.path = "/";
_prompted.prototype.specialExt = ["png","jpeg","JPEG","tiff","gif","mp3","mp4","mov","svg"];
_prompted.prototype.commands = ["mv","rm","touch","mkdir","pwd","echo","clear","cat","ls","cd","history","help","nano"];
_prompted.prototype.rawCommands = [];
_prompted.prototype.commandHistory = [];
_prompted.prototype.disabledCommands = [];
_prompted.prototype.theme = "default";
_prompted.prototype.historyIndex = 0;
_prompted.prototype.introText = (function () {/*
<h2 style="margin:0">PROMPTED</h2>

A Linux terminal emulator written in Javascript.
Support the project by starring us <a href='https://github.com/mkaminsky11/prompted'>here</a>

Type "help" to see all of the available commands*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.bindInput = function(){
  var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0];
  inp.focus();
  inp.addEventListener("keydown", function(e){
    e.which = e.which || e.keyCode;
    if(e.which == 13) {
        // submit
        this.beforeInput(val);
        if(this.disable === false){
          var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0];
          var val = inp.value;
          this.resetInput();
          inp.value = "";
          inp.focus();

          //output should be inserted before the last row
          this.commandHistory.push(val.trim());
          this.historyIndex = this.commandHistory.length;
          if(val.trim() !== ""){
            var commands = val.trim().split(/&&|;/);
            for(var i = 0; i < commands.length; i++){
              try{
                this.eval(commands[i]);
              }
              catch(e){
                this.print(e);
              }
            }
          }

          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-prompt")).reverse()[0].innerHTML = "<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>";
        }
        this.afterInput(val);
    }
    else if(e.which == 38){
      if(this.historyIndex !== 0){
        this.historyIndex--;
        var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0]
        inp.value = this.commandHistory[this.historyIndex];
      }
    }
    else if(e.which == 40){
      if(this.historyIndex !== (this.commandHistory.length - 1)){
        this.historyIndex++;
        var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0]
        inp.value = this.commandHistory[this.historyIndex];
      }
    }
    else if(e.which == 9){
      e.preventDefault();
      var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0];
      inp.focus();
      var pos_goal =  _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0].selectionStart;
      var arr = inp.value.split(" ");
      var section = "";
      var pos = 0;
      var index = null;
      for(var i = 0; i < arr.length; i++){
        if(pos_goal >= pos && pos_goal <= (pos + arr[i].length)){
          section = arr[i];
          index = i;
        }
        pos = pos + arr[i].length;
        pos++;
      }

      var res = this.autoComplete(section);
      if(res.length === 1 && index !== null){
        arr[index] = res[0].path;
        inp.value = arr.join(" ");
      }
      else if(index !== null){
        //more than 1
        this.resetInput();
        this.listFiles(res,false);
      }
      e.preventDefault();
    }
  }.bind(this), false);
}

_prompted.prototype.resetInput = function(){
  var inp = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-input")).reverse()[0];
  var val = inp.value;

  var newNode = document.createElement("DIV");
  newNode.className = "prompted-row";
  newNode.innerHTML = "<span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>"+"<span class=\"prompted-accent-2\">" + this.path + "</span>"+"</span><input type=\"text\" class=\"prompted-input\" readonly spellcheck=\"false\" value=\""+val+"\">";

  //insert new row before the last row
  var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
  this.elem.insertBefore(newNode, last_row);
};

_prompted.prototype.autoComplete = function(path){
  path = path + "*";
  path = _prompted_helper.resolve(this.path, path);
  var reg = this.regexp(path);
  var paths = [];
  for(var i = 0; i < this.data.length; i++){
    if(reg.test(this.data[i].path) === true && path.split("/").length === this.data[i].path.split("/").length){
      paths.push(this.data[i]);
    }
  }
  return paths;
};

_prompted.prototype.eval = function(val){
  val = val.trim();
  if(val.trim() !== ""){
    var command = val.split(" ")[0];
    if(this.disabledCommands.indexOf(command) === -1){
      if(val.split(" ").indexOf("--help") === -1){
        //now, remove tags
        var raw_val = val; //keep this...
        val = _prompted_helper.removeTags(val);

        if(_prompted_helper.exists(this[command]) && this.commands.indexOf(command) !== -1){
          if(this.rawCommands.indexOf(command) === -1){
            this[command](val.replace(command,"").trim());
          }
          else{
            this[command](raw_val.replace(command,"").trim());
          }
        }
        else{
          throw "This command does not exist";
        }
      }
      else{
        if(_prompted_helper.exists(this[command].help)){
          this.print(this[command].help);
        }
        else{
          throw (command + " has no documentation");
        }
      }
    }
    else{
      throw (command + " is disabled");
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
  if(path.indexOf("*") === -1){
    for(var i = 0; i < this.data.length; i++){
        if(this.data[i].path === path){
          return true;
        }
    }
    return false;
  }
  else{
    var reg = this.regexp(path);
    for(var i = 0; i < this.data.length; i++){
      if(reg.test(this.data[i].path) === true && this.data[i].path.split("/").length === path.split("/").length){
        return true;
      }
    }
    return false;
  }
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
      this.readTree(tree[i].contents, to_push.path);
    }

    this.data.push(to_push);
  }
};

_prompted.prototype.createCommand = function(command_name, func, raw){
  if(raw === true){ //with tags and everything
    if(this.rawCommands.indexOf(command_name) === -1){
      this.rawCommands.push(command_name);
    }
  }
  else if(this.rawCommands.indexOf(command_name) === -1){
    this.rawCommands.splice(this.rawCommands.indexOf(command_name), 1);
  }

  if(this.commands.indexOf(command_name) === -1){
    this.commands.push(command_name);
  }


  if(func.length !== 1){
    throw "This function must have only one argument";
  }
  else{this[command_name] = func;}
}
_prompted.prototype.disableCommand = function(command){
  if(this.disabledCommands.indexOf(command) === -1){
    this.disabledCommands.push(command);
  }
};
_prompted.prototype.enableCommand = function(command){
  if(this.disabledCommands.indexOf(command) !== -1){
    this.disabledCommands.splice(this.disabledCommands.indexOf(command),1);
  }
};
_prompted.prototype.commandDisabled = function(command){
  return (this.disabledCommands.indexOf(command) !== -1)
};


_prompted.prototype.setTheme = function(theme){
  this.elem.classList.remove("prompted-s-" + this.theme);
  this.theme = theme;
  this.elem.classList.add("prompted-s-" + theme);
}

/*
COMMANDS
*/

_prompted.prototype.help = function(arg){
  this.print(this.commands.join("\n"));
}

_prompted.prototype.history = function(arg){
  this.print(this.commandHistory.join("\n"));
};

_prompted.prototype.mv = function(arg){
  arg = arg.split(" ");
  if(arg.length === 2){
    var to_be_moved = _prompted_helper.resolve(this.path, arg[0]);
    var move_to = _prompted_helper.resolve(this.path, arg[1]);
    if(move_to.indexOf("*") === -1){ //* in to_be_moved is ok, not in move_to
      //probably don't want to move "/"
      if(to_be_moved !== "/"){
        var reg_folder = this.regexp(to_be_moved + "/*");
        var reg_parent = this.regexp(to_be_moved);
        var push = [];
        for(var i = 0; i < this.data.length; i++){
          if(reg_parent.test(this.data[i].path) === true && this.data[i].path.split("/").length === to_be_moved.split("/").length){
            var new_path = null;
            var path = this.data[i].path;
            var ok = true;

            if(this.exists(move_to) || move_to === "/"){
              //move into here
              var new_parent = move_to;
              new_path = new_parent + "/" + this.data[i].name;
              if(new_parent === "/"){
                new_path = "/" + this.data[i].name;
              }
              this.data[i].path = new_path;
              this.data[i].parent = new_parent;
            }
            else if(this.exists(_prompted_helper.getParent(move_to))){
              //make a new file
              var new_parent = _prompted_helper.getParent(move_to);
              var new_name = move_to.split("/").reverse()[0];
              new_path  = new_parent + "/" + new_name;
              if(new_parent === "/"){
                new_path = "/" + new_name;
              }
              this.data[i].name = new_name;
              this.data[i].path = new_path;
              this.data[i].parent = new_parent;
            }
            else{
              ok = false;
              this.print("mv: " + _prompted_helper.getParent(move_to) + " does not exist");
            }

            if(this.data[i].folder === true && ok === true){
              for(var j = 0; j < this.data.length; j++){
                if(this.data[j].parent.indexOf(path) === 0){
                  this.data[j].parent = this.data[j].parent.replace(path, new_path);
                  this.data[j].path = this.data[j].parent + "/" + this.data[j].name;
                }
              }
            }
          }
        }
      }
      else{
        this.print("mv: you can't move root")
      }
    }
    else{
      this.print("mv: wildcards are not allowed in the destination");
    }
  }
  else{
    this.print("mv: not enough arguments");
  }
};


_prompted.prototype.rm = function(arg){
	this.REMOVE(arg);
}
_prompted.prototype.REMOVE = function(arg){
  if(arg.trim() !== ""){
    var res = [];
		arg = arg.split(" ");
		for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      var reg1 = this.regexp(path)
      if(path === "/"){path = "/*"}
      else{path = path + "/*"}
      var reg2 = this.regexp(path);
      for(var j = 0; j < this.data.length; j++){
        if(reg1.test(this.data[j].path) === true || reg2.test(this.data[j].path)){
          res.push(this.data[j]);
          this.data.splice(j,1);
          j--;
        }
      }

		}
    return res;
	}
}
_prompted.prototype.rm.help = (function () {/*usage: rm [-f | -i] [-dPRrvW] file ...
       unlink file*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.touch = function(arg){
  try{
    this.CREATE(arg, false);
  } catch(e){
    this.print("touch: " + e);
  }
};
_prompted.prototype.touch.help = (function () {/*usage:
touch [-A [-][[hh]mm]SS] [-acfhm] [-r file] [-t [[CC]YY]MMDDhhmm[.SS]] file ...*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.mkdir = function(arg){
  try{
    this.CREATE(arg, true);
  } catch(e){
    this.print("mkdir: " + e);
  }
};
_prompted.prototype.mkdir.help = (function () {/*usage: mkdir [-pv] [-m mode] directory ...*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.CREATE = function(){ //TODO: rework!
  var arg = null;
  var folder = null;
  var content = "";
  if(arguments.length === 3){
    content = arguments[2];
  }
  if(arguments.length === 2 || arguments.length === 3){
    arg = arguments[0];
    folder = arguments[1];

    arg = arg.split(" ");
    for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      if(path === "/"){
        throw "can't create root";
      }
      var parents = []; //store all of the parents
      var parent = _prompted_helper.getParent(path);
      if(parent === "/"){
        parents = ["/"]
      }
      var reg = this.regexp(parent);
      var reg1 = this.regexp(path);
      var matches = []; //all that already match/already exist

      for(var j = 0; j < this.data.length; j++){
        if(reg1.test(this.data[j].path) === true && path.split("/").length === this.data[j].path.split("/").length ){
            //a file that matches
            matches.push(this.data[j]);
        }
        else if(reg.test(this.data[j].path) === true && parent.split("/").length === this.data[j].path.split("/").length && this.data[j].folder === true){
            //a file that matches
            parents.push(this.data[j].path);
        }
      }

      console.log(parents);
      //got all matches and parents
      for(var j = 0; j < parents.length; j++){
        var found = false;
        for(var k = 0; k < matches.length; k++){
          if(matches[k].parent === parents[j]){
            found = matches[k].path;
          }
        }

        if(found !== false){
          throw (found + " already exists");
        }
        else{
          var name = path.split("/").reverse()[0];
          var new_path = _prompted_helper.resolve(parents[j], name);
          var to_push = {
            name: name,
            path: new_path,
            parent: parents[j],
            folder: folder
          }
          if(folder === false){
            to_push.contents = content;
          }
          this.data.push(to_push);
        }
      }
    }
  }
  else{
    throw "not enough arguments";
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

_prompted.prototype.FIND = function(arg){
  if(arg.trim() !== ""){
    var res = [];
    arg = arg.split(" ");
    for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      var reg = this.regexp(path);
      for(var j = 0; j < this.data.length; j++){
        if(reg.test(this.data[j].path) === true && path.split("/").length === this.data[j].path.split("/").length){
          res.push(this.data[j]);
        }
      }

    }
    return res;
  }
  else{
    throw "no file specified"
  }
}

_prompted.prototype.WRITE  = function(arg, text){ //returns the modified files
  if(arg.trim() !== ""){
    var res = [];
    arg = arg.split(" ");
    for(var i = 0; i < arg.length; i++){
      var path = _prompted_helper.resolve(this.path, arg[i]);
      var reg = this.regexp(path);
      for(var j = 0; j < this.data.length; j++){
        if(reg.test(this.data[j].path) === true && path.split("/").length === this.data[j].path.split("/").length && this.data[j].folder === false){
          //must be a file
          this.data[j].contents = text;
          res.push(this.data[j]);
        }
      }

    }
    return res;
  }
  else{
    throw "no file specified"
  }
}

_prompted.prototype.READ = function(arg){
  var ret = [];
  var res = this.FIND(arg);
  for(var i = 0; i < res.length; i++){
    if(res[i].folder === false){
      ret.push(res[i]);
    }
  }
  return ret;
}

_prompted.prototype.cat = function(arg){
  try{
    var res = this.FIND(arg);
    for(var i = 0; i < res.length; i++){
      if(res[i].folder === false){
        this.print(_prompted_helper.escape(res[i].contents));
      }
    }
  } catch(e){
    this.print("cat: " + e);
  }
}
_prompted.prototype.cat.help = (function () {/*usage: cat [-benstuv] [file ...]*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

_prompted.prototype.nano = function(arg){
  this.print("nano: load prompted-nano.js to use");
}

_prompted.prototype.ls = function(arg){
  var files = [];
  if(arg.trim() === ""){
    arg = "." //just this dir
  }
  arg = arg.split(" ");
  for(var i = 0; i < arg.length; i++){
    var path = _prompted_helper.resolve(this.path, arg[i]);
    if(path === "/"){
      path = "/*"
    }
    else{
      path += "/*"
    }
    var res = this.FIND(path);
    files = files.concat(res);
  }
  //ok, got all of the files
  //now, organize by parents
  files = files.sort(_prompted_helper.parentSort);
  var sorted = [];
  var curr_parent = "";
  for(var i = 0; i < files.length; i++){
    if(files[i].parent !== curr_parent){
      curr_parent = files[i].parent;
      sorted.push([]);
    }

    if(files[i].parent === curr_parent){
      sorted[sorted.length - 1].push(files[i]);
    }
  }

  for(var i = 0; i < sorted.length; i++){
    if(sorted.length === 1){
      this.listFiles(sorted[i], null);
    }
    else{
      this.listFiles(sorted[i], sorted[i][0].parent);
    }
  }
};

_prompted.prototype.listFiles = function(files, title){ //TODO: remove this, put directly in loop
  files = files.sort(_prompted_helper.nameSort);
  var html = "<ul class=\"flex-list\">";
  if(title !== null){this.print(title + ":")}
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

_prompted_helper.parentSort = function(a,b){
    if(a.parent < b.parent) return -1;
    if(a.parent > b.parent) return 1;
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

_prompted_helper.getStyle = function(el, styleProp) {
  var value, defaultView = (el.ownerDocument || document).defaultView;
  // W3C standard way:
  if (defaultView && defaultView.getComputedStyle) {
    // sanitize property name to css notation
    // (hypen separated words eg. font-Size)
    styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
    return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  } else if (el.currentStyle) { // IE
    // sanitize property name to camelCase
    styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) {
      return letter.toUpperCase();
    });
    value = el.currentStyle[styleProp];
    // convert other units to pixels on IE
    if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
      return (function(value) {
        var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        el.style.left = value || 0;
        value = el.style.pixelLeft + "px";
        el.style.left = oldLeft;
        el.runtimeStyle.left = oldRsLeft;
        return value;
      })(value);
    }
    return value;
  }
};
