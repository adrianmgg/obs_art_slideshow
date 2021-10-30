import sys, argparse, runpy

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8932, help='specify which port to use, or pass 0 to get an arbitrary unused port')
args = parser.parse_args()

def expand_mimetype_map(foo):
    ret = {}
    for extensions, mimetype in foo:
        if isinstance(extensions, str):
            ret[extensions] = mimetype
        else:
            for extension in extensions:
                ret[extension] = mimetype
    return ret
mimetype_map = expand_mimetype_map([
    # js
    ['.js', 'application/javascript'],
    # image types
    [['.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp'], 'image/jpeg'],
    ['.apng', 'image/apng'],
    ['.gif', 'image/gif'],
    ['.avif', 'image/avif'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.webp', 'image/webp'],
    # audio & video TODO
])

if sys.version_info.major == 2:
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from SocketServer import ThreadingMixIn
    from BaseHTTPServer import HTTPServer
else:
    from http.server import HTTPServer, SimpleHTTPRequestHandler
    from socketserver import ThreadingMixIn

class Server(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class RequestHandler(SimpleHTTPRequestHandler):
    extensions_map = mimetype_map

httpd = Server(('', args.port), RequestHandler)
print('serving on port {}'.format(args.port))
httpd.serve_forever()
