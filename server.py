import sys, argparse, runpy

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8932, help='specify which port to use, or pass 0 to get an arbitrary unused port')
args = parser.parse_args()

sys.argv[1:] = [str(args.port)]

if sys.version_info.major == 3:
    runpy.run_module('http.server', run_name='__main__')
else:
    runpy.run_module('SimpleHTTPServer', run_name='__main__')
