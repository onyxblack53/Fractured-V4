#!/usr/bin/env python3
from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")
pattern=r'(<script\s+type="module"\s+src="\./main\.js\?v=)\d+("\s*></script>)'
new,n=re.subn(pattern,r'\g<1>11\2',s)
if n!=1: raise SystemExit("Expected exactly one main module tag; index.html unchanged")
diagnostics='''<script>
window.addEventListener("error",function(e){
 var box=document.getElementById("fractured-boot-error");
 if(!box){box=document.createElement("pre");box.id="fractured-boot-error";
 box.style.cssText="position:fixed;z-index:99999;left:12px;right:12px;bottom:12px;white-space:pre-wrap;padding:14px;background:#290b0b;color:#fff;border:1px solid #c88;font:13px monospace;";
 document.body.appendChild(box);}
 box.textContent="FRACTURED startup error: "+(e.message||"JavaScript load error");
});
</script>
'''
if 'id="fractured-boot-error"' not in new:
 new=new.replace('<script type="module" src="./main.js?v=11"></script>',diagnostics+'<script type="module" src="./main.js?v=11"></script>')
p.write_text(new,encoding="utf-8")
print("Updated index.html to v11 and added visible error diagnostics.")
