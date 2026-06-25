export const CONFIG = {
  apiUrl: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
  facebookPageUrl: 'https://www.facebook.com/khunsuekdsps',
  wristbandOrderUrl: 'https://khunsuekdsps.github.io/wristband-order',
  bank: {
    name: 'กรุณาใส่ชื่อธนาคาร',
    accountName: 'กรุณาใส่ชื่อบัญชี',
    accountNumber: '000-0-00000-0',
    promptPay: 'กรุณาใส่พร้อมเพย์'
  },
  shipping: { normal: 45, supportDiscount: 10, payable: 35 },
  jersey: {
    id: 'PRODUCT-002',
    name: 'เสื้อ DSPS Cheer Jersey by KhunSuek DSPS 2026',
    image: 'assets/images/header-fashion.jpg',
    mockup: 'assets/images/jersey.jpg',
    price: 399,
    sizes: ['6S','5S','4S','3S','SS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','7XL','8XL'],
    sizeChart: {
      kids: [
        { size: '6S', chest: 26 }, { size: '5S', chest: 28 },
        { size: '4S', chest: 30 }, { size: '3S', chest: 32 }
      ],
      adults: [
        { size: 'SS', chest: 34, length: 25 },
        { size: 'S', chest: 36, length: 26 },
        { size: 'M', chest: 38, length: 27 },
        { size: 'L', chest: 40, length: 28 },
        { size: 'XL', chest: 42, length: 29 },
        { size: '2XL', chest: 44, length: 30 },
        { size: '3XL', chest: 46, length: 31 },
        { size: '4XL', chest: 48, length: 32 },
	{ size: '5XL', chest: 50, length: 32 },
	{ size: '6XL', chest: 52, length: 32 },
	{ size: '7XL', chest: 54, length: 32 },
	{ size: '8XL', chest: 56, length: 32 },
      ],
      note: 'งานตัดเย็บอาจคลาดเคลื่อนเล็กน้อย ไม่เกิน 1 นิ้ว'
    },
    preorderCloseLabel: '24 กรกฎาคม 2569',
    shippingLabel: '1 สิงหาคม 2569'
  },
  bundle: {
    name: 'พี่ขุนช่วยใคร',
    regular: 538,
    price: 499,
    saving: 39,
    note: 'เสื้อ 1 ตัว ราคา 399 บาท พร้อมริสแบนด์ขุนศึก ท.ศ.พ. 2026 จำนวน 1 คู่ ราคา 139 บาท รวมมูลค่า 538 บาท จ่ายเพียง 499 บาท',
    id: 'BUNDLE-001',
    image: 'assets/images/header-fashion.jpg'
  }
};
