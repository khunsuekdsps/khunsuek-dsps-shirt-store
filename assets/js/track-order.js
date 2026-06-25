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


function normalizeProductType(item) {
  const rawType = String(item?.type || item?.productType || '').toLowerCase().trim();
  const name = String(item?.name || item?.productName || '').toLowerCase();
  const unitPrice = Number(item?.unitPrice || 0);

  if (rawType === 'bundle' || rawType === 'promo' || rawType === 'promotion') {
    return 'bundle';
  }

  if (
    name.includes('พี่ขุนช่วยใคร') ||
    name.includes('พลัส') ||
    name.includes('โปรโมชั่น') ||
    unitPrice === 499
  ) {
    return 'bundle';
  }

  return 'shirt';
}

function getProductDisplay(item) {
  const type = normalizeProductType(item);

  if (type === 'bundle') {
    return {
      type: 'bundle',
      badge: 'โครงการพิเศษ',
      name: 'พี่ขุนช่วยใคร พลัส+',
      detail: 'เสื้อ DSPS Cheer Jersey 1 ตัว + ริสแบนด์ 1 คู่',
      unitPrice: Number(item.unitPrice || 499)
    };
  }

  return {
    type: 'shirt',
    badge: 'เสื้อเดี่ยว',
    name: 'เสื้อ DSPS Cheer Jersey 2026',
    detail: '',
    unitPrice: Number(item.unitPrice || 399)
  };
}

function parseLegacySummary(summary) {
  return String(summary || '')
    .split(/,\s*/)
    .filter(Boolean)
    .map((part) => {
      const sizeMatch = part.match(/ไซซ์\s+([^×]+)\s*×\s*(\d+)/);
      const isBundle = part.includes('พี่ขุนช่วยใคร') || part.includes('โปรโมชั่น') || part.includes('พลัส');

      return {
        type: isBundle ? 'bundle' : 'shirt',
        productName: isBundle ? 'พี่ขุนช่วยใคร พลัส+' : 'เสื้อ DSPS Cheer Jersey 2026',
        size: sizeMatch ? sizeMatch[1].trim() : '-',
        quantity: sizeMatch ? Number(sizeMatch[2]) : 1,
        unitPrice: isBundle ? 499 : 399,
        totalPrice: isBundle ? 499 * (sizeMatch ? Number(sizeMatch[2]) : 1) : 399 * (sizeMatch ? Number(sizeMatch[2]) : 1)
      };
    });
}

function renderItems(order) {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : parseLegacySummary(order.productSummary);

  if (!items.length) {
    return '';
  }

  return `
    <div class="items-block">
      <div class="items-label">รายการที่สั่งซื้อ</div>
      ${items.map((item) => {
        const product = getProductDisplay(item);
        const quantity = Number(item.quantity || 1);
        const unitPrice = Number(item.unitPrice || product.unitPrice);
        const totalPrice = Number(item.totalPrice || unitPrice * quantity);
        const detail = product.detail
          ? `<div class="product-meta">${escapeHtml(product.detail)}</div>`
          : '';

        return `
          <div class="product-item ${product.type}">
            <div>
              <span class="product-badge">${escapeHtml(product.badge)}</span>
              <div class="product-name">${escapeHtml(product.name)}</div>
              ${detail}
              <div class="product-meta">ไซซ์ ${escapeHtml(item.size || '-')} · จำนวน ${quantity}</div>
            </div>
            <div class="product-price">
              <b>${formatMoney(totalPrice)}</b>
              <small>${formatMoney(unitPrice)} / รายการ</small>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
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
          <div class="order-title">รายละเอียดคำสั่งซื้อ</div>
        </div>
        <span class="status-pill">${escapeHtml(order.orderStatus || 'รับคำสั่งซื้อแล้ว')}</span>
      </div>

      ${renderItems(order)}

      <div class="status-message">
        <b>${escapeHtml(order.orderStatus || 'รับคำสั่งซื้อแล้ว')}</b><br>
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

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    });

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
