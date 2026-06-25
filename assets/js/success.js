
import { getLastOrder, formatMoney } from './store.js';
import { CONFIG } from './config.js';
import { copyText } from './ui.js';

document.addEventListener('DOMContentLoaded', ()=>{
  const order = getLastOrder();
  if(!order){ location.href='index.html'; return; }
  document.querySelector('#order-id').textContent = order.orderId;
  document.querySelector('#order-total').textContent = formatMoney(order.calculation.grandTotal);
  document.querySelector('#facebook-link').href = CONFIG.facebookPageUrl;
  document.querySelector('#copy-order').addEventListener('click', ()=>copyText(order.orderId, 'คัดลอกเลขคำสั่งซื้อแล้ว'));
});
