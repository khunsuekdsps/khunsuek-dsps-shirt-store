import { CONFIG } from './config.js';
import { addItem } from './store.js';
import { toast } from './ui.js';

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-add-shirt]').forEach(btn=>btn.addEventListener('click',()=>{
    const size=document.querySelector('#jersey-size')?.value||'M';
    addItem({productId:CONFIG.jersey.id,name:CONFIG.jersey.name,image:CONFIG.jersey.image,size,quantity:1,type:'jersey'});
    toast(`เพิ่มเสื้อไซซ์ ${size} ลงตะกร้าแล้ว`);
  }));
  document.querySelectorAll('[data-add-bundle]').forEach(btn=>btn.addEventListener('click',()=>{
    const size=document.querySelector('#bundle-size')?.value||'M';
    addItem({productId:CONFIG.bundle.id,name:`โปรโมชั่น ${CONFIG.bundle.name}`,image:CONFIG.bundle.image,size,quantity:1,type:'bundle',detail:'เสื้อ 1 ตัว ราคา 399 บาท + ริสแบนด์ขุนศึก ท.ศ.พ. 2026 จำนวน 1 คู่ ราคา 139 บาท'});
    toast(`เพิ่มชุดโปรโมชั่นไซซ์ ${size} ลงตะกร้าแล้ว`);
  }));
  document.querySelectorAll('[data-wristband-link]').forEach(a=>a.href=CONFIG.wristbandOrderUrl);
});
