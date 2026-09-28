"""Builds the site from src/ and data/diary.csv.

  python3 build.py

Writes:
  index.html     full page, ready for GitHub Pages
  artifact.html  the fragment as published on claude.ai (no <html>/<head>)
"""
import csv, json, os
here = os.path.dirname(os.path.abspath(__file__))
p = lambda *a: os.path.join(here, *a)

movies = []
with open(p('data', 'diary.csv'), newline='', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        movies.append({
            'id': r['Letterboxd URI'] or ('m%d' % len(movies)),
            'name': r['Name'], 'year': int(r['Year']) if r['Year'] else None,
            'rating': float(r['Rating']) if r['Rating'] else 0,
            'watched': r['Watched Date'], 'logged': r['Date'],
            'uri': r['Letterboxd URI'], 'rewatch': r['Rewatch'].strip().lower() == 'yes',
            'review': '', 'tags': ''})
state = {'v': 1, 'movies': movies, 'posts': [], 'settings': {'spotify': '', 'spotifyLabel': '', 'tagline': ''}}
sj = (json.dumps(state, ensure_ascii=False).replace('<', '\\u003c')
      .replace('\u2028', '\\u2028').replace('\u2029', '\\u2029'))
css = open(p('src', 'style.css'), encoding='utf-8').read()
js = open(p('src', 'app.js'), encoding='utf-8').read().replace('__STK__', open(p('src', 'stickers.json')).read())

fragment = ('<title data-s>Abhaya\'s Bag</title>\n'
            '<link data-s rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@500;700&display=swap">\n'
            '<style data-s id="appstyle">\n' + css + '\n</style>\n'
            '<div data-s id="root"></div>\n'
            '<script data-s id="state" type="application/json">' + sj + '</script>\n'
            '<script data-s id="app">\n' + js + '\n</script>\n')
open(p('artifact.html'), 'w', encoding='utf-8').write(fragment)

reset = ('*{box-sizing:border-box}:root{color-scheme:light}html,body{margin:0;height:100%}'
         'body{font:14px system-ui,sans-serif;background:#f0607c}img{max-width:100%}[hidden]{display:none!important}')
page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>' + reset + '</style>\n</head>\n<body>\n' + fragment + '</body>\n</html>\n')
open(p('index.html'), 'w', encoding='utf-8').write(page)
print('built index.html (%d KB), %d films' % (len(page) // 1024, len(movies)))
