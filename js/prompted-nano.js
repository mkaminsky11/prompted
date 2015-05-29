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
      var index = null;
      for(var i = 0; i < this.data.length; i++){
        if(reg.test(this.data[i].path) === true && path.split("/").length === this.data[i].path.split("/").length && this.data[i].folder === false){
            index = i;
        }
      }

      if(index === null){
        //um...have to create it?
      }

      if(index !== null){
        var color = _prompted_helper.getStyle(this.elem, "color");
        var background_color = _prompted_helper.getStyle(this.elem, "background-color");
        var contents = _prompted_helper.escape(this.data[index].contents);
        var bottom = "<div><h6><span>[Read " + contents.split("\n").length + " lines]</span></h6>";
        bottom += "<div class=\"prompted-nano-commands\">";
        for(var i = 0; i < this.nanoCommands.length; i++){
          bottom += "<h5><span>^" + String.fromCharCode(this.nanoCommands[i]).toUpperCase() + "</span>" + this.nanoCommandDesc[i] + "</h5>"
        }
        bottom += "</div>";
        var html = "<div class=\"prompted-nano\" style=\"color:" + color + ";background-color:" + background_color + "\"><textarea style=\"color:"+color+"\" spellcheck=\"false\">"+contents+"</textarea>"+bottom+"</div>";
        this.elem.innerHTML += html;

        this.nano.elem = this.elem.querySelector(".prompted-nano");
        this.nano.input = this.elem.querySelector(".prompted-nano textarea");
        this.nano.edited = false;
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
          }
        }.bind(this), false);
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
  }
};

prompted.prototype.nanoCtrlO = function(){

};

prompted.prototype.nanoQuit = function(){
  this.nanoPath = null;
  this.nano.edited = false;
  this.nano.elem.remove();

  this.bindInput();
};
