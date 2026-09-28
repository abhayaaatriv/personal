import numpy as np, sys, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SRC = '/mnt/user-data/uploads/'
OUT = '/tmp/claude-0/-home-claude/354156b9-6094-5c6c-b972-74851b2ea05e/scratchpad/stk/'

def cut(fname, prefix, min_area, close=5, thresh=26, order='yx'):
    im = Image.open(SRC + fname).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    # background colour = median of border pixels
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.abs(a - bg).max(axis=2)
    fg = dist > thresh
    fg = ndi.binary_closing(fg, structure=np.ones((close, close)))
    fg = ndi.binary_fill_holes(fg)
    fg = ndi.binary_opening(fg, structure=np.ones((3, 3)))
    lab, n = ndi.label(fg)
    objs = ndi.find_objects(lab)
    items = []
    for i, sl in enumerate(objs, 1):
        area = (lab[sl] == i).sum()
        if area < min_area: continue
        items.append((i, sl, area))
    # sort roughly reading order
    items.sort(key=lambda t: (round((t[1][0].start + t[1][0].stop) / 2 / 120), (t[1][1].start + t[1][1].stop) / 2))
    res = []
    for k, (i, sl, area) in enumerate(items):
        m = (lab == i)
        m = ndi.binary_erosion(m, iterations=1)
        alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        rgba = im.copy(); rgba.putalpha(alpha)
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        pad = 4
        box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
        crop = rgba.crop(box)
        name = f'{prefix}{k+1:02d}.png'
        crop.save(OUT + name)
        res.append((name, crop.size, area))
    return res

allres = {}
allres['clip'] = cut('__1.jpeg', 'clip', 3000)
allres['disco'] = cut('__2.jpeg', 'disco', 3000, close=7)
allres['flower'] = cut('__3.jpeg', 'flower', 3000, close=7, thresh=14)
allres['dfly'] = cut('__4.jpeg', 'dfly', 3000, close=5, thresh=14)
for k, v in allres.items():
    print(k, len(v))
    for r in v: print('  ', r)
