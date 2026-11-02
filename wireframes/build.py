"""Author editable, grayscale Sacred Form wireframes. No storefront files are changed."""
from pathlib import Path
import html, json, textwrap, zipfile
from xml.etree import ElementTree as ET

ROOT = Path(__file__).parent
OUT = ROOT / 'screens'
OUT.mkdir(exist_ok=True)
SCREENS = [
 ('home','Home'),('shop','Shop all'),('product','Product detail'),('shrine','Shrine preview'),
 ('wishlist','Wishlist'),('compare','Compare · upload'),('compare-uploaded','Compare · photo added'),('comparison-result','Comparison · stronger match'),
 ('cart','Shopping bag'),('checkout','Checkout request'),('order-success','Request saved'),('about','Our story'),
 ('shop-empty','Shop · no matches'),('wishlist-empty','Wishlist · empty'),('cart-empty','Bag · empty'),
 ('compare-empty','Compare · needs two pieces'),('upload-error','Compare · upload error'),
 ('checkout-error','Checkout · validation'),('comparison-close','Comparison · close match'),
 ('comparison-no-fit','Comparison · neither fits'),('components','Shared components'),('flow','Shopping flow')]
LABELS = dict(SCREENS)
PRODUCTS = [('Golden Presence','Home Shrine','28 cm','68,000'),('Quiet Meditation','Small & Simple','18 cm','42,000'),('Earth Touching','Home Shrine','32 cm','89,000'),('Lotus Stillness','Meaningful Gifts','22 cm','55,000'),('Gentle Blessing','Small & Simple','15 cm','36,000'),('Temple Gold','Meaningful Gifts','25 cm','74,000')]

class Board:
 def __init__(self,key,mobile=False):
  self.key,self.mobile=key,mobile
  self.w=390 if mobile else 1440
  self.pad=22 if mobile else 88
  self.c=self.w-2*self.pad
  self.parts=[]; self.links=[]; self.bounds=[]
 def rect(self,x,y,w,h,fill='#eee',r=0,stroke=None):
  self.bounds.append((x,y,w,h))
  self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')
 def line(self,x,y,w,color='#aaa'):
  self.parts.append(f'<path d="M{x} {y}h{w}" stroke="{color}"/>')
 def txt(self,x,y,s,size=16,bold=False,color='#222',anchor='start'):
  self.parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{700 if bold else 400}" text-anchor="{anchor}">{html.escape(str(s))}</text>')
 def para(self,x,y,s,w,size=16,color='#555'):
  lines=textwrap.wrap(s,max(12,int(w/(size*.53))))
  for i,t in enumerate(lines): self.txt(x,y+i*size*1.55,t,size,color=color)
  return y+len(lines)*size*1.55
 def bars(self,x,y,w,n=3):
  for i in range(n): self.rect(x,y+i*14,w*[1,.77,.9,.59][i%4],6,'#c7c7c7')
 def link(self,target,draw):
  self.links.append(target)
  self.parts.append(f'<a href="?screen={target}&amp;device={"mobile" if self.mobile else "desktop"}" data-go="{target}">')
  draw(); self.parts.append('</a>')
 def btn(self,x,y,w,label,target='product',light=False,h=48):
  def draw():
   self.rect(x,y,w,h,'#f4f4f4' if light else '#737373',8, '#999' if light else None)
   self.txt(x+18,y+h/2+5,label,14,bold=not light,color='#222' if light else '#fff')
   self.txt(x+w-18,y+h/2+5,'→',18,color='#222' if light else '#fff',anchor='end')
  self.link(target,draw)
 def img(self,x,y,w,h,label='PIECE IMAGE',target=None):
  def draw():
   self.rect(x,y,w,h,'#bcbcbc',8)
   self.parts.append(f'<path d="M{x+12} {y+12}L{x+w-12} {y+h-12}M{x+w-12} {y+12}L{x+12} {y+h-12}" stroke="#aeaeae"/>')
   self.txt(x+w/2,y+h/2+6,label,14,color='#444',anchor='middle')
  if target: self.link(target,draw)
  else: draw()
 def tag(self,x,y,s):
  self.txt(x,y,s.upper(),11,bold=True,color='#606060')
 def title(self,y,eyebrow,title,sub=None):
  p=self.pad
  self.tag(p,y,eyebrow)
  size=32 if self.mobile else 52
  z=self.para(p,y+47,title,self.c,size,'#111')-size*1.2
  if sub: z=self.para(p,z+28,sub,self.c if self.mobile else 780,15)-18
  return z+32
 def nav(self):
  h=76 if self.mobile else 96
  self.rect(0,0,self.w,h,'#e5e5e5')
  self.link('home',lambda:self.txt(self.pad,45 if self.mobile else 57,'SACRED FORM',16,True))
  if self.mobile:
   self.link('wishlist',lambda:self.txt(275,45,'♡',25))
   self.link('cart',lambda:self.txt(318,44,'Bag',13))
   self.txt(365,44,'☰',18,anchor='end')
  else:
   for x,t,k in [(510,'Shop all','shop'),(650,'Shrine preview','shrine'),(840,'Our story','about'),(1120,'♡ Wishlist','wishlist'),(1280,'Bag (2)','cart')]:
    self.link(k,lambda x=x,t=t:self.txt(x,56,t,15))
  return h
 def footer(self,y):
  h=290 if self.mobile else 210
  self.rect(0,y,self.w,h,'#ddd')
  p=self.pad
  self.txt(p,y+45,'SACRED FORM',18,True)
  self.txt(p,y+76,'Objects for stillness.',14,color='#555')
  if self.mobile:
   for i,(t,k) in enumerate([('Shop all','shop'),('Our story','about'),('Wishlist','wishlist'),('Shopping bag','cart')]):
    self.link(k,lambda i=i,t=t:self.txt(p+(i%2)*180,y+120+(i//2)*36,t,14))
  else:
   for i,(t,k) in enumerate([('Shop all','shop'),('Our story','about'),('Wishlist','wishlist'),('Shopping bag','cart')]):
    self.link(k,lambda i=i,t=t:self.txt(700+i*150,y+52,t,14))
  self.line(p,y+h-64,self.c)
  self.txt(p,y+h-30,'© 2026 Sacred Form · Myanmar',12,color='#555')
  return y+h
 def field(self,x,y,w,label,value='',error=False):
  self.txt(x,y,label,14,True)
  self.rect(x,y+12,w,48,'#f7f7f7',6,'#555' if error else '#aaa')
  self.txt(x+14,y+42,value or 'Enter '+label.lower(),14,color='#666')
  if error:self.txt(x,y+80,'Required — please complete this field.',12,True)
  return y+(102 if error else 82)
 def productcard(self,x,y,w,p,actions=False):
  name,cat,height,price=p
  ih=260 if self.mobile else 280
  self.rect(x,y,w,ih+(184 if actions else 124),'#f5f5f5',12,'#c3c3c3')
  self.img(x+12,y+12,w-24,ih-12,name.upper(),'product')
  self.link('wishlist',lambda:self.txt(x+w-25,y+43,'♡',25,anchor='end'))
  self.link('product',lambda:self.txt(x+18,y+ih+31,name,20,True))
  self.txt(x+18,y+ih+58,cat+' · '+height,13,color='#666')
  self.txt(x+18,y+ih+85,price+' MMK',15)
  if actions:
   self.btn(x+18,y+ih+110,w-132,'Add to bag','cart',h=44)
   self.link('compare',lambda:self.txt(x+w-22,y+ih+138,'Compare →',13,anchor='end'))
  return y+ih+(184 if actions else 124)
 def finish(self,h):
  self.h=int(h)
  return f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{int(h)}" viewBox="0 0 {self.w} {int(h)}" role="img" aria-label="Sacred Form — {html.escape(LABELS[self.key])}"><title>{html.escape(LABELS[self.key])}</title><desc>Editable grayscale wireframe. Click primary controls to navigate the prototype.</desc><style>text{{font-family:Arial,sans-serif}}a{{cursor:pointer}}a:hover rect{{stroke:#222;stroke-width:2}}a:focus{{outline:2px solid #111}}</style><rect width="100%" height="100%" fill="#dedede"/>'+''.join(self.parts)+'</svg>'

def build(key,m):
 b=Board(key,m); p,c=b.pad,b.c; y=b.nav(); gap=24 if m else 32
 if key=='home':
  if m:
   y=b.title(y+40,'Objects for stillness','Objects that make space.','Thoughtfully chosen Buddha statues for the moments that matter.')
   b.btn(p,y,c,'Start exploring','shop'); y+=76
   b.img(p,y,158,180,'PIECE IMAGE'); b.img(p+180,y+35,166,145,'PIECE IMAGE'); y+=220
  else:
   b.rect(0,y,b.w,650,'#b6b6b6')
   b.img(p,y+55,230,275,'HERO PHOTO'); b.img(p+145,y+365,180,225,'HERO PHOTO')
   b.img(1135,y+80,215,245,'HERO PHOTO'); b.img(1120,y+380,230,180,'HERO PHOTO')
   b.tag(500,y+165,'Objects for stillness'); b.txt(720,y+255,'Objects that',64,True,anchor='middle'); b.txt(720,y+332,'make space.',64,True,anchor='middle')
   b.txt(720,y+387,'Thoughtfully chosen Buddha statues.',17,anchor='middle'); b.btn(600,y+430,240,'Start exploring','shop'); y+=700
  y=b.title(y+20,'A considered collection','Objects to keep close.')
  cols=2 if m else 4; cw=(c-gap*(cols-1))/cols
  for i,t in enumerate(['All pieces','Home shrine','Small & simple','Meaningful gifts']):
   x=p+(i%cols)*(cw+gap); yy=y+(i//cols)*240
   b.rect(x,yy,cw,215,'#f0f0f0',16); b.img(x+12,yy+12,cw-24,145,'IMAGE','shop'); b.txt(x+12,yy+185,t,13,True)
   b.link('wishlist',lambda x=x,yy=yy:b.txt(x+cw-17,yy+187,'♡',22,anchor='end'))
  y+=240*(2 if m else 1)+12
  bh=410 if m else 460
  b.img(p,y,c,bh,'FULL-BLEED COLLECTION BANNER')
  b.rect(p,y,c if m else 510,bh,'#aaa',8)
  b.tag(p+24,y+40,'Featured collection'); b.para(p+24,y+95,'A place for stillness.',c-48 if m else 430,34,'#111')
  b.para(p+24,y+220,'Considered forms for your home shrine.',c-48 if m else 420,16)
  b.btn(p+24,y+280,min(280,c-48),'Explore home shrines','shop',True)
  b.txt(p+24,y+bh-28,'←    →',23); b.txt(p+c-25,y+bh-28,'01 / 03',13,anchor='end'); y+=bh+64
  b.img(p,y,c if m else c*.48,260,'STORY IMAGE'); sy=y+300 if m else y+45; sx=p if m else p+c*.54
  b.txt(sx,sy,'Choose with care.',28,True); b.txt(sx,sy+38,'Place with meaning.',28,True); b.bars(sx,sy+65,c if m else 470); b.btn(sx,sy+125,220,'Our story','about',True); y=max(y+300,sy+210)
 elif key in ['shop','shop-empty']:
  y=b.title(y+42,'The collection','Find a form that feels like yours.','Explore pieces for home shrines, small spaces and meaningful gifts.')
  if not m:
   b.img(1040,125,312,180,'COLLECTION IMAGE'); y=max(y,350)
  b.rect(p,y,c,240 if m else 186,'#f5f5f5',8,'#bbb')
  b.field(p+16,y+28, c-32 if m else 330,'Search','Search pieces, materials, styles…')
  fy=y+104 if m else y+22
  for i,t in enumerate(['All pieces','Home shrine','Small & simple','Gifts']):
   x=p+16+i*83 if m else p+400+i*145
   b.rect(x,fy,78 if m else 137,38,'#777' if i==0 else '#ddd',4)
   b.txt(x+8,fy+24,t,10 if m else 13,color='#fff' if i==0 else '#333')
  by=y+172 if m else y+118
  b.txt(p+16,by,'Budget · 36,000 — 89,000 MMK',13,True)
  b.line(p+18,by+22, min(420,c-55),'#555'); b.txt(p+16,by+27,'●',20); b.txt(p+min(438,c-30),by+27,'●',20,anchor='end')
  if not m:b.txt(p+c-20,by,'Sort: Featured     ⌄   ·   6 pieces',14,anchor='end')
  y+=270 if m else 220
  if key=='shop-empty':
   b.txt(p,y+40,'No pieces match these filters.',26,True); b.para(p,y+78,'Try a wider budget or another search.',c,16); b.btn(p,y+120,min(c,260),'Reset filters','shop'); y+=250
  else:
   cols=1 if m else 3; cw=(c-gap*(cols-1))/cols
   for i,pr in enumerate(PRODUCTS): b.productcard(p+(i%cols)*(cw+gap),y+(i//cols)*440,cw,pr)
   y+=440*(6 if m else 2)
 elif key=='product':
  y+=32; iw=c if m else 650; dx=p if m else 830; dw=c if m else 522
  b.img(p,y,iw,390 if m else 690,'INTERACTIVE 3D MODEL')
  b.txt(p+iw/2,y+(350 if m else 640),'−     +     Ⅱ     Reset',16,anchor='middle')
  for i,t in enumerate(['3D','Photo 1','Photo 2']): b.rect(p+i*92,y+(408 if m else 710),80,60,'#bbb',5); b.txt(p+i*92+40,y+(444 if m else 746),t,12,anchor='middle')
  dy=y+510 if m else y+20
  b.tag(dx,dy,'Home shrine'); b.para(dx,dy+49,'Golden Presence',dw,34 if m else 43,'#111')
  b.txt(dx,dy+112,'68,000 MMK',23); b.para(dx,dy+156,'A serene seated figure with a warm antique-gold finish, chosen for a dedicated home shrine.',dw,16)
  sy=dy+244
  for i,(k,v) in enumerate([('Material','Antique-gold resin'),('Height','28 cm'),('Collection','Home Shrine')]):
   b.line(dx,sy+i*47,dw); b.txt(dx,sy+29+i*47,k,14,color='#666'); b.txt(dx+dw,sy+29+i*47,v,14,True,anchor='end')
  sy+=168; b.tag(dx,sy,'Choose for your space'); b.para(dx,sy+32,'Compare the approximate height in a shrine setting.',dw,15)
  sy+=92; b.rect(dx,sy,108,48,'#eee',5,'#aaa'); b.txt(dx+54,sy+30,'−    1    +',14,anchor='middle'); b.btn(dx+124,sy,dw-124,'Add to bag','cart')
  sy+=68; b.btn(dx,sy,(dw-16)/2,'♡ Save','wishlist',True); b.btn(dx+(dw+16)/2,sy,(dw-16)/2,'Shrine preview','shrine',True)
  b.para(dx,sy+81,'Measure your intended display space before ordering.',dw,13)
  y=max(y+(505 if m else 810),sy+140)
  y=b.title(y+20,'Consider alongside','More quiet forms.')
  cols=1 if m else 3; cw=(c-gap*(cols-1))/cols
  for i,pr in enumerate(PRODUCTS[1:4]):b.productcard(p+(i%cols)*(cw+gap),y+(i//cols)*440,cw,pr)
  y+=440*(3 if m else 1)
 elif key=='shrine':
  y=b.title(y+38,'Your shrine composition','Find the right scale.')
  sw=c if m else 840; sh=390 if m else 510
  b.rect(p,y,sw,sh,'#aaa',8)
  b.parts.append(f'<path d="M{p+sw*.12} {y+sh*.83}V{y+sh*.45}Q{p+sw*.12} {y+30} {p+sw*.5} {y+30}Q{p+sw*.88} {y+30} {p+sw*.88} {y+sh*.45}V{y+sh*.83}" fill="#bdbdbd" stroke="#777" stroke-width="5"/>')
  b.img(p+sw*.36,y+sh*.35,sw*.28,sh*.42,'3D PIECE')
  b.rect(p+sw*.25,y+sh*.77,sw*.5,22,'#777'); b.rect(p+sw*.07,y+sh*.84,sw*.86,25,'#666')
  b.txt(p+sw/2,y+sh-18,'SHRINE PREVIEW · PRESERVE SCENE PROPORTIONS',10,anchor='middle')
  by=y+sh+28; b.txt(p,by,'28 cm · Golden Presence',15,True); b.para(p,by+27,'Drag to rotate · Approximate scale only.',sw-130 if not m else sw,13)
  b.btn(p+sw-130,by+52 if m else by-8,130,'Reset view','shrine',True,h=42)
  sx=p if m else p+sw+34; sy=by+130 if m else y+10; ww=c if m else c-sw-34
  b.tag(sx,sy,'01 / Choose your piece'); b.img(sx,sy+28,ww,350 if m else 320,'←   PORTRAIT CAROUSEL   →')
  sy+=412 if m else 382; b.txt(sx,sy,'Golden Presence',23,True); b.txt(sx+ww,sy+27,'1 / 6',12,anchor='end'); b.txt(sx,sy+27,'Home Shrine · 28 cm',13,color='#666')
  sy+=78; b.tag(sx,sy,'02 / Explore the height')
  for i,t in enumerate(['15 cm','18 cm','25 cm','32 cm']): b.rect(sx+i*(ww/4),sy+22,ww/4-8,44,'#eee',4,'#aaa'); b.txt(sx+i*(ww/4)+11,sy+49,t,12)
  b.btn(sx,max(sy+100,y+sh+26) if not m else sy+100,ww,'View selected piece','product')
  y=max(by+(240 if m else 130),sy+180)
 elif key in ['wishlist','wishlist-empty']:
  y=b.title(y+42,'Keep what speaks to you','Your wishlist.','The pieces you keep coming back to. Gathered here, ready when you are.')
  b.btn(p,y,min(c,250),'Compare pieces','compare'); y+=94; b.line(p,y,c); b.tag(p,y+32,'06 pieces saved' if key=='wishlist' else 'No pieces saved'); y+=60
  if key=='wishlist-empty':
   b.img(p,y,c if m else 380,250,'♡'); b.txt(p,y+295,'Keep a piece close.',28,True); b.para(p,y+334,'Tap a heart on any piece to find it here.',c,16); b.btn(p,y+375,min(c,270),'Explore the collection','shop'); y+=470
  else:
   cw=c if m else (c-96)/3
   for i,pr in enumerate(PRODUCTS):b.productcard(p+(i%3)*(cw+48) if not m else p,y+(i//3)*504 if not m else y+i*494,cw,pr,True)
   y+=504*2 if not m else 494*6
 elif key in ['compare','compare-uploaded','upload-error','compare-empty']:
  y=b.title(y+36,'Compare for your space','Two pieces. Your place.')
  if key=='compare-empty':
   b.img(p,y,c if m else 600,270,'TWO SAVED PIECES'); b.para(p,y+320,'Save at least two different pieces to compare.',c,26,'#222'); b.btn(p,y+410,min(c,300),'Find your favourites','shop'); y+=510
  else:
   left=c if m else 590; rx=p if m else p+left+54; rw=c if m else c-left-54
   b.tag(p,y,'01 / Your shrine')
   b.img(p,y+24,left,330 if m else 470,'YOUR SHRINE PHOTO' if key=='compare-uploaded' else 'UPLOAD YOUR SHRINE PHOTO')
   if key!='compare-uploaded': b.btn(p+20,y+200 if m else y+265,min(left-40,280),'Choose a photo','compare-uploaded',True)
   by=y+(385 if m else 525)
   if key=='compare-uploaded':
    b.link('compare',lambda:b.txt(p,by,'Change photo     Remove photo',14,True))
    b.para(p,by+30,'Your photo stays on this device.',left,13)
   else:b.para(p,by,'JPG, PNG, WebP or AVIF · Up to 12 MB. Processed on your device.',left,13)
   if key=='upload-error':
    b.rect(p,by+45,left,88,'#c5c5c5',8,'#666'); b.txt(p+15,by+72,'This file cannot be used.',16,True); b.para(p+15,by+99,'Choose a supported image under 12 MB.',left-30,13)
   ry=by+(172 if key=='upload-error' else 90) if m else y
   b.tag(rx,ry,'02 / Choose two favourites'); cw=(rw-18)/2
   for i,pr in enumerate(PRODUCTS[:2]):
    x=rx+i*(cw+18); b.img(x,ry+24,cw,190 if m else 270,pr[0].upper()); b.field(x,ry+(244 if m else 327),cw,'Piece '+str(i+1),pr[0]+' ⌄'); b.txt(x,ry+(326 if m else 409),pr[2]+' · '+pr[3]+' MMK',11)
   fy=ry+(374 if m else 462)
   if m:
    b.field(rx,fy,rw,'Shelf clearance · cm, optional','e.g. 40'); b.field(rx,fy+90,rw,'Your preferred feeling','No preference ⌄'); fy+=188
   else:
    b.field(rx,fy,(rw-20)*.4,'Shelf clearance · cm','e.g. 40'); b.field(rx+(rw-20)*.4+20,fy,(rw-20)*.6,'Preferred feeling','No preference ⌄'); fy+=90
   if key=='compare-uploaded':b.btn(rx,fy,rw,'Compare for my space','comparison-result')
   else:
    b.rect(rx,fy,rw,48,'#aaa',8); b.txt(rx+18,fy+30,'Compare for my space',14,bold=True,color='#eee')
   b.para(rx,fy+75,'Colour, contrast, listed height and your preference inform the comparison.',rw,13)
   y=max(by+180,fy+145)
 elif key.startswith('comparison-'):
  close=key=='comparison-close'; nofit=key=='comparison-no-fit'
  headline='Both pieces are close matches.' if close else ('Neither piece fits this clearance.' if nofit else 'Golden Presence is the stronger match.')
  y=b.title(y+36,'Your comparison',headline)
  b.para(p,y,'Photo reading: warm average colour · medium brightness. Scores compare listed details and overall photo appearance.',c,14); y+=70 if not m else 95
  cw=c if m else (c-32)/2; ih=310 if m else 330
  for i,pr in enumerate(PRODUCTS[:2]):
   x=p if m else p+i*(cw+32); yy=y+i*(ih+340) if m else y
   b.rect(x,yy,cw,ih+308,'#bdbdbd' if i==0 and not close and not nofit else '#f4f4f4',12,'#888')
   badge='DOES NOT FIT' if nofit else ('CLOSE MATCH' if close else ('STRONGER MATCH' if i==0 else 'ALSO CONSIDERED'))
   b.tag(x+22,yy+30,badge); b.img(x+22,yy+50,cw-44,ih,pr[0].upper(),'product')
   by=yy+ih+84; b.txt(x+22,by,pr[0],24,True); b.txt(x+22,by+29,pr[2]+' · '+pr[3]+' MMK',14)
   score=[89,87][i] if close else ([56,51][i] if nofit else [94,79][i])
   b.txt(x+22,by+75,str(score)+'/100',30,True); b.txt(x+22,by+100,'MATCH POINTS · animated on entry',10,color='#555')
   for j,t in enumerate(['Palette','Contrast','Height']):
    xx=x+22+j*(cw-44)/3; b.txt(xx,by+129,t,11); b.rect(xx,by+140,(cw-65)/3,7,'#ccc',3); b.rect(xx,by+140,(cw-65)/3*(.92-i*.16),7,'#777',3)
   b.link('product',lambda x=x,by=by:b.txt(x+22,by+193,'View piece →',15,True))
   b.txt(x+cw-22,by+193,'Why this score +',12,anchor='end')
  y+=(ih+340)*(2 if m else 1)
  if nofit:b.para(p,y+12,'Choose a smaller piece or measure another space. Listed height exceeds the available clearance.',c,16,'#222'); y+=94
  else:b.para(p,y+12,'Why this match: its finish complements the photo palette. Confirm measurements before buying.',c,16,'#333'); y+=74
  b.btn(p,y,min(c,290),'Adjust my comparison','compare',True); y+=94
 elif key in ['cart','cart-empty']:
  y=b.title(y+42,'Your selection','The shopping bag.','Review your pieces before creating an order request.')
  if key=='cart-empty':
   b.img(p,y,c if m else 430,260,'EMPTY BAG'); b.txt(p,y+305,'Your bag is waiting.',28,True); b.btn(p,y+350,min(c,270),'Explore pieces','shop'); y+=445
  else:
   lw=c if m else 770
   for i,pr in enumerate(PRODUCTS[:2]):
    yy=y+i*195; b.rect(p,yy,lw,175,'#f5f5f5',10); b.img(p+12,yy+12,115,150,'PIECE','product'); tx=p+145
    b.txt(tx,yy+35,pr[0],17,True); b.txt(tx,yy+62,pr[2]+' · Resin',13); b.txt(tx,yy+90,pr[3]+' MMK',14); b.txt(tx,yy+133,'−    1    +',15); b.link('cart-empty',lambda tx=tx,yy=yy:b.txt(tx+115,yy+133,'Remove',12))
   sx=p if m else p+830; sy=y+415 if m else y; ww=c if m else c-830
   b.rect(sx,sy,ww,330,'#bbb',12); b.txt(sx+24,sy+40,'Order summary',24,True)
   for i,(k,v) in enumerate([('Subtotal','110,000 MMK'),('Delivery','Confirmed later'),('Total before delivery','110,000 MMK')]):b.txt(sx+24,sy+94+i*52,k,13); b.txt(sx+ww-24,sy+115+i*52,v,15,True,anchor='end')
   b.btn(sx+24,sy+258,ww-48,'Continue','checkout'); y=max(y+420,sy+380)
 elif key in ['checkout','checkout-error']:
  error=key=='checkout-error'; y=b.title(y+38,'Order request','A few details for your selection.')
  lw=c if m else 750
  b.rect(p,y,lw,925 if error else 840,'#eee',12); fx=p+22; fw=lw-44; fy=y+36
  b.txt(fx,fy,'Contact & delivery',24,True); fy+=40
  for label,value,required in [('Full name','',True),('Phone number','',True),('Email · optional','',False),('Delivery address','',True),('City','',True),('Country','Myanmar ⌄',False),('Order note · optional','',False)]: fy=b.field(fx,fy,fw,label,value,error and required)
  b.para(fx,fy+5,'Prototype: saves an order request in this browser. No payment is collected or order sent.',fw,14)
  b.btn(fx,fy+85,fw,'Save order request','order-success'); sy=y+1020 if m and error else (y+930 if m else y); sx=p if m else p+814; ww=c if m else c-814
  b.rect(sx,sy,ww,360,'#bbb',12); b.txt(sx+22,sy+38,'Your pieces',24,True)
  for i,pr in enumerate(PRODUCTS[:2]): b.img(sx+22,sy+65+i*85,65,68,'IMG'); b.txt(sx+105,sy+90+i*85,pr[0],14,True); b.txt(sx+105,sy+115+i*85,pr[3]+' MMK',13)
  b.line(sx+22,sy+250,ww-44); b.txt(sx+22,sy+281,'Subtotal · 110,000 MMK',17,True); b.para(sx+22,sy+312,'Delivery confirmed separately.',ww-44,13); y=max(fy+190,sy+410)
 elif key=='order-success':
  y=b.title(y+65,'Request saved in this browser','Thank you for your selection.','This prototype has saved your request locally. Payment and delivery have not been confirmed.')
  b.rect(p,y,c,116,'#bbb',12); b.txt(p+24,y+40,'Reference: SF-DEMO-001',22,True); b.txt(p+24,y+78,'Local request summary',15); y+=150
  for i,pr in enumerate(PRODUCTS[:2]):
   b.img(p,y,90,100,'PIECE'); b.txt(p+112,y+31,pr[0],18,True); b.txt(p+112,y+65,pr[3]+' MMK · Qty 1',14); y+=126
  b.txt(p,y+16,'Subtotal · 110,000 MMK',24,True); b.para(p,y+56,'Your contact and delivery details appear here for review.',c,16); b.btn(p,y+110,min(c,300),'Continue exploring','shop'); y+=220
 elif key=='about':
  y=b.title(y+48,'Our story','Objects chosen with intention.','For spaces that invite stillness, reflection and meaning.')
  b.img(p,y,c,300 if m else 440,'STORY / SHRINE SETTING'); y+=350 if m else 490
  b.txt(p,y,'Less noise. More meaning.',28,True); b.bars(p,y+35,c if m else 740,4); b.btn(p,y+120,min(c,260),'Explore the collection','shop'); y+=240
  b.rect(0,y,b.w,640 if m else 300,'#b5b5b5'); b.txt(p,y+50,'Chosen with care.',28,True)
  cw=c if m else (c-48)/3
  for i,(t,desc) in enumerate([('Form','Considered design'),('Place','Made for a setting'),('Meaning','Chosen with care')]):
   x=p if m else p+i*(cw+24); yy=y+85+i*170 if m else y+85; b.rect(x,yy,cw,145,'#eee',14); b.txt(x+22,yy+40,t,22,True); b.txt(x+22,yy+74,desc,15); b.bars(x+22,yy+96,cw-44,2)
  y+=700 if m else 360
  b.para(p,y,'Objects for a more intentional home.',c,30,'#222'); y+=150
 elif key=='components':
  y=b.title(y+40,'Wireframe library','Shared components & states.')
  b.btn(p,y,min(c,300),'Primary action','product'); b.btn(p,y+68,min(c,300),'Secondary action','shrine',True); y+=170
  b.tag(p,y,'Forms · default / selected / validation'); y=b.field(p,y+40,c if m else 520,'Label','Placeholder'); y=b.field(p,y+16,c if m else 520,'Required field','',True)
  b.txt(p,y+15,'Selected filter',15,True); b.rect(p,y+34,150,44,'#777',6); b.txt(p+16,y+62,'All pieces',14,color='#fff'); y+=120
  b.productcard(p,y,c if m else 390,PRODUCTS[0],True); y+=495
  b.para(p,y,'Interaction notes: heart toggles saved state; quantity updates totals; selected filters stay dark; carousel changes the current piece; results animate score charts on entry.',c,16); y+=165
  b.para(p,y,'Mobile: one-column reading order, full-width actions, comfortable tap targets and natural page scrolling. Desktop: scene and forms share columns without stretching product imagery.',c,16); y+=140
 elif key=='flow':
  y=b.title(y+40,'Experience map','Discover → save → decide → request.')
  flows=[('01 · Discover','home','Home hero, four categories and collection banner'),('02 · Find','shop','Search, category, budget and sort work together'),('03 · Inspect','product','3D / photos, details, wishlist and quantity'),('04 · Visualise','shrine','Carousel piece selection and height preview'),('05 · Keep','wishlist','Saved pieces, remove, add to bag or compare'),('06 · Compare','compare','Upload shrine photo and select two pieces'),('07 · Decide','comparison-result','Stronger, close-match or neither-fits result'),('08 · Review','cart','Quantities, remove pieces and totals'),('09 · Request','checkout','Contact, delivery and local request validation'),('10 · Saved','order-success','Reference and local request summary')]
  for i,(t,k,s) in enumerate(flows):
   yy=y+i*130; b.rect(p,yy,c,108,'#eee',12); b.link(k,lambda yy=yy,t=t:b.txt(p+20,yy+37,t,22,True)); b.para(p+20,yy+67,s,c-40,14)
  y+=len(flows)*130+30
 return b,b.finish(b.footer(y+24))

manifest=[]; inline={}
for key,label in SCREENS:
 for mobile in [False,True]:
  device='mobile' if mobile else 'desktop'; b,svg=build(key,mobile)
  ET.fromstring(svg)
  assert all(k in LABELS for k in b.links),key
  assert all(x>=0 and y>=0 and w>=0 and h>=0 and x+w<=b.w+1 and y+h<=b.h+1 for x,y,w,h in b.bounds),key
  name=key+'-'+device
  (OUT/(name+'.svg')).write_text(svg,encoding='utf-8')
  manifest.append(dict(id=key,label=label,device=device,width=b.w,height=b.h,file='screens/'+name+'.svg'))
  inline[name]=svg
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

viewer='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sacred Form · Complete wireframes</title><style>
*{box-sizing:border-box}body{margin:0;background:#aaa;color:#222;font:14px Arial,sans-serif}aside{position:fixed;inset:0 auto 0 0;width:240px;padding:24px 18px;background:#f6f6f6;overflow:auto;border-right:1px solid #ccc}h1{font-size:19px;margin:0 0 10px}aside p{font-size:12px;line-height:1.6;color:#666}select,button{font:inherit;border:1px solid #aaa;background:#fff;padding:9px;border-radius:5px;cursor:pointer}select{width:100%;margin:12px 0}nav button{display:block;width:100%;text-align:left;border:0;background:transparent;margin:3px 0;padding:9px}nav button.active{background:#ddd;font-weight:bold}.bar{position:sticky;top:0;background:#eaeaea;padding:12px 24px;display:flex;gap:14px;align-items:center;z-index:2;border-bottom:1px solid #999}.bar span{flex:1}main{margin-left:240px}#canvas{padding:28px;max-width:1600px;margin:auto}#canvas svg{display:block;width:100%;height:auto;background:#ddd;box-shadow:0 5px 20px #0002}#canvas.mobile{max-width:446px}a{color:inherit}#download{font-size:12px}@media(max-width:750px){aside{position:static;width:100%;padding:16px}aside p,nav{display:none}aside select{display:block}main{margin-left:0}.bar{padding:10px}#canvas{padding:12px}}
</style><aside><h1>SACRED FORM</h1><p>Complete ecommerce wireframes<br>22 screens · desktop + mobile<br>Grayscale layout study</p><label for="screenPicker">Choose a screen</label><select id="screenPicker"></select><nav id="nav"></nav><p>Click arrows and primary actions to follow the shopping flow. Fields, carousel controls and uploads are visual wireframes; no customer data is collected here.</p><p><a href="specification.md">Screen notes & Figma import</a></p></aside><main><div class="bar"><span id="current"></span><button id="desktop">Desktop</button><button id="mobile">Mobile</button><a id="download" download>SVG ↓</a></div><div id="canvas"></div></main><script>
const boards=__BOARDS__, screens=__SCREENS__;
const params=new URLSearchParams(location.search);let screen=params.get('screen')||'home',device=params.get('device')||'desktop';
if(!screens.some(s=>s[0]===screen))screen='home';if(!['mobile','desktop'].includes(device))device='desktop';
const picker=document.getElementById('screenPicker'),nav=document.getElementById('nav');
screens.forEach(([id,label])=>{let op=new Option(label,id);picker.add(op);let btn=document.createElement('button');btn.textContent=label;btn.dataset.id=id;btn.onclick=()=>show(id,device);nav.append(btn)});
function show(s,d,push=true){screen=s;device=d;picker.value=s;document.getElementById('current').textContent=screens.find(x=>x[0]===s)[1]+' · '+d;const canvas=document.getElementById('canvas');canvas.className=d;canvas.innerHTML=boards[s+'-'+d];document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.id===s));document.getElementById('download').href='screens/'+s+'-'+d+'.svg';document.getElementById('desktop').style.background=d==='desktop'?'#ccc':'#fff';document.getElementById('mobile').style.background=d==='mobile'?'#ccc':'#fff';if(push){history.pushState({},'', '?screen='+s+'&device='+d);window.scrollTo(0,0)}}
picker.onchange=()=>show(picker.value,device);document.getElementById('desktop').onclick=()=>show(screen,'desktop');document.getElementById('mobile').onclick=()=>show(screen,'mobile');document.getElementById('canvas').onclick=e=>{const a=e.target.closest('[data-go]');if(a){e.preventDefault();show(a.dataset.go,device)}};window.onpopstate=()=>{let p=new URLSearchParams(location.search);show(p.get('screen')||'home',p.get('device')||'desktop',false)};show(screen,device,false);
</script></html>'''.replace('__BOARDS__',json.dumps(inline)).replace('__SCREENS__',json.dumps(SCREENS))
(ROOT/'index.html').write_text(viewer,encoding='utf-8')
print(f'Created {len(manifest)} SVG artboards and a self-contained clickable viewer.')
