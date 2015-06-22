prompted.prototype.nanoCommands = [88,79];
prompted.prototype.nanoCommandDesc = ["Exit","WriteOut"];
prompted.prototype.nanoPath = null;
prompted.prototype.nano = function(arg){
  if(arg !== ""){
    arg = arg.split(" ");
    if(arg.length > 1){
      this.print("nano: only 1 file can be passed");
    }
    else{
      var path = _prompted_helper.resolve(this.path, arg[0]);
      this.nanoPath = path;
      var reg = this.regexp(path);
      var file = null;
      for(var i = 0; i < this.data.length; i++){
        if(reg.test(this.data[i].path) === true && path.split("/").length === this.data[i].path.split("/").length && this.data[i].folder === false){
            file = this.data[i];
        }
      }

      if(file === null){
        //um...have to create it?
        this.CREATE(path, false, "");
        file = {
          path: path,
          folder: false,
          contents: ""
        };
      }

      if(file !== null){
        var color = _prompted_helper.getStyle(this.elem, "color");
        var background_color = _prompted_helper.getStyle(this.elem, "background-color");
        var contents = _prompted_helper.escape(file.contents);
        var bottom = "<div>";
        bottom += "<div class=\"prompted-nano-commands\">";
        for(var i = 0; i < this.nanoCommands.length; i++){
          bottom += "<h5><span>^" + String.fromCharCode(this.nanoCommands[i]).toUpperCase() + "</span>" + this.nanoCommandDesc[i] + "</h5>"
        }
        bottom += "</div>";
        bottom += "<div class=\"prompted-nano-input\" style=\"display:none\">";
        bottom += "<div class=\"InputAddon\"><span class=\"InputAddonItem\" style=\"margin: 0 !important\"></span>";
        bottom += "<input type=\"text\" class=\"InputAddonField\" onfocus=\"this.value = this.value;\">";
        bottom += "</div>"
        bottom += "<h5><span>^C</span>Cancel</h5>";
        bottom += "</div>";

        var html = "<div class=\"prompted-nano\" style=\"color:" + color + ";background-color:" + background_color + "\"><textarea style=\"color:"+color+"\" spellcheck=\"false\">"+contents+"</textarea>"+bottom+"</div>";
        this.elem.innerHTML += html;

        this.nano.elem = this.elem.querySelector(".prompted-nano");
        this.nano.input = this.elem.querySelector(".prompted-nano textarea");
        this.nano.edited = false;
        this.nanoBind();
      }
      else{
        this.print("nano: no file found");
      }
    }
  }
  else{
    this.print("nano: no file specified");
  }
}

prompted.prototype.nanoCtrlX = function(){
  //this.nano.quit(); eventually...
  if(this.nano.edited === false){
    //no edited
    this.nanoQuit();
  }
  else{
    //edited
    this.nanoAsk("File Name to Write:", this.nanoPath, function(val){
      //write
      if(this.exists(val) === false){
        this.CREATE(val, false, "");
      }
      this.WRITE(val, this.nano.input.value);
      this.nanoPath = val;

      this.nanoQuit();
    }.bind(this));
  }
};

prompted.prototype.nanoCtrlO = function(){
  this.nanoAsk("File Name to Write:", this.nanoPath, function(val){
    //write
    if(this.exists(val) === false){
      this.CREATE(val, false, "");
    }
    this.WRITE(val, this.nano.input.value);
    this.nanoPath = val;
    this.nanoAskClose();

  }.bind(this));
};

prompted.prototype.nanoAsk = function(val, start, callback){
  this.nano.elem.getElementsByClassName("prompted-nano-commands")[0].style.display = "none";
  this.nano.elem.getElementsByClassName("prompted-nano-input")[0].style.display = "block";
  this.nano.elem.getElementsByClassName("InputAddonItem")[0].innerHTML = val;
  this.nano.elem.getElementsByClassName("InputAddonField")[0].value = start;
  this.nano.elem.getElementsByClassName("InputAddonField")[0].focus();

  this.nano.elem.getElementsByClassName("InputAddonField")[0].addEventListener("keydown", function(e){
    e.which = e.which || e.keyCode;
    if(e.ctrlKey && e.which === 67) {
      //Cancel
      this.nanoAskClose();
      this.nanoBind();
    }
    else if(e.which === 13){
      callback(this.nano.elem.getElementsByClassName("InputAddonField")[0].value);
    }
  }.bind(this), false);
};

prompted.prototype.nanoAskClose = function(){
  this.nano.elem.getElementsByClassName("prompted-nano-commands")[0].style.display = "flex";
  this.nano.elem.getElementsByClassName("prompted-nano-input")[0].style.display = "none";
  this.nano.input.focus();
};

prompted.prototype.nanoQuit = function(){
  this.nanoPath = null;
  this.nano.edited = false;
  this.nano.elem.remove();
  this.bindInput();
};

prompted.prototype.nanoBind = function(){
  this.nano.input.addEventListener("keydown", function(e){
    e.which = e.which || e.keyCode;
    if(e.ctrlKey) {
      if(this.nanoCommands.indexOf(e.which) !== -1){
        var commandName = "nanoCtrl" + String.fromCharCode(e.which).toUpperCase();
        if(_prompted_helper.exists(this[commandName])){
          this[commandName]();
        }
      }
    }
    else{
      //something else to type
      this.nano.edited = true;
      if (e.which === 9) { // tab was pressed
          // get caret position/selection
          var val = this.nano.input.value,
              start = this.nano.input.selectionStart,
              end = this.nano.input.selectionEnd;
          // set textarea value to: text before caret + tab + text after caret
          this.nano.input.value = val.substring(0, start) + '\t' + val.substring(end);
          // put caret at right position again
          this.nano.input.selectionStart = this.nano.input.selectionEnd = start + 1;
      }
    }
    this.nano.input.focus();
  }.bind(this), false);
}

prompted.prototype.nanoText = function(){
  return this.nano.input.value;
};

prompted.prototype.nanoCommandExists = function(key){
  return this.nanoCommands.indexOf(key) !== -1
};

prompted.prototype.nanoCreateCommand = function(key, desc, callback){
  if(this.nanoCommandExists(key) === false){
    
  }
  else{
    throw "Command already exists";
  }
};
