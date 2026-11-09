"""
next start で動かしたサイトを wget で写したファイルを、GitHub Pages で配れる静的ページに整える。
  python3 scripts/export_static.py <写したフォルダ> <ポート>
- JavaScript とフォントの分割ファイルを外し、Google Fonts に置き換える
- localhost への絶対URLを、ページ同士の相対リンクに直す
- スマホのメニュー開閉だけは小さなスクリプトで動かす
"""
import os, re, sys, posixpath
root = sys.argv[1]
PORT = sys.argv[2] if len(sys.argv) > 2 else "3100"
os.chdir(root)
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&family=Zen+Old+Mincho:wght@500;700;900&family=Noto+Sans+JP:wght@400;500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap">'
OVR = '<style>html[class]{--font-zen-maru:"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif;--font-noto-sans:"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif;--font-cormorant:"Cormorant Garamond","Times New Roman",serif;--font-old-mincho:"Zen Old Mincho","Hiragino Mincho ProN",serif}</style>'
MENU = '<script>document.addEventListener("click",function(e){var b=e.target.closest("[aria-controls=mobile-menu]");if(!b)return;var m=document.getElementById("mobile-menu");var o=m.hidden;m.hidden=!o;b.setAttribute("aria-expanded",String(o));});</script>'
MAPNOTE = '<div class="grid w-full place-items-center rounded-3xl bg-beige px-6 text-center text-sm text-muted" style="height:320px">このページでは地図は表示されません。<br>実際のサイトでは OpenStreetMap の地図にお店の位置が表示されます。</div>'
for d,_,fs in os.walk('.'):
    for f in fs:
        p = os.path.join(d,f)
        if p.endswith(('.js','.woff2')) or f in ('robots.txt',):
            os.remove(p); continue
        if p.endswith('.css'):
            s = open(p,encoding='utf-8').read()
            s = re.sub(r'@font-face\{[^}]*\}', '', s)
            open(p,'w',encoding='utf-8').write(s)
htmls = [os.path.join(d,f)[2:] for d,_,fs in os.walk('.') for f in fs if f.endswith('.html')]
existing = set(htmls)
for rel in htmls:
    s = open(rel,encoding='utf-8').read()
    s = re.sub(r'<script\b[^>]*>.*?</script>', '', s, flags=re.S)
    s = re.sub(r'<link[^>]+rel="(preload|modulepreload)"[^>]*>', '', s)
    s = s.replace('地図を読み込んでいます…', '')
    s = re.sub(r'<div class="grid h-80 w-full place-items-center rounded-3xl bg-beige text-sm text-muted">\s*</div>', MAPNOTE, s)
    base = posixpath.dirname(rel)
    from urllib.parse import unquote
    s = re.sub(r'\s(srcset|srcSet|imageSrcSet|imagesizes|sizes)="[^"]*"', '', s)
    s = re.sub(r'src="(?:https?://localhost:' + PORT + r')?/_next/image\?url=([^&"]+)[^"]*"', lambda m: 'src="' + posixpath.relpath(unquote(m.group(1)).lstrip('/'), base or '.') + '"', s)
    def fix(m):
        attr, url = m.group(1), m.group(2)
        path = re.sub(r'^https?://localhost:' + PORT, '', url).split('#')[0].split('?')[0].strip('/')
        target = (path + '.html') if path else 'index.html'
        if target not in existing: return f'{attr}="#"'
        return f'{attr}="{posixpath.relpath(target, base or ".")}"'
    s = re.sub(r'(href|action)="(https?://localhost:' + PORT + r'[^"]*)"', fix, s)
    s = s.replace('</head>', FONTS + OVR + '</head>', 1).replace('</body>', MENU + '</body>', 1)
    open(rel,'w',encoding='utf-8').write(s)
print(len(htmls), 'pages')
