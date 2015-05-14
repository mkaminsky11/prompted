//TODO: autocomplete (uh-oh)
//TODO: docs!
//TODO: help
//TODO: add own functions
//TODO: find (-iname, etc) <-- tags are iffy
//TODO: df ?
//TODO: mv <--change everything that starts with the path
//TODO: wget
//TODO: quotes + dquote? <-- iffy

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
  this.prompt = "root@localhost.com";
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
  main.innerHTML = "<div class=\"prompted-row\"><span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>" +"</span><input spellcheck=\"false\" type=\"text\" class=\"prompted-input\"></div>";
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
          newNode.innerHTML = "<span class=\"prompted-prompt\">"+"<span class=\"prompted-accent-1\">" + this.prompt + "</span>"+"<span class=\"prompted-accent-2\">" + this.path + "</span>"+"</span><input type=\"text\" class=\"prompted-input\" readonly spellcheck=\"false\" value=\""+val+"\">";

          //insert new row before the last row
          var last_row = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row")).reverse()[0];
          this.elem.insertBefore(newNode, last_row);

          //output should be inserted before the last row
          if(val.trim() !== ""){
            var command = val.split(" ")[0];

            //now, remove tags
            var raw_val = val; //keep this...
            val = _prompted_helper.removeTags(val);

            if(command === "cd"){
              this.cd(val.replace("cd","").trim());
            }
            else if(command === "ls"){
              this.ls(val.replace("ls","").trim());
            }
            else if(command === "cat"){
              this.cat(val.replace("cat","").trim());
            }
            else if(command === "clear"){
              this.clear();
            }
            else if(command === "echo"){
              this.echo(val.replace("echo","").trim());
            }
            else if(command === "pwd"){
              this.pwd();
            }
            else if(command === "mkdir"){
              this.mkdir(val.replace("mkdir","").trim());
            }
            else if(command === "touch"){
              this.touch(val.replace("touch","").trim());
            }
            else if(command === "rm"){
            	this.rm(val.replace("rm","").trim());
            }
            else{
              this.print("This command does not exist")
            }
          }

          _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-prompt")).reverse()[0].innerHTML = "<span class=\"prompted-accent-1\">" + this.prompt + "</span>" + "<span class=\"prompted-accent-2\">" + this.path + "</span>";
        }
        this.afterInput(val);
    }
  }.bind(this), false);
}

_prompted.prototype.rm = function(arg){
	if(arg.trim() !== ""){
		arg = arg.split(" ");
		for(var i = 0; i < arg.length; i++){
			var path = this.resolve(this.path, arg[i]);
			var possible = this.findAll(path);
			for(var k = 0; k < possible.length; k++){
				for(var j = 0; j < this.data.length; j++){
					if(_prompted_helper.startsWith(possible[k].path, this.data[j].path)){
						this.data.splice(j, 1);
						j--;
					}
				}
			}
		}
	}
}

_prompted.prototype.touch = function(arg){
  arg = arg.split(" ");
  for(var i = 0; i < arg.length; i++){
    var to_push = {};
    to_push.path = this.resolve(this.path, arg[i]);
    to_push.name = to_push.path.split("/").reverse()[0];
    to_push.parent = _prompted_helper.getParent(to_push.path);
    to_push.folder = false;
    to_push.contents = "";

    if(this.canCd(to_push.parent)){
      if(this.exists(to_push.path)){
        this.print("touch: this file already exists");
      }
      else{
        this.data.push(to_push);
      }
    }
    else{
      this.print("touch: folder not found");
    }
  }
};

_prompted.prototype.mkdir = function(arg){
  arg = arg.split(" ");
  for(var i = 0; i < arg.length; i++){
    var to_push = {};
    to_push.path = this.resolve(this.path, arg[i]);
    to_push.name = to_push.path.split("/").reverse()[0];
    to_push.parent = _prompted_helper.getParent(to_push.path);
    to_push.folder = true;

    if(this.canCd(to_push.parent)){
      if(this.exists(to_push.path)){
        this.print("mkdir: this folder already exists");
      }
      else{
        this.data.push(to_push);
      }
    }
    else{
      this.print("mkdir: folder not found");
    }
  }
};

_prompted.prototype.pwd = function(){
  this.print(this.path);
};

_prompted.prototype.echo = function(text){
  this.print(_prompted_helper.escape(text));
};

_prompted.prototype.clear = function(){
  //remove all rows but the last
  var rows = _prompted_helper.toArray(this.elem.getElementsByClassName("prompted-row"));
  for(var i = 0; i < (rows.length - 1); i++){
    rows[i].parentNode.removeChild(rows[i]);
  }
}

_prompted.prototype.findAll = function(path){
  _path = path.split("/");

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

_prompted.prototype.findFolders = function(path){
  var files = this.findAll(path);
  var ret = [];
  for(var i = 0; i < files.length; i++){
    if(files[i].folder === true){
      ret.push(files[i]);
    }
  }
  return ret;
}

_prompted.prototype.findFiles = function(path){
  var files = this.findAll(path);
  var ret = [];
  for(var i = 0; i < files.length; i++){
    if(files[i].folder === false){
      ret.push(files[i]);
    }
  }
  return ret;
}

_prompted.prototype.cat = function(arg){
  var files = [];
  if(arg !== ""){
    var r_path = this.resolve(this.path, arg);
    files = this.findFiles(r_path);
    if(files.length > 0){
      var text = "";
      for(var i = 0; i < files.length; i++){
        text += ("\n" + _prompted_helper.escape(files[i].contents));
      }

      if(files.length > 0){
        //um...ok
        //now sort by "name"
        this.print(text);
      }
      else{
        this.print("cat: no files found");
      }
    }
    else{
      this.print("cat: no files found");
    }
  }
  else{
    //uh-oh
    this.print("cat: no file specified");
  }
}

_prompted.prototype.ls = function(_path){
    var files = []
    if(_path === ""){
      if(this.path === "/"){
        files = this.findAll("/*");
      }
      else{
        files = this.findAll(this.path + "/*");
      }
    }
    else{
      _path = _path.split(" ");
      //multiple things to search
      //for each of them, also have to evaluate *
      for(var i = 0; i < _path.length; i++){
        var arg = this.resolve(this.path,_path[i]);
        var possible = this.findFolders(arg);
	if(possible.length > 0){
		for(var j = 0; j < possible.length; j++){
			if(possible[j].path === "/"){
				var files_found = this.findFiles("/*");
				files = files.concat(files_found);
			}
			else{
				var files_found = this.findFiles(possible[j].path + "/*"); 
				
				files = files.concat(files_found);
			}
		}
	}
	else{
		this.print("ls: this folder was not found");
	}
      }
    }
    //if anything in files, print it!
	if(files.length > 0){
	    files = files.sort(_prompted_helper.nameSort);
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
	}
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
  for(var i = 1; i <= cd.length; i++){
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
