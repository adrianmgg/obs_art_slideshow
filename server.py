import runpy
import sys

sys.argv.append('8932')

if sys.version_info.major == 3:
    runpy.run_module('http.server', run_name='__main__')
else:
    runpy.run_module('SimpleHTTPServer', run_name='__main__')
