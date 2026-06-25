import { CONFIG } from './config.js';
const KEY='khunsuek_dsps_shirt_cart';
const LAST_ORDER='khunsuek_dsps_last_order_v4';
export const getCart=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}};
export const saveCart=(cart)=>{localStorage.setItem(KEY,JSON.stringify(cart));window.dispatchEvent(new CustomEvent('cart:updated'))};
export const clearCart=()=>{localStorage.removeItem(KEY);window.dispatchEvent(new CustomEvent('cart:updated'))};
export const setLastOrder=(order)=>localStorage.setItem(LAST_ORDER,JSON.stringify(order));
export const getLastOrder=()=>{try{return JSON.parse(localStorage.getItem(LAST_ORDER))||null}catch{return null}};
export function addItem(item){
  const cart=getCart();
  const key=`${item.productId}__${item.size||''}`;
  const found=cart.find(x=>x.key===key);
  if(found) found.quantity+=item.quantity;
  else cart.push({...item,key});
  saveCart(cart);
}
export function updateQuantity(key,quantity){saveCart(getCart().map(x=>x.key===key?{...x,quantity:Math.max(1,quantity)}:x))}
export function removeItem(key){saveCart(getCart().filter(x=>x.key!==key))}
export function cartCount(){return getCart().reduce((s,x)=>s+x.quantity,0)}
export function formatMoney(v){return new Intl.NumberFormat('th-TH').format(v)+' บาท'}
export function itemUnitPrice(item){return item.productId===CONFIG.bundle.id?CONFIG.bundle.price:CONFIG.jersey.price}
export function calculate(cart=getCart()){
  const subtotal=cart.reduce((sum,item)=>sum+(itemUnitPrice(item)*item.quantity),0);
  const shipping=cart.length?CONFIG.shipping.payable:0;
  return {subtotal,shipping,grandTotal:subtotal+shipping};
}
