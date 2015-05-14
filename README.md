# PROMPTED

Vanilla JS terminal made easy

## Usage
First import the basic CSS and a theme
```html
<link rel="stylesheet" href="../css/prompted.css">
<link rel="stylesheet" href="../css/prompted-default.css">
```
And create the element(s) you want to use
```html
<div id="main">
</div>
```

Then import the javascript
```html
<script src="../js/prompted.js"></script>
```

Then, create the actual element. This will return an array of `_prompted` objects.
```javascript
var terminal = prompted(document.getElementById("main"),{
	/*
	options go here!
	*/
})[0];
```

## Options
+ `prompt:string` The text in front of the input. By default, it's `root@localhost`
+ `beforeInput:function(val)` This function will be called before the input is evaluated
+ `afterInput:function(val)` This function will be called after the input is evaluated
+ `disable:boolean` Setting this to `true` will keep the input from being evaluated
+ `data:Array` The "file structure" of the terminal. See [data](#data)
+ `path:string` The starting path of the terminal. `/` by default
+ `specialExt:Array` An array of file extensions. These will be, for example, highlighted when the `ls` command is used. By default, is `["png","jpeg","JPEG","tiff","gif","mp3","mp4","mov","svg"]`

All of these can be changed simply by doing something like:
```javascript
terminal.prompt = "$";
```

## Data
No terminal would be complete without some file structure. Fortunately, you can simulate this with an array of objects. The way to do this is pretty flexible.
```javascript
var files = [
	{
		path: "index.html",
		folder: false,
		contents: "<h1>hi</h1>"	 /*required in a file*/
	},
	{
		path: "folder/file.txt",
		folder: false,
		contents: "foobar"
	},
	{
		path: "folder",
		folder: true
	},
	{
		path: "baz",
		folder: true,
		contents: [ /*can specific in a folder*/
			{
				path: "test.html",
				folder: false,
				contents: "<b>testing!</b>"
			}
		]
	}
];
```
You can pass such an array as the `data` attribute of

## Built-in Functions
+ `_prompted.clear()` This will clear all of the lines
+ `_prompted.findFiles(path)` This will return an array of files (and folders) which match `path`. `path` can also have wildcards(`*`)
+ `_prompted.cat(path)` This will list the `contents` of each of the files matching `path`, which can have wildcards
+ `_prompted.ls(path)` If `path` is `""`, it will display the contents of the current directory. Otherwise, it will display the files contained in the directory `path`
+ `_prompted.print(text)` Will print `text`, which can have multiple lines, as it is wrapped in a `<pre>` element. Any html will not be escaped
+ `_prompted.insert(html)` Will insert `html` into a row directly, without a `<pre>` element. Any html will not be escaped
+ `_prompted.resolve(path, to_resolve)` Will give the absolute path of `to_resolve` given that the current directory is `path`
+ `_prompted.cd(path)` Will change the directory
+ `_prompted.canCd(path)` Will check if `path` exists and is a directory
+ `_prompted.readTree(tree, path)` Will insert `tree` into the file tree at point `path`. To insert at root, `path` should be `"/"`
