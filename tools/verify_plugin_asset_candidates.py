"""Validate the separately saved correction set and summarize registration."""
from pathlib import Path
import json
import hashlib
import sys
import numpy as np
from PIL import Image, ImageDraw
from correct_plugin_asset_candidates import SRC, OUT, ROOT, MOVING, anchor, bounds, hair_mask

def lower(im):
    a=np.array(im);m=a[:,:,3]>=128;Y,X=np.indices(m.shape);bottom=np.where(m)[0].max();_,xx=np.where(m&(Y>=bottom-5))
    return [(float(xx.min())+float(xx.max()))/2,int(bottom)]

def hair(im,name):
    import cv2
    a=np.array(im);m=hair_mask(im,name);Y=np.indices(m.shape)[0];m &= Y<83
    return np.median(cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2LAB)[m],axis=0).tolist()

def run():
    manifest=json.loads((OUT/'corrections.json').read_text());sourcehash=json.loads((OUT/'source-sha256.json').read_text())
    errors=[];report={};pngs=0
    for p,h in sourcehash.items():
        if hashlib.sha256((ROOT/p).read_bytes()).hexdigest()!=h:errors.append('Source changed: '+p)
    for key,meta in manifest['assets'].items():
        name=key.split('/')[1];full=[];bust=[]
        for i in range(meta['frames']):
            for suffix,size,seq in [('',(186,184),full),('-bust',(130,125),bust)]:
                p=OUT/key/f'{i}{suffix}.png'
                with Image.open(p) as im:
                    im.load()
                    if im.mode!='RGBA' or im.size!=size:errors.append(f'{p}: mode/size')
                    seq.append(im.copy())
                    if not bounds(im):errors.append(f'{p}: empty')
                pngs+=1
            if full[-1].crop((28,0,158,125)).tobytes()!=bust[-1].tobytes():errors.append(f'{key}/{i}: inconsistent Bust')
        old=[Image.open(SRC/key/f'{i}.png').convert('RGBA') for i in range(len(full))]
        # Existing deliberate loop repeats are retained, not counted as new failures.
        for suffix,seq in [('',full),('-bust',bust)]:
            oldseq=[Image.open(SRC/key/f'{i}{suffix}.png').convert('RGBA').tobytes() for i in range(len(full))]
            for i in range(len(seq)):
                for j in range(i):
                    if seq[i].tobytes()==seq[j].tobytes() and oldseq[i]!=oldseq[j]:errors.append(f'{key}: new duplicate {i}/{j}{suffix}')
        before=np.array([lower(im) for im in old]);after=np.array([lower(im) for im in full])
        if name not in MOVING and name not in {'clawd','compact','delegating'}:
            if np.max(abs(after[:,0]-91))>1:errors.append(key+': horizontal registration >1px')
            if np.max(abs(after[:,1]-178))>1:errors.append(key+': baseline registration >1px')
        border=[i for i,im in enumerate(full) if any([bounds(im)[0]<=0,bounds(im)[1]<=0,bounds(im)[2]>=186,bounds(im)[3]>=184])]
        if border:errors.append(f'{key}: solid border touch {border}')
        report[key]={'frames':len(full),'generated':meta['generated'],'before_lower_band_median':np.median(before,axis=0).tolist(),'after_lower_band_median':np.median(after,axis=0).tolist(),'after_lower_band_range':np.ptp(after,axis=0).tolist(),'before_hair_lab':np.median([hair(im,name) for im in old],axis=0).tolist(),'after_hair_lab':np.median([hair(im,name) for im in full],axis=0).tolist(),'source_sha256':[hashlib.sha256((SRC/key/f'{i}.png').read_bytes()).hexdigest() for i in range(len(full))],'corrected_sha256':[hashlib.sha256((OUT/key/f'{i}.png').read_bytes()).hexdigest() for i in range(len(full))]}
    result={'actions':len(report),'pngs':pngs,'source_unchanged':not any('Source changed' in e for e in errors),'errors':errors,'assets':report,'method':'Lower six opaque rows are a screening proxy, not an anatomical landmark. Generated/prop and moving actions require visual review.'}
    (OUT/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps({k:result[k] for k in ['actions','pngs','source_unchanged','errors']}))
    # Comparison gallery at the same pixel scale: reference, before, after, after Bust.
    groups=[list(report)[start:start+8] for start in range(0,len(report),8)]
    for n,keys in enumerate(groups):
        can=Image.new('RGB',(720,len(keys)*214),'#eeeae4');dr=ImageDraw.Draw(can)
        for row,key in enumerate(keys):
            y=row*214;dr.text((3,y+2),key+' | reference / before / corrected / Bust',fill='black')
            paths=[SRC/'smooth/idle/0.png',SRC/key/'0.png',OUT/key/'0.png',OUT/key/'0-bust.png']
            for p,x in zip(paths,[0,188,376,568]):
                im=Image.open(p).convert('RGBA');can.paste(im,(x,y+22),im)
        can.save(OUT/'review'/f'before-after-{n+1:02d}.png')
    return 1 if errors else 0

if __name__=='__main__':sys.exit(run())
