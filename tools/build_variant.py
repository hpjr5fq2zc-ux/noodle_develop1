# Build a variant (personal / friends) from the dev copy.
import sys,shutil,os,re
SRC='/home/claude/noodle_develop1/'
which,DST=sys.argv[1],sys.argv[2]
V={'personal':dict(name='Noodle',key='noodle-v1',flags='noodle-flags',cache='noodle-v',clean=r"/^noodle-v\d/.test(k)",quotes=True,gallery=True,noindex=False),
   'friends':dict(name='Noodle',key='noodle-friends-v1',flags='noodle-friends-flags',cache='noodle-friends-v',clean="k.indexOf('noodle-friends-v') === 0",quotes=False,gallery=False,noindex=True)}[which]
ver=int(sys.argv[3])
os.makedirs(DST+'fonts',exist_ok=True)
for f in ['app.js','runtime.js','preact.min.js','index.html','gallery.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','fonts/it-latin.woff2','fonts/it-latin-ext.woff2','fonts/OFL.txt']:
    shutil.copy(SRC+f,DST+f)
def ed(f,o,n,c=None):
    s=open(DST+f).read()
    if c is not None: assert s.count(o)==c,(f,s.count(o),o[:60])
    else: assert o in s,(f,o[:60])
    open(DST+f,'w').write(s.replace(o,n))
ed('app.js',"'noodle-dev-v1'","'%s'"%V['key'],2)
ed('gallery.html',"'noodle-dev-flags'","'%s'"%V['flags'],1)
ed('index.html','<title>Noodle Dev</title>','<title>%s</title>'%V['name'],1)
ed('index.html','content="Noodle Dev"','content="%s"'%V['name'],1)
ed('manifest.webmanifest','"Noodle Dev"','"%s"'%V['name'],2)
s=open(DST+'index.html').read(); s=re.sub(r'\?v=\d+','?v=%d'%ver,s); open(DST+'index.html','w').write(s)
s=open(DST+'gallery.html').read(); s=re.sub(r'\?v=\d+','?v=%d'%ver,s); open(DST+'gallery.html','w').write(s)
s=open(DST+'sw.js').read()
s=re.sub(r"const CACHE = '[^']+';","const CACHE = '%s%d';"%(V['cache'],ver),s)
s=s.replace("k.indexOf('noodle-dev') === 0",V['clean']); assert V['clean'] in s
open(DST+'sw.js','w').write(s)
if V['quotes']:
    ed('app.js',"['Feeling', 'bendy?']","['Feeling', 'groovy?']",1)
    ed('app.js',"['Long dog,', 'long', 'stretch.'],\n      ['Every', 'body', 'counts.'], ['Move', 'now,', 'snack', 'later.']",
       "['See you,', 'space', 'cowboy...'],\n      ['Whatever', 'happens,', 'happens.'], ['They say', 'hunger is', 'the best', 'spice.']",1)
if not V['gallery']:
    s=open(DST+'index.html').read()
    s2=re.sub(r'\n    <a href="gallery.html"[^\n]*Check all animations[^\n]*</a>','',s); assert s2!=s
    open(DST+'index.html','w').write(s2)
    os.remove(DST+'gallery.html')
    ed('sw.js',", 'gallery.html'","",1)
if V['noindex']:
    ed('index.html','<meta charset="utf-8">','<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow">',1)
    open(DST+'robots.txt','w').write('User-agent: *\nDisallow: /\n')
print('built',which,ver)
