import { CONFIG } from './config.js';
import {
  getCart,
  calculate,
  formatMoney,
  clearCart,
  itemUnitPrice
} from './store.js';
import { copyText, toast } from './ui.js';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzoQXNoV9ee3Yt6Ep_E6i_Y0VNhTRnXhCfv1RW3ZGcX99q4xjXez5AMOUW1zx45lRac/exec';

function renderSummary() {
  const cart = getCart();

  if (!cart.length) {
    location.href = 'cart.html';
    return;
  }

  const calc = calculate(cart);
  const summary = document.querySelector('#order-summary');

  summary.innerHTML = cart.map((item) => {
    const bundleDetail = item.productId === CONFIG.bundle.id
      ? '<small style="display:block;color:var(--muted);margin-top:3px">เสื้อ 1 ตัว ราคา 399 บาท + ริสแบนด์ขุนศึก ท.ศ.พ. 2026 จำนวน 1 คู่ ราคา 139 บาท</small>'
      : '';

    return `
      <div class="summary-row">
        <span>
          ${item.name} (ไซซ์ ${item.size}) × ${item.quantity}
          ${bundleDetail}
        </span>
        <b>${formatMoney(itemUnitPrice(item) * item.quantity)}</b>
      </div>`;
  }).join('') + `
    <div class="summary-row">
      <span>ยอดสินค้า</span>
      <b>${formatMoney(calc.subtotal)}</b>
    </div>
    <div class="summary-row">
      <span>ค่าจัดส่งปกติ</span>
      <span>${formatMoney(CONFIG.shipping.normal)}</span>
    </div>
    <div class="summary-row">
      <span>ส่วนลดค่าจัดส่งจากขุนศึก</span>
      <span>- ${formatMoney(CONFIG.shipping.supportDiscount)}</span>
    </div>
    <div class="summary-row total">
      <span>ยอดชำระทั้งหมด</span>
      <span>${formatMoney(calc.grandTotal)}</span>
    </div>`;

  document.querySelector('#amount').textContent = formatMoney(calc.grandTotal);
  document.querySelector('#bank-name').textContent = CONFIG.bank.name;
  document.querySelector('#bank-account-name').textContent = CONFIG.bank.accountName;
  document.querySelector('#bank-account-number').textContent = CONFIG.bank.accountNumber;
  document.querySelector('#facebook-link').href = CONFIG.facebookPageUrl;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        base64: reader.result,
        mimeType: file.type,
        originalName: file.name
      });
    };

    reader.onerror = () => {
      reject(new Error('อ่านไฟล์สลิปไม่สำเร็จ'));
    };

    reader.readAsDataURL(file);
  });
}

function getProductType(item) {
  return item.productId === CONFIG.bundle.id ? 'bundle' : 'shirt';
}

function setSubmitting(form, isSubmitting) {
  form.querySelectorAll('button[type="submit"]').forEach((button) => {
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'กำลังส่งคำสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ';
  });

  const mobileButton = document.querySelector(
    '.mobile-checkout-bar button[type="submit"]'
  );

  if (mobileButton) {
    mobileButton.disabled = isSubmitting;
    mobileButton.textContent = isSubmitting ? 'กำลังส่ง...' : 'ยืนยัน';
  }
}

document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('#copy-account');

  if (copyButton) {
    copyText(CONFIG.bank.accountNumber, 'คัดลอกเลขบัญชีแล้ว');
  }
});

document.querySelector('#order-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;

  if (!form.checkValidity()) {
    form.reportValidity();
    toast('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ');
    return;
  }

  const cart = getCart();

  if (!cart.length) {
    location.href = 'cart.html';
    return;
  }

  const phone = form.customerPhone.value.replace(/\D/g, '');

  if (phone.length < 9 || phone.length > 10) {
    form.customerPhone.setCustomValidity('กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก');
    form.customerPhone.reportValidity();
    form.customerPhone.setCustomValidity('');
    return;
  }

  const postalCode = form.postalCode.value.replace(/\D/g, '');

  if (postalCode.length !== 5) {
    form.postalCode.setCustomValidity('กรุณากรอกรหัสไปรษณีย์ 5 หลัก');
    form.postalCode.reportValidity();
    form.postalCode.setCustomValidity('');
    return;
  }

  const slipFile = document.querySelector('#slip').files[0];

  if (!slipFile) {
    toast('กรุณาแนบสลิปการชำระเงิน');
    return;
  }

  if (slipFile.size > 5 * 1024 * 1024) {
    toast('ไฟล์ต้องไม่เกิน 5 MB');
    return;
  }

  const formData = new FormData(form);

  if (!formData.get('confirm1')) {
    toast('กรุณายืนยันว่าตรวจสอบข้อมูลแล้ว');
    return;
  }

  setSubmitting(form, true);

  try {
    const slip = await fileToBase64(slipFile);

    const orderData = {
      customerName: formData.get('customerName').trim(),
      phone: phone,
      address: formData.get('address').trim(),
      subdistrict: formData.get('subdistrict').trim(),
      district: formData.get('district').trim(),
      province: formData.get('province').trim(),
      postalCode: postalCode,
      note: '',
      items: cart.map((item) => ({
        type: getProductType(item),
        size: item.size,
        quantity: Number(item.quantity)
      })),
      slip: slip
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('ระบบเชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'ส่งคำสั่งซื้อไม่สำเร็จ');
    }

    clearCart();
    location.href = 'success.html';
  } catch (error) {
    console.error(error);
    toast(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    setSubmitting(form, false);
  }
});

document.addEventListener('DOMContentLoaded', renderSummary);
