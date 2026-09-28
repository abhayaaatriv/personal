import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
U='/root/.claude/uploads/354156b9-6094-5c6c-b972-74851b2ea05e/'
O='/tmp/claude-0/-home-claude/354156b9-6094-5c6c-b972-74851b2ea05e/scratchpad/new/'
def save(im,name): im.save(O+name)
def bgdist(a,bg): return np.abs(a.astype(np.int16)-np.array(bg,dtype=np.int16)).max(axis=2)
def with_alpha(im,mask,blur=0.8,erode=1):
    if erode: mask=ndi.binary_erosion(mask,iterations=erode)
    al=Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    out=im.convert('RGB').copy(); out.putalpha(al); return out
def trim(im,pad=2):
    bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    return im.crop((max(0,bb[0]-pad),max(0,bb[1]-pad),min(im.width,bb[2]+pad),min(im.height,bb[3]+pad)))

# ---- vinyl: circular cutout
v=Image.open(U+'e8b6c05f-image.png').convert('RGB'); a=np.asarray(v)
fg=bgdist(a,[255,255,255])>40
fg=ndi.binary_opening(fg,iterations=2)
ys,xs=np.where(fg); cx=(xs.min()+xs.max())/2; cy=(ys.min()+ys.max())/2; r=((xs.max()-xs.min())+(ys.max()-ys.min()))/4
print('vinyl centre',cx,cy,'r',r)
yy,xx=np.mgrid[0:a.shape[0],0:a.shape[1]]
disc=((xx-cx)**2+(yy-cy)**2)<=(r-2)**2
save(trim(with_alpha(v,disc,blur=1.0,erode=0)),'vinyl.png')

# ---- bag: keep big handle-loop hole transparent, fill only small holes
b=Image.open(U+'4122d435-image.png').convert('RGB'); a=np.asarray(b)
border=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]); bg=np.median(border,axis=0); print('bag bg',bg)
d=bgdist(a,bg); fg=d>16
fg=ndi.binary_closing(fg,iterations=1)
holes=~fg; lab,n=ndi.label(holes)
sizes=ndi.sum(holes,lab,range(1,n+1))
for i,s in enumerate(sizes,1):
    if s<30000: fg[lab==i]=True
lab2,n2=ndi.label(fg); sz=ndi.sum(fg,lab2,range(1,n2+1)); fg=lab2==(1+int(np.argmax(sz)))
fg=ndi.binary_opening(fg,iterations=1)
bagim=trim(with_alpha(b,fg,blur=0.9,erode=1)); save(bagim,'bag.png'); print('bag size',bagim.size)
# top-edge profile of the body (for placing items)
al=np.asarray(bagim.getchannel('A'))>128
H,W=al.shape
for xf in (0.05,0.15,0.25,0.35,0.5,0.65,0.75,0.85,0.95):
    x=int(W*xf); col=al[:,x]; 
    # find first opaque run below y>0.3H (body), and list transitions
    tr=np.where(np.diff(col.astype(int))!=0)[0]
    print(f'x={xf:.2f}', [int(t) for t in tr][:8])

# ---- Sony cybershot
s=Image.open(U+'aca4a8c3-image.png').convert('RGB'); a=np.asarray(s)
fg=bgdist(a,[255,255,255])>28; fg=ndi.binary_closing(fg,iterations=2); fg=ndi.binary_fill_holes(fg); fg=ndi.binary_opening(fg,iterations=2)
lab,n=ndi.label(fg); sz=ndi.sum(fg,lab,range(1,n+1)); fg=lab==(1+int(np.argmax(sz)))
save(trim(with_alpha(s,fg,blur=0.8,erode=1)),'sony.png')

# ---- camcorder
c=Image.open(U+'f78fa1b9-image.png').convert('RGB'); a=np.asarray(c).astype(np.float32)
lum=a.mean(axis=2)
fg=lum<95
fg=ndi.binary_closing(fg,iterations=3); fg=ndi.binary_fill_holes(fg); fg=ndi.binary_opening(fg,iterations=3)
lab,n=ndi.label(fg); sz=ndi.sum(fg,lab,range(1,n+1)); fg=lab==(1+int(np.argmax(sz)))
fg=ndi.binary_fill_holes(fg)
save(trim(with_alpha(c,fg,blur=1.2,erode=1)),'camcorder.png')

# ---- chrome A from sticker sheet (transparent counter kept)
sh=Image.open(U+'deb1aedc-image.png'); print('sheet mode',sh.mode, 'alpha extrema', sh.getchannel('A').getextrema() if sh.mode=='RGBA' else None)
sh=sh.convert('RGBA'); bgw=Image.new('RGBA',sh.size,(255,255,255,255)); bgw.alpha_composite(sh); sh=bgw.convert('RGB')
crop=sh.crop((420,780,780,1150)); a=np.asarray(crop)
d=bgdist(a,[255,255,255]); fg=d>14
fg=ndi.binary_closing(fg,iterations=2)
holes=~fg; lab,n=ndi.label(holes); sizes=ndi.sum(holes,lab,range(1,n+1))
# fill only small enclosed holes (specular highlights); keep border-connected bg and the big counter
for i,s_ in enumerate(sizes,1):
    m=lab==i
    touches=m[0].any() or m[-1].any() or m[:,0].any() or m[:,-1].any()
    if not touches and s_<900: fg[m]=True
lab2,n2=ndi.label(fg); sz=ndi.sum(fg,lab2,range(1,n2+1)); fg=lab2==(1+int(np.argmax(sz)))
save(trim(with_alpha(crop,fg,blur=0.8,erode=1)),'A.png')
for f in ['vinyl','bag','sony','camcorder','A']:
    im=Image.open(O+f+'.png'); print(f,im.size)
