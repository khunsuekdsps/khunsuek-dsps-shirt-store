
(function(){
  'use strict';
  const CONFIG={
    apiUrl:'https://script.google.com/macros/s/AKfycbzoQXNoV9ee3Yt6Ep_E6i_Y0VNhTRnXhCfv1RW3ZGcX99q4xjXez5AMOUW1zx45lRac/exec',
    facebookPageUrl:'https://www.facebook.com/khunsuekdsps',
    wristbandOrderUrl:'https://khunsuekdsps.github.io/wristband-order',
    bank:{name:'ธนาคารทหารไทยธนชาต (ttb)',accountName:'จิรพล ประสพสุข',accountNumber:'980-2-10437-3'},
    shipping:{normal:45,supportDiscount:10,payable:35},
    jersey:{id:'JERSEY-2026',name:'เสื้อ DSPS Cheer Jersey by KhunSuek DSPS 2026',price:399,image:'assets/images/jersey-lifestyle.jpg',sizes:['6S','5S','4S','3S','SS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','7XL','8XL']},
    bundle:{id:'BUNDLE-PHI-KHUN',name:'พี่ขุนช่วยใคร',price:499,regular:538,image:'assets/images/jersey-lifestyle.jpg'}
  };
  const CART_KEY='khunsuek_dsps_shirt_cart';
  const ORDER_KEY='khunsuek_dsps_last_order_v5';
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const money=n=>new Intl.NumberFormat('th-TH').format(n)+' บาท';
  function getCart(){
    try{
      const raw=JSON.parse(localStorage.getItem(CART_KEY))||[];

      return raw.map(item=>{
        const productId=String(item.productId||'').toUpperCase();
        const productName=String(item.name||item.productName||'');

        const isBundle=
          productId===String(CONFIG.bundle.id).toUpperCase()||
          productId.includes('BUNDLE')||
          productName.includes('พี่ขุนช่วยใคร')||
          productName.includes('พลัส')||
          Number(item.price||item.unitPrice||0)===499;

        if(isBundle){
          return Object.assign({},item,{
            productId:CONFIG.bundle.id,
            name:'โครงการ “พี่ขุนช่วยใคร พลัส+”',
            price:CONFIG.bundle.price,
            type:'bundle'
          });
        }

        return Object.assign({},item,{
          productId:CONFIG.jersey.id,
          name:CONFIG.jersey.name,
          price:CONFIG.jersey.price,
          type:'shirt'
        });
      });
    }catch(e){
      return [];
    }
  }
  function saveCart(cart){localStorage.setItem(CART_KEY,JSON.stringify(cart)); updateBadges();}
  function addItem(item){
    const cart=getCart();
    const key=item.productId+'__'+(item.size||'');
    const found=cart.find(x=>x.key===key);

    if(found){
      const newQuantity=Number(found.quantity||0)+Number(item.quantity||0);
      Object.assign(found,item,{
        key:key,
        quantity:newQuantity
      });
    }else{
      cart.push(Object.assign({},item,{key:key}));
    }

    saveCart(cart);
    toast('เพิ่มลงตะกร้าแล้ว');
  }
  function getProductType(item){
    const rawType=String(item.type||'').toLowerCase().trim();
    const productId=String(item.productId||'').toLowerCase().trim();
    const productName=String(item.name||item.productName||'').toLowerCase();
    const rawPrice=Number(item.price||item.unitPrice||0);

    // ตรวจหลักฐานของโปร 499 ก่อน เพื่อรองรับตะกร้า/ไฟล์เวอร์ชันเก่า
    if(
      productId===String(CONFIG.bundle.id).toLowerCase()||
      productId.includes('bundle')||
      productId.includes('phi-khun')||
      productName.includes('พี่ขุนช่วยใคร')||
      productName.includes('พลัส')||
      productName.includes('โปรโมชั่น')||
      rawPrice===499
    )return 'bundle';

    if(
      productId===String(CONFIG.jersey.id).toLowerCase()||
      productId.includes('jersey')||
      productName.includes('dsps cheer jersey')||
      rawPrice===399
    )return 'shirt';

    if(rawType==='bundle'||rawType==='promo'||rawType==='promotion')return 'bundle';
    if(rawType==='shirt'||rawType==='jersey')return 'shirt';

    return 'shirt';
  }
  function itemPrice(item){return getProductType(item)==='bundle'?CONFIG.bundle.price:CONFIG.jersey.price}
  function calculate(cart){const subtotal=cart.reduce((s,i)=>s+itemPrice(i)*i.quantity,0);const shipping=cart.length?35:0;return{subtotal,shipping,grandTotal:subtotal+shipping}}
  function updateBadges(){const count=getCart().reduce((s,i)=>s+i.quantity,0);qa('[data-cart-count]').forEach(el=>el.textContent=count)}
  function toast(msg){let el=q('.toast');if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
  function copy(text){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('คัดลอกเลขบัญชีแล้ว')).catch(()=>fallbackCopy(text))}else fallbackCopy(text)}
  function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('คัดลอกเลขบัญชีแล้ว')}
  function initHome(){
    qa('[data-add-shirt]').forEach(btn=>btn.addEventListener('click',function(){const size=q('#jersey-size')?q('#jersey-size').value:'M';addItem({productId:CONFIG.jersey.id,name:CONFIG.jersey.name,price:CONFIG.jersey.price,image:CONFIG.jersey.image,size:size,quantity:1,type:'shirt'})}));
    qa('[data-add-bundle]').forEach(btn=>btn.addEventListener('click',function(){const size=q('#bundle-size')?q('#bundle-size').value:'M';addItem({productId:CONFIG.bundle.id,name:'โครงการ “พี่ขุนช่วยใคร พลัส+”',price:CONFIG.bundle.price,image:CONFIG.bundle.image,size:size,quantity:1,type:'bundle',detail:'พรีออเดอร์: เสื้อ 1 ตัว + ริสแบนด์ขุนศึก ท.ศ.พ. 2026 จำนวน 1 คู่ จัดส่งพร้อมกันเมื่อเสื้อผลิตเสร็จ'})}));
    qa('[data-wristband-link]').forEach(a=>a.href=CONFIG.wristbandOrderUrl);
  }
  function renderCart(){
    const list=q('#cart-list'); if(!list)return;
    const cart=getCart(), empty=q('#cart-empty'), summary=q('#summary'), sticky=q('#mobile-stick');
    if(!cart.length){list.innerHTML=''; if(empty)empty.classList.remove('hidden'); if(summary)summary.classList.add('hidden'); if(sticky)sticky.classList.add('hidden'); return}
    if(empty)empty.classList.add('hidden'); if(summary)summary.classList.remove('hidden'); if(sticky)sticky.classList.remove('hidden');
    list.innerHTML=cart.map(item=>{const bundle=getProductType(item)==='bundle';return '<div class="cart-item"><div class="cart-thumb"><img src="'+item.image+'" alt=""></div><div><div class="tags"><span class="tag tag-gold">'+(bundle?'โปรพี่ขุนช่วยใคร · พรีออเดอร์':'พรีออเดอร์')+'</span></div><h4 style="margin:0 0 6px;font-size:20px">'+item.name+'</h4><div class="muted">'+(bundle?'พรีออเดอร์ · เสื้อ 1 ตัว + ริสแบนด์ 1 คู่ · ':'')+'ไซซ์เสื้อ '+item.size+'</div><div class="qty"><button type="button" data-cart-action="dec" data-key="'+item.key+'">−</button><span>'+item.quantity+'</span><button type="button" data-cart-action="inc" data-key="'+item.key+'">+</button></div></div><div class="side-price" style="text-align:right"><div class="muted">'+money(itemPrice(item))+' / ชุด</div><div style="font-size:24px;font-weight:800;margin:8px 0">'+money(itemPrice(item)*item.quantity)+'</div><button type="button" class="btn btn-light" data-cart-action="remove" data-key="'+item.key+'">ลบรายการ</button></div></div>'}).join('');
    const c=calculate(cart); if(q('#subtotal'))q('#subtotal').textContent=money(c.subtotal);if(q('#grand-total'))q('#grand-total').textContent=money(c.grandTotal);if(sticky&&q('span',sticky))q('span',sticky).textContent=money(c.grandTotal);
  }
  function initCart(){
    renderCart(); document.addEventListener('click',function(e){const b=e.target.closest('[data-cart-action]');if(!b)return;const cart=getCart();const item=cart.find(x=>x.key===b.dataset.key);if(!item)return; if(b.dataset.cartAction==='inc')item.quantity++; if(b.dataset.cartAction==='dec')item.quantity=Math.max(1,item.quantity-1); if(b.dataset.cartAction==='remove')cart.splice(cart.indexOf(item),1); saveCart(cart);renderCart()});
  }

  function fileToBase64(file){
    return new Promise(function(resolve,reject){
      const reader=new FileReader();
      reader.onload=function(){
        resolve({
          base64:reader.result,
          mimeType:file.type,
          originalName:file.name
        });
      };
      reader.onerror=function(){reject(new Error('ไม่สามารถอ่านไฟล์สลิปได้'))};
      reader.readAsDataURL(file);
    });
  }

  function initCheckout(){
    const form=q('#order-form'); if(!form)return; const cart=getCart(); if(!cart.length){location.href='cart.html';return} const c=calculate(cart);
    const sum=q('#order-summary'); if(sum)sum.innerHTML=cart.map(item=>'<div class="summary-row"><span>'+item.name+' (ไซซ์ '+item.size+') × '+item.quantity+(getProductType(item)==='bundle'?'<small style="display:block;color:var(--muted);margin-top:3px">พรีออเดอร์ · เสื้อ 1 ตัว + ริสแบนด์ขุนศึก ท.ศ.พ. 2026 จำนวน 1 คู่ · จัดส่งพร้อมกันเมื่อเสื้อผลิตเสร็จ</small>':'')+'</span><b>'+money(itemPrice(item)*item.quantity)+'</b></div>').join('')+'<div class="summary-row"><span>ยอดสินค้า</span><b>'+money(c.subtotal)+'</b></div><div class="summary-row"><span>ค่าจัดส่งปกติ</span><span>45 บาท</span></div><div class="summary-row"><span>ส่วนลดค่าจัดส่งจากขุนศึก</span><span>- 10 บาท</span></div><div class="summary-row total"><span>ยอดชำระทั้งหมด</span><span>'+money(c.grandTotal)+'</span></div>';
    if(q('#amount'))q('#amount').textContent=money(c.grandTotal); if(q('#bank-name'))q('#bank-name').textContent=CONFIG.bank.name;if(q('#bank-account-name'))q('#bank-account-name').textContent=CONFIG.bank.accountName;if(q('#bank-account-number'))q('#bank-account-number').textContent=CONFIG.bank.accountNumber;
    qa('[data-copy-account]').forEach(b=>b.addEventListener('click',()=>copy(CONFIG.bank.accountNumber)));
    form.addEventListener('submit',async function(e){
      e.preventDefault();
      if(!form.reportValidity())return;

      const invalidSize=cart.find(item=>!CONFIG.jersey.sizes.includes(String(item.size||'').trim()));
      if(invalidSize){
        toast('ไซซ์เสื้อไม่ถูกต้อง: '+invalidSize.size);
        return;
      }

      const file=q('#slip')&&q('#slip').files[0];
      if(!file){toast('กรุณาแนบสลิปการชำระเงิน');return}
      if(file.size>5*1024*1024){toast('ไฟล์ต้องไม่เกิน 5 MB');return}

      const fd=new FormData(form);
      if(!fd.get('confirm1')){toast('กรุณายืนยันว่าตรวจสอบข้อมูลแล้ว');return}

      const submitButtons=qa('button[type="submit"][form="order-form"], #order-form button[type="submit"]');
      const originalLabels=submitButtons.map(btn=>btn.textContent);
      submitButtons.forEach(btn=>{btn.disabled=true;btn.textContent='กำลังส่งคำสั่งซื้อ...'});

      try{
        const slip=await fileToBase64(file);
        const orderData={
          customerName:String(fd.get('customerName')||'').trim(),
          phone:String(fd.get('customerPhone')||'').trim(),
          address:String(fd.get('address')||'').trim(),
          subdistrict:String(fd.get('subdistrict')||'').trim(),
          district:String(fd.get('district')||'').trim(),
          province:String(fd.get('province')||'').trim(),
          postalCode:String(fd.get('postalCode')||'').trim(),
          note:'',
          items:cart.map(item=>{
            const productType=getProductType(item);
            const unitPrice=itemPrice(item);

            return {
              type:productType,
              sku:productType==='bundle'?'BUNDLE-499':'SHIRT-399',
              productId:String(item.productId||''),
              productName:String(item.name||''),
              unitPrice:Number(unitPrice),
              size:String(item.size||'').trim(),
              quantity:Number(item.quantity)
            };
          }),
          slip:slip
        };

        const response=await fetch(CONFIG.apiUrl,{
          method:'POST',
          headers:{'Content-Type':'text/plain;charset=utf-8'},
          body:JSON.stringify(orderData),
          redirect:'follow'
        });

        if(!response.ok){throw new Error('ระบบรับออร์เดอร์ไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง')}
        const result=await response.json();
        if(!result.success){throw new Error(result.message||'บันทึกคำสั่งซื้อไม่สำเร็จ')}

        localStorage.setItem(ORDER_KEY,JSON.stringify({
          orderId:result.orderId||'',
          calculation:result.calculation||c,
          items:cart
        }));
        localStorage.removeItem(CART_KEY);
        location.href='success.html';
      }catch(error){
        console.error(error);
        toast(error.message||'ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        submitButtons.forEach((btn,index)=>{btn.disabled=false;btn.textContent=originalLabels[index]||'ยืนยันคำสั่งซื้อ'});
      }
    });
  }
  function initSuccess(){
    const page=q('.status-chip');
    if(!page)return;
    qa('a[href="#"]').forEach(a=>{if((a.textContent||'').includes('Facebook'))a.href=CONFIG.facebookPageUrl});
  }
  document.addEventListener('DOMContentLoaded',function(){updateBadges();initHome();initCart();initCheckout();initSuccess()});
})();
