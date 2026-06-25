
import { cartCount } from './store.js';
export function updateCartBadge(){
  document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent = cartCount());
}
export function toast(message){
  let t = document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = message;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}
export async function copyText(text, success='คัดลอกแล้ว'){
  try { await navigator.clipboard.writeText(text); toast(success); } catch { toast('คัดลอกไม่สำเร็จ'); }
}
window.addEventListener('cart:updated', updateCartBadge);
document.addEventListener('DOMContentLoaded', updateCartBadge);
