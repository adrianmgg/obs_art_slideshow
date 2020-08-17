## Instructions
### installation/obs setup
 1. download this repository
 2. download [node.js](https://nodejs.org/)
 3. download [http-server](https://www.npmjs.com/package/http-server)
 4. start http-server with the path to this repository from step 1
     - when you start http-server, it will print out `Available on:` followed by the urls you can use to access the page, you'll need one of those (shouldn't matter which) later
 5. open obs
 6. create a new browser source
     - set the URL to the url from http-server in step 4
     - delete whatever's in the custom css field
     - I would suggest enabling 'shutdown source when not visible'

### images.json
#### documentation
|key|description|valid values|mandatory|default|
|-|-|-|-|-|
|path|path to the file, relative to the root folder of the repository|string, must be a valid url|yes||
|artist|artist's name for providing credit|any string|yes||
|type|what type of file is it|"image" or "video"|no|"image"|

#### example
```json
[
	{"path":"images/example.png", "artist":"somebody", "type":"image"},
	{"path":"images/subfolder/example2.jpg", "artist":"somebody else"},
	{"path":"images/video.webm", "artist":"another person", "type":"video"}
]
```
### changing the style
currently, the only way to adjust the style is to manually edit `style.css`.
