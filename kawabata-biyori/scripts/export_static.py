"""
next start で動かしたサイトを wget で写したファイルを、GitHub Pages で配れる静的ページに整える。
  python3 scripts/export_static.py <写したフォルダ> <ポート>
- JavaScript とフォントの分割ファイルを外し、Google Fonts に置き換える
- localhost への絶対URLを、ページ同士の相対リンクに直す
- スマホのメニュー開閉だけは小さなスクリプトで動かす
- 「本日営業のお店」があるページには public/js の営業判定スクリプトを入れる（js/ は書き出しのあとで写す）
"""
import os, re, sys, posixpath
root = sys.argv[1]
PORT = sys.argv[2] if len(sys.argv) > 2 else "3100"
os.chdir(root)
# 表示を軽くするため、本文のゴシック（Noto Sans JP）と丸ゴシックは読み込まず、スマホ・パソコンに入っている日本語フォントで表示する。
# 見出しの明朝（Zen Old Mincho）と英字（Cormorant Garamond）だけを読み込む
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap">'
OVR = '<style>html[class]{--font-zen-maru:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic Medium","Yu Gothic","Meiryo","Noto Sans JP",sans-serif;--font-noto-sans:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic Medium","Yu Gothic","Meiryo","Noto Sans JP",sans-serif;--font-cormorant:"Cormorant Garamond","Times New Roman",serif;--font-old-mincho:"Zen Old Mincho","Hiragino Mincho ProN",serif}</style>'
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
    # JavaScript は外す。ただし検索エンジン向けの構造化データ（JSON-LD）は残す
    s = re.sub(r'<script\b(?![^>]*application/ld\+json)[^>]*>.*?</script>', '', s, flags=re.S)
    s = re.sub(r'<link[^>]+rel="(preload|modulepreload)"[^>]*>', '', s)
    s = s.replace('地図を読み込んでいます…', '')
    s = re.sub(r'<div class="grid h-80 w-full place-items-center rounded-3xl bg-beige text-sm text-muted">\s*</div>', MAPNOTE, s)
    base = posixpath.dirname(rel)
    from urllib.parse import unquote
    s = re.sub(r'\s(srcset|srcSet|imageSrcSet|imagesizes|sizes)="[^"]*"', '', s)
    s = re.sub(r'src="(?:https?://localhost:' + PORT + r')?/_next/image\?url=([^&"]+)[^"]*"', lambda m: 'src="' + posixpath.relpath(unquote(m.group(1)).lstrip('/'), base or '.') + '"', s)
    def fix(m):
        attr, url = m.group(1), m.group(2)
        rest = re.sub(r'^https?://localhost:' + PORT, '', url).split('#')[0]
        path, _, query = rest.partition('?')
        path = path.strip('/')
        target = (path + '.html') if path else 'index.html'
        if target not in existing: return f'{attr}="#"'
        # ?category=bar などの条件は残す（ページのスクリプトが読んで絞り込む）
        return f'{attr}="{posixpath.relpath(target, base or ".")}' + (('?' + query) if query else '') + '"'
    s = re.sub(r'(href|action)="(https?://localhost:' + PORT + r'[^"]*)"', fix, s)
    extra = ''
    js = posixpath.relpath('js', base or '.')
    if 'data-kb-today=' in s:
        extra = f'<script src="{js}/kawabata-hours.js"></script><script src="{js}/kawabata-today.js"></script>'
    if 'data-kb-filter=' in s or 'data-kb-contact' in s:
        extra += f'<script src="{js}/kawabata-site.js"></script>'
    s = s.replace('</head>', FONTS + OVR + '</head>', 1).replace('</body>', MENU + extra + '</body>', 1)
    open(rel,'w',encoding='utf-8').write(s)
print(len(htmls), 'pages')
