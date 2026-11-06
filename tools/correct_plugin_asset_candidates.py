"""Non-destructive color/registration candidates for the November 6 audit."""
from pathlib import Path
import argparse
import hashlib
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'plugin/assets'
OUT = ROOT / 'tools/assets/plugin-assets-corrected-v1'
REGENERATED = {'sorry', 'stretch', 'clawd', 'delegating', 'compact'}
MOVING = {'running-left', 'running-right', 'swamped_left', 'swamped_right', 'busy_left', 'busy_right', 'jumping'}
SCALES = {'listening': 1.065, 'idle-2': 1.045, 'proud': 1.015}

def bounds(im):
    return im.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()

def face_box(im):
    a=np.array(im);rgb=a[:,:,:3];hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
    m=((a[:,:,3]>=128)&(rgb[:,:,0]>195)&(rgb[:,:,1]>145)&(rgb[:,:,2]>115)&(hsv[:,:,1]<100)).astype('uint8')
    m[110:]=0
    n,_,s,_=cv2.connectedComponentsWithStats(m)
    ids=[j for j in range(1,n) if s[j,4]>60 and 35<s[j,0]+s[j,2]/2<150 and s[j,1]<75]
    if not ids:return (65,43,52,43)
    j=max(ids,key=lambda j:s[j,4]);x,y,w,h,_=s[j]
    return tuple(int(v) for v in (x,y,w,min(h,48)))

def anchor(im, name):
    a=np.array(im);m=a[:,:,3]>=128;Y,X=np.indices(m.shape)
    x,y,w,h=face_box(im);cx=x+w/2
    if name in {'clawd','delegating'}:
        m=m & (X>=cx-15)&(X<=cx+15)
    yy,xx=np.where(m);bottom=int(yy.max());yy,xx=np.where(m & (Y>=bottom-5))
    return (float(xx.min()+xx.max())/2,bottom)

def paste_transform(im, scale, dx, dy):
    if scale!=1:
        im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(186,184));canvas.paste(im,(round(dx),round(dy)))
    return canvas

def read_generated(name):
    sheet=Image.open(OUT/'work'/f'{name}-generated.png').convert('RGBA')
    cells=[]
    for i in range(6):
        c=sheet.crop((round(i%3*sheet.width/3),round(i//3*sheet.height/2),round((i%3+1)*sheet.width/3),round((i//3+1)*sheet.height/2)))
        a=np.array(c);a[a[:,:,3]<8]=0;c=Image.fromarray(a);cells.append(c)
    bs=[bounds(c) for c in cells]
    b=(min(v[0] for v in bs),min(v[1] for v in bs),max(v[2] for v in bs),max(v[3] for v in bs))
    height=172
    s=min(172/(b[2]-b[0]),height/(b[3]-b[1]))
    size=(round((b[2]-b[0])*s),round((b[3]-b[1])*s))
    frames=[]
    for c in cells:
        c=c.crop(b).resize(size,Image.Resampling.LANCZOS);can=Image.new('RGBA',(186,184));can.alpha_composite(c,((186-size[0])//2,179-size[1]));frames.append(can)
    return frames,{'sheet':f'work/{name}-generated.png','shared_crop':b,'shared_scale':s}

def hair_mask(im,name):
    a=np.array(im);rgb=a[:,:,:3];hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV);Y,X=np.indices(a.shape[:2]);x,y,w,h=face_box(im);cx=x+w/2
    m=(a[:,:,3]>0)&(hsv[:,:,0]>=4)&(hsv[:,:,0]<=24)&(hsv[:,:,1]>=105)&(hsv[:,:,2]>=70)
    # Spatially exclude the central costume and held props, and preserve eyes.
    m &= (Y<min(100,y+h+4)) | (X<cx-34) | (X>cx+34)
    m &= ~((X>x+3)&(X<x+w-3)&(Y>y+10)&(Y<y+h+3))
    # The existing flower ornament is deliberately excluded from hair grading.
    m &= ((X-(cx+36))**2+(Y-(y-12))**2>14**2)
    if name=='redhot':m &= ~((X<70)&(Y<86))
    if name=='stretch':m &= ~((X>58)&(X<128)&(Y<46))
    if name=='compact':m &= Y<130
    if name=='clawd':m &= ~((X>48)&(X<126)&(Y>72)&(Y<130))
    if name=='delegating':m &= Y<143
    return m

def recolor(frames,name,target):
    masks=[hair_mask(f,name) for f in frames]
    samples=[]
    for im,m in zip(frames,masks):
        lab=cv2.cvtColor(np.array(im)[:,:,:3],cv2.COLOR_RGB2LAB)
        Y=np.indices(m.shape)[0];sample=lab[m & (Y<83)]
        if len(sample):samples.append(sample)
    median=np.median(np.concatenate(samples),axis=0)
    delta=np.clip(np.array(target)-median,[-12,-12,-12],[12,12,12])
    result=[]
    for im,m in zip(frames,masks):
        a=np.array(im);lab=cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2LAB).astype(float)
        graded=cv2.cvtColor(np.clip(lab+delta,0,255).astype('uint8'),cv2.COLOR_LAB2RGB)
        # Change selected pixels only; source alpha and all unselected RGB remain exact.
        a[:,:,:3][m]=graded[m];result.append(Image.fromarray(a))
    return result,{'lab_source_median':median.tolist(),'lab_delta':delta.tolist()},masks

def run(draft=False):
    records={};hashes={};all_contacts=[]
    for group in ['classic','smooth','extra']:
        for folder in sorted((SRC/group).iterdir()):
            if not folder.is_dir():continue
            name=folder.name;paths=sorted([p for p in folder.glob('*.png') if p.stem.isdigit()],key=lambda p:int(p.stem))
            original=[Image.open(p).convert('RGBA') for p in paths]
            for p in folder.glob('*.png'):hashes[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
            generated=group=='extra' and name in REGENERATED and (OUT/'work'/f'{name}-generated.png').exists()
            if group=='extra' and name in REGENERATED and not generated and not draft:raise RuntimeError(f'Missing generation {name}')
            if generated:frames,meta=read_generated(name)
            else:frames=[paste_transform(f,1,0,0) for f in original];meta={}
            scale=SCALES.get(name,1) if group=='extra' else 1
            if name in {'angry','waving'} and group=='smooth':scale=.95
            shifts=[];adjusted=[]
            if name in MOVING:
                for f in frames:
                    # Pad classic at the bottom; preserve locomotion/jump phase displacement.
                    dy=-4 if group=='smooth' else 0
                    adjusted.append(paste_transform(f,scale,0,dy));shifts.append([0,dy])
            elif name=='compact':
                for f in frames:
                    x,y,w,h=face_box(f);dx=91-(x+w/2);dy=min(0,178-(bounds(f)[3]-1));adjusted.append(paste_transform(f,scale,dx,dy));shifts.append([round(dx),round(dy)])
            else:
                for f in frames:
                    x,b=anchor(f,name);dx=91-x*scale;dy=178-b*scale
                    # A common resize applies to every frame; registration is integer translation.
                    adjusted.append(paste_transform(f,scale,dx,dy));shifts.append([round(dx),round(dy)])
            if name not in MOVING and name!='compact':
                for i,f in enumerate(adjusted):
                    ax,ay=anchor(f,name);rx,ry=round(91-ax),round(178-ay)
                    if rx or ry:
                        adjusted[i]=paste_transform(f,1,rx,ry)
                        shifts[i][0]+=rx;shifts[i][1]+=ry
            frames=adjusted;color=None;masks=None
            if group=='extra' or name=='angry':
                target=[162,167,174] if group=='classic' else [157,171,176]
                frames,color,masks=recolor(frames,name,target)
            dest=OUT/group/name;dest.mkdir(parents=True,exist_ok=True)
            bframes=[]
            for i,f in enumerate(frames):
                f.save(dest/f'{i}.png');b=f.crop((28,0,158,125));b.save(dest/f'{i}-bust.png');bframes.append(b)
            record={'generated':generated,'frames':len(frames),'scale':scale,'integer_shifts':shifts,'color':color,**meta,'bounds':[bounds(f) for f in frames],'anchors':[anchor(f,name) for f in frames]}
            records[group+'/'+name]=record
            if masks is not None:
                md=OUT/'work/hair-masks';md.mkdir(exist_ok=True)
                Image.fromarray(masks[0].astype('uint8')*255).save(md/f'{group}-{name}.png')
            all_contacts.append((group+'/'+name,original,frames,bframes))
    (OUT/'source-sha256.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
    (OUT/'corrections.json').write_text(json.dumps({'status':'draft' if draft else 'candidate','full_size':[186,184],'bust_size':[130,125],'baseline':178,'body_center':91,'assets':records},indent=2),encoding='utf-8')
    review=OUT/'review';review.mkdir(exist_ok=True)
    for start in range(0,len(all_contacts),4):
        items=all_contacts[start:start+4];c=Image.new('RGB',(186*8,len(items)*340),'#eeeae4');dr=ImageDraw.Draw(c)
        for row,(key,old,full,bust) in enumerate(items):
            yy=row*340;dr.text((3,yy+2),key,fill='black')
            for i,f in enumerate(full):c.paste(f,(i*186,yy+18),f);c.paste(bust[i],(i*186+28,yy+205),bust[i])
        c.save(review/f'frames-{start//4+1:02d}.png')
    # Before/after first frames alongside the chosen idle reference.
    for group in ['classic','smooth','extra']:
        items=[v for v in all_contacts if v[0].startswith(group+'/')];c=Image.new('RGB',(6*210,((len(items)+5)//6)*225),'#eeeae4');dr=ImageDraw.Draw(c)
        for i,(key,old,full,bust) in enumerate(items):
            x=i%6*210;y=i//6*225;dr.text((x+3,y+3),key,fill='black');c.paste(full[0],(x+10,y+25),full[0])
        c.save(review/f'{group}-overview.png')
    print(json.dumps({'actions':len(records),'pngs':sum(v['frames']*2 for v in records.values()),'generated':[k for k,v in records.items() if v['generated']]}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--draft',action='store_true');run(p.parse_args().draft)
