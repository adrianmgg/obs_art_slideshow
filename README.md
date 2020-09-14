## installation/obs setup
 1. download the newest build, or download the repository and built it yourself (see building instructions)
 2. download [node.js](https://nodejs.org/)
 3. download [http-server](https://www.npmjs.com/package/http-server)
 4. start http-server with the path to this repository from step 1
     - remember the port http-server is running on for later (defaults to 8080 if not specified)
 5. open obs
 6. create a new browser source
     - set the URL to `localhost:` + http-server's port + `/?theme=` + the name of the theme you want to use. should look something like `localhost:8080/?theme=mar`
     - delete whatever's in the custom css field
     - I would suggest enabling 'shutdown source when not visible'

## building instructions
coming soon

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
documentation coming soon

### slideshow_theme.css
documentation coming soon

### theme_config.json
|key|description|valid values|mandatory|default value|
|---|-----------|------------|---------|-------------|
|imageIdleTime|how long to show each image for|any positive number|yes||
