_prompted.prototype.nano = function(arg){
  if(arg !== ""){
    arg = arg.split(" ");
    if(arg.length > 1){
      this.print("nano: only 1 file can be passed");
    }
    else{
      var path = _prompted_helper.resolve(this.path, arg[0]);
      var reg = this.regexp(path);
      var index = null;
      for(var i = 0; i < this.data.length; i++){
        if(reg.test(this.data[i].path) === true && path.split("/").length === this.data[i].path.split("/").length && this.data[i].folder === false){
            index = i;
        }
      }

      if(index !== null){
        var color = _prompted_helper.getStyle(this.elem, "color");
        var background_color = _prompted_helper.getStyle(this.elem, "background-color");

        var contents = _prompted_helper.escape(this.data[index].contents);

        var bottom = "<div><h6><span>[Read " + contents.split("\n").length + " lines]</span></h6>";

        var html = "<div class=\"prompted-nano\" style=\"color:" + color + ";background-color:" + background_color + "\"><textarea style=\"color:"+color+"\" spellcheck=\"false\">"+contents+"</textarea>"+bottom+"</div>";
        this.elem.innerHTML += html;

        this.nano.elem = this.elem.querySelector(".prompted-nano");
        this.nano.input = this.elem.querySelector(".prompted-nano textarea");
        this.nano.input.addEventListener("keydown", function(e){
          e.which = e.which || e.keyCode;
          if(e.which == 88 && e.ctrlKey) {
            //this.nano.quit(); eventually...
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
