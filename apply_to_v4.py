#!/usr/bin/env python3
"""Run in your Fractured-V4 repository folder. Patches existing files only."""
from pathlib import Path
p=Path('player.js')
s=p.read_text()
old='"./angelKnightSpriteRenderer.js?v=8"'
new='"./angelKnightSpriteRenderer.js?v=9"'
if old not in s and new not in s: raise SystemExit('Unexpected player.js import. Check current V4 before patching.')
p.write_text(s.replace(old,new))
p=Path('index.html')
s=p.read_text()
if './main.js?v=2' not in s and './main.js?v=9' not in s: raise SystemExit('Unexpected index.html main.js reference.')
p.write_text(s.replace('./main.js?v=2','./main.js?v=9'))
print('Patched player.js and index.html cache versions.')
