## installation/obs setup
 1. download the newest build, or download the repository and built it yourself (see building instructions)
 1. download python (either 2 or 3)
 1. run the `server.py` file in the root of the repository
 1. open obs
 1. create a new browser source
     - set the URL to `localhost:8932/?theme=` + the name of the theme you want to use. should look something like `localhost:8932/?theme=mar`
     - delete whatever's in the custom css field
     - I would suggest enabling 'shutdown source when not visible'

## building instructions
 1. download node.js
 1. clone the respository
 1. in the root of the repository, run `npm install`
 1. to build, run `npx tsc`
 1. to lint, run `npx eslint ./src --ext .ts`
 

## images.json
### documentation
|key|description|valid values|mandatory|default value|valid on which types|
|---|-----------|------------|---------|-------------|--------------------|
|type|what type of entry is it|"image", "video", or "group"|no|"image"|n/a|
|path|path to the file, relative to the root folder of the repository|string, must be a valid url|yes||image, video|
|artist|artist's name for providing credit|any string|yes||image, video|
|entries|group entries|list of valid images.json entries|yes||group|

### example
```json
[
	{"path":"images/example.png", "artist":"somebody", "type":"image"},
	{"path":"images/subfolder/example2.jpg", "artist":"somebody else"},
	{"type":"group", "entries":[
		{"path":"images/image1.png", "artist":"artist name"},
		{"path":"images/image2.png", "artist":"artist name"}
	]},
	{"path":"images/video.webm", "artist":"another person", "type":"video"}
]
```

## creating themes
### slideshow_template.html
documentation coming soon, for now see example themes for reference

### slideshow_theme.css
documentation coming soon, for now see example themes for reference

### slideshow_script.js
documentation coming soon, for now see example themes for reference

### theme_config.json
|key|description|valid values|mandatory|default value|
|---|-----------|------------|---------|-------------|
|imageIdleTime|how long to show each image for|any positive number|yes||
