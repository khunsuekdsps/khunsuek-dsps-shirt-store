import { CONFIG } from './config.js';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzoQXNoV9ee3Yt6Ep_E6i_Y0VNhTRnXhCfv1RW3ZGcX99q4xjXez5AMOUW1zx45lRac/exec';

const STATUS_STEPS = [
  'รับคำสั่งซื้อแล้ว',
  'รอตรวจสอบการชำระเงิน',
  'ยืนยันการชำระเงินแล้ว',
  'อยู่ในรอบพรีออเดอร์',
  'กำลังสรุปยอดส่งผลิต',
  'เข้าคิวผลิตแล้ว',
  'กำลังผลิต',
  'กำลังตรวจสอบคุณภาพ',
  'กำลังแพ็กสินค้า',
  'พร้อมจัดส่ง',
  'จัดส่งแล้ว',
  'ดำเนินการสำเร็จ'
];

function normalizeStatus(status) {
  const value = String(status || '').trim();
  const aliases = {
    'รอปิดรอบพรีออเดอร์': 'อยู่ในรอบพรีออเดอร์',
    'สรุปยอดส่งผลิต': 'กำลังสรุปยอดส่งผลิต',
    'ตรวจสอบคุณภาพ': 'กำลังตรวจสอบคุณภาพ',
    'แพ็กสินค้า': 'กำลังแพ็กสินค้า',
    'สำเร็จ': 'ดำเนินการสำเร็จ'
  };
  return aliases[value] || value || 'รับคำสั่งซื้อแล้ว';
}

function statusIndex(status) {
  const normalized = normalizeStatus(status);
  const index = STATUS_STEPS.indexOf(normalized);
  return index >= 0 ? index : 0;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('th-TH') + ' บาท';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderOrder(order) {
  const current = statusIndex(order.orderStatus);
  const timeline = STATUS_STEPS.map((_, index) =>
    `<span class="${index <= current ? 'active' : ''}"></span>`
  ).join('');

  const trackingInfo = order.trackingNumber
    ? `<div class="order-info"><small>เลขพัสดุ</small><b>${escapeHtml(order.trackingNumber)}</b></div>`
    : '';

  const carrierInfo = order.shippingProvider
    ? `<div class="order-info"><small>บริษัทขนส่ง</small><b>${escapeHtml(order.shippingProvider)}</b></div>`
    : '';

  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <div class="order-id">เลขออร์เดอร์ ${escapeHtml(order.orderId)}</div>
          <div class="order-title">${escapeHtml(order.productSummary)}</div>
        </div>
        <span class="status-pill">${escapeHtml(normalizeStatus(order.orderStatus))}</span>
      </div>

      <div class="status-message">
        <b>${escapeHtml(order.paymentStatus || 'กำลังดำเนินการ')}</b><br>
        ${escapeHtml(order.statusMessage)}
      </div>

      <div class="timeline-simple" title="ความคืบหน้าของออร์เดอร์">
        ${timeline}
      </div>

      <div class="order-grid">
        <div class="order-info"><small>ชื่อผู้รับ</small><b>${escapeHtml(order.customerName)}</b></div>
        <div class="order-info"><small>ยอดรวม</small><b>${formatMoney(order.grandTotal)}</b></div>
        <div class="order-info"><small>วันที่สั่งซื้อ</small><b>${formatDate(order.createdAt)}</b></div>
        <div class="order-info"><small>จำนวนสินค้า</small><b>${escapeHtml(order.totalQuantity)} รายการ</b></div>
        ${carrierInfo}
        ${trackingInfo}
      </div>

      <div class="updated">
        อัปเดตล่าสุด: ${formatDate(order.updatedAt || order.createdAt)}
      </div>
    </article>
  `;
}

function showMessage(html) {
  document.querySelector('#tracking-result').innerHTML = html;
}

document.querySelector('#tracking-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const phone = document.querySelector('#track-phone').value.replace(/\D/g, '');
  const postalCode = document.querySelector('#track-postal').value.replace(/\D/g, '');
  const button = document.querySelector('#track-submit');

  if (phone.length < 9 || phone.length > 10) {
    showMessage('<div class="order-card empty-state"><b>กรุณากรอกเบอร์โทรให้ถูกต้อง</b></div>');
    return;
  }

  if (postalCode.length !== 5) {
    showMessage('<div class="order-card empty-state"><b>กรุณากรอกรหัสไปรษณีย์ 5 หลัก</b></div>');
    return;
  }

  button.disabled = true;
  button.textContent = 'กำลังค้นหา...';
  showMessage('<div class="order-card loading">กำลังตรวจสอบออร์เดอร์ของคุณ...</div>');

  try {
    const url = new URL(GOOGLE_SCRIPT_URL);
    url.searchParams.set('action', 'track');
    url.searchParams.set('phone', phone);
    url.searchParams.set('postalCode', postalCode);
    url.searchParams.set('_', Date.now().toString());

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      throw new Error('ไม่สามารถเชื่อมต่อระบบได้');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'ค้นหาข้อมูลไม่สำเร็จ');
    }

    if (!Array.isArray(result.orders) || result.orders.length === 0) {
      showMessage(`
        <div class="order-card empty-state">
          <h3>ไม่พบออเดอร์</h3>
          <p class="muted">กรุณาตรวจสอบเบอร์โทรและรหัสไปรษณีย์อีกครั้ง</p>
          <a class="btn btn-light" href="${CONFIG.facebookPageUrl}" target="_blank" rel="noopener">
            ติดต่อ Facebook Page
          </a>
        </div>
      `);
      return;
    }

    showMessage(result.orders.map(renderOrder).join(''));

  } catch (error) {
    showMessage(`
      <div class="order-card empty-state">
        <h3>ระบบยังไม่สามารถค้นหาได้</h3>
        <p class="muted">${escapeHtml(error.message)}</p>
        <a class="btn btn-light" href="${CONFIG.facebookPageUrl}" target="_blank" rel="noopener">
          ติดต่อ Facebook Page
        </a>
      </div>
    `);
  } finally {
    button.disabled = false;
    button.textContent = 'ตรวจสอบสถานะ';
  }
});
