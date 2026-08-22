import {
  calculateCartTotals,
  calculateWaitEstimate,
  canTransitionOrderStatus,
  formatCurrency,
  getNextOrderStatus,
  getSlotAvailability,
} from './src/domain.mjs';

const app = document.querySelector('#app');

const imageUrls = Object.freeze({
  hero: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
  baiTong: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=760&q=85',
  khlong: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=760&q=85',
  chongDee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=760&q=85',
  rice: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=360&q=85',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=360&q=85',
  coffee: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=360&q=85',
  toast: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=360&q=85',
});

const copy = {
  th: {
    'auth.kicker': 'พื้นที่ใช้งานของโรงอาหาร',
    'auth.title': 'สั่งอาหารให้ทันพักเที่ยง',
    'auth.body': 'เข้าสู่ระบบเพื่อดูเมนู จองรอบรับ และติดตามออเดอร์ของคุณ',
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.signIn': 'เข้าสู่ระบบ',
    'auth.demoHint': 'บัญชีทดสอบ: student@demo.jongfood.local / demo-student',
    'auth.staffHint': 'บัญชีร้าน: staff@bai-tong.demo.jongfood.local / demo-staff',
    'auth.invalid': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    'auth.signOut': 'ออกจากระบบ',
    'brand.subtitle': 'โรงอาหารที่ไม่ต้องรอคิว',
    'nav.customer': 'สั่งอาหาร',
    'nav.merchant': 'หลังร้าน',
    'nav.orders': 'ออเดอร์ของฉัน',
    'nav.browse': 'เลือกร้าน',
    'location': 'โรงอาหารกลาง · เชียงใหม่',
    'service.open': 'เปิดรับออเดอร์ · รอบเที่ยง',
    'hero.kicker': 'มื้อเที่ยงที่วางแผนได้',
    'hero.title': 'จองก่อน พักเที่ยงไม่ต้องยืนรอ',
    'hero.body': 'เลือกร้าน ดูเวลารับ และให้ครัวเตรียมมื้อของคุณก่อนคนอื่นจะมาถึง',
    'hero.browse': 'ดูเมนูวันนี้',
    'hero.walkin': 'เข้าคิวหน้าร้าน',
    'shops.kicker': 'ร้านที่เปิดอยู่',
    'shops.title': 'วันนี้กินอะไรดี?',
    'shops.note': 'เวลารอคำนวณจากคิวและกำลังครัว ณ ตอนนี้',
    'shop.open': 'รับออเดอร์อยู่',
    'shop.paused': 'พักรับออเดอร์',
    'shop.wait': 'รอประมาณ',
    'shop.sold': 'หมดชั่วคราว',
    'menu.kicker': 'เมนูของร้าน',
    'menu.capacity': 'ใช้กำลังครัว',
    'menu.add': 'เพิ่ม',
    'menu.customize': 'เลือกตัวเลือก',
    'menu.required': 'จำเป็นต้องเลือก',
    'menu.soldOut': 'หมดแล้ว',
    'menu.all': 'ทั้งหมด',
    'cart.title': 'ออเดอร์ของคุณ',
    'cart.empty': 'ยังไม่มีรายการ ลองเลือกของอร่อยจากเมนูด้านซ้าย',
    'cart.subtotal': 'รวมอาหาร',
    'cart.fee': 'ค่าบริการ',
    'cart.total': 'ยอดรวม',
    'cart.pickup': 'เลือกรอบรับอาหาร',
    'cart.chooseSlot': 'เลือกรอบที่สะดวก',
    'cart.cutoff': 'ปิดรับ',
    'cart.checkout': 'ยืนยันการจอง',
    'cart.walkin': 'รับบัตรคิวตอนนี้',
    'cart.note': 'จ่ายที่ร้าน · ยอดและคิวจะถูกยืนยันก่อนส่งเข้าครัว',
    'cart.items': 'รายการ',
    'orders.kicker': 'ติดตามออเดอร์',
    'orders.title': 'ออเดอร์ของฉัน',
    'orders.back': 'กลับไปเลือกอาหาร',
    'orders.active': 'กำลังดำเนินการ',
    'orders.history': 'ประวัติออเดอร์',
    'orders.estimated': 'พร้อมรับโดยประมาณ',
    'orders.slot': 'รอบรับ',
    'orders.queue': 'คิว',
    'orders.empty': 'ยังไม่มีออเดอร์ ลองจองมื้อแรกของวันนี้ดู',
    'orders.view': 'ดูรายละเอียด',
    'merchant.kicker': 'โหมดผู้ดูแลร้าน · ครัวใบตอง',
    'merchant.title': 'คิวที่ต้องทำ ตอนนี้',
    'merchant.subtitle': 'อัปเดตสถานะจากแท็บเล็ตได้ทันที ทุกออเดอร์มีเวลาเตรียมโดยประมาณ',
    'merchant.open': 'กำลังรับออเดอร์',
    'merchant.paused': 'พักรับออเดอร์',
    'merchant.walkin': 'เพิ่มออเดอร์หน้าร้าน',
    'merchant.queue': 'คิวครัว',
    'merchant.wait': 'เวลารอโดยประมาณ',
    'merchant.menu': 'เมนูและของหมด',
    'merchant.settings': 'ตั้งค่าความเร็ว',
    'metric.active': 'กำลังทำ',
    'metric.wait': 'เวลารอแสดง',
    'metric.capacity': 'กำลังครัว',
    'metric.completed': 'เสร็จแล้ววันนี้',
    'metric.orders': 'ออเดอร์ที่ยังไม่เสร็จ',
    'metric.stations': 'สถานีทำอาหาร 3 จุด',
    'metric.utilized': 'ใช้ไปจากรอบเที่ยง',
    'queue.filter': 'ดูเฉพาะ',
    'queue.all': 'ทั้งหมด',
    'queue.preorder': 'จองล่วงหน้า',
    'queue.walkin': 'หน้าร้าน',
    'queue.new': 'ใหม่ / ยืนยันแล้ว',
    'queue.preparing': 'กำลังทำ',
    'queue.ready': 'พร้อมรับ',
    'queue.empty': 'ไม่มีออเดอร์ในคอลัมน์นี้',
    'queue.next': 'ไปต่อ',
    'queue.readyAt': 'พร้อมประมาณ',
    'queue.submitted': 'เข้ามาเมื่อ',
    'queue.priority': 'เร่งทำ',
    'wait.title': 'เวลารอที่ลูกค้าเห็น',
    'wait.pageKicker': 'จอหน้าร้าน · อัปเดตสด',
    'wait.pageTitle': 'เวลารอโดยประมาณ',
    'wait.pageSubtitle': 'ช่วงเวลานี้ช่วยให้ลูกค้าตัดสินใจได้ โดยไม่สร้างคำสัญญาเกินจริงให้หน้าร้าน',
    'wait.configButton': 'ตั้งค่า',
    'wait.backQueue': 'กลับไปคิวครัว',
    'wait.rangeLabel': 'ลูกค้าเห็นช่วงนี้',
    'wait.nextReady': 'ออเดอร์ถัดไปพร้อมรับ',
    'wait.activeWork': 'งานที่กำลังทำ',
    'wait.unitsPerMinute': 'กำลังครัวต่อนาที',
    'wait.confidence': 'ความมั่นใจของการคำนวณ',
    'wait.mediumConfidence': 'ปานกลาง · คิวกำลังนิ่ง',
    'wait.calculation': 'คำนวณจากคิวและกำลังครัว',
    'wait.liveSignals': 'สัญญาณจากคิวตอนนี้',
    'wait.order': 'ออเดอร์',
    'wait.readyBy': 'พร้อมประมาณ',
    'wait.load': 'โหลด',
    'wait.explainer': 'ช่วงเวลาจะขยับตามจำนวนงานจริงและค่าบัฟเฟอร์ของร้าน',
    'wait.customerRange': 'ลูกค้าเห็นเป็นช่วง ไม่ใช่เวลาการันตี',
    'wait.current': 'คิวตอนนี้',
    'wait.buffer': 'บัฟเฟอร์หน้าร้าน',
    'wait.manualDelay': 'หน่วงเพิ่ม',
    'wait.capacity': 'กำลังทำต่อนาที',
    'wait.saveHint': 'แก้ค่าด้านล่างแล้วหน้าลูกค้าจะคำนวณใหม่ทันที',
    'wait.minutes': 'นาที',
    'wait.units': 'หน่วย',
    'menu.manageTitle': 'รายการอาหารวันนี้',
    'menu.manageHint': 'ปิดรายการที่หมดชั่วคราวได้จากสวิตช์',
    'settings.slots': 'รอบรับอาหาร',
    'settings.slotCapacity': 'ความจุแต่ละรอบ',
    'settings.slotHint': 'แก้ไขความจุเพื่อกระจายคิว ไม่ใช่แค่จำนวนออเดอร์',
    'modal.walkinTitle': 'เพิ่มออเดอร์หน้าร้าน',
    'modal.walkinBody': 'เลือกเมนู แล้วระบบจะใส่ออเดอร์นี้ไว้ในคิวเดียวกับออเดอร์จอง',
    'modal.item': 'รายการอาหาร',
    'modal.cancel': 'ยกเลิก',
    'modal.confirmWalkin': 'สร้างออเดอร์',
    'modal.orderPlacedTitle': 'จองมื้อเที่ยงแล้ว',
    'modal.orderPlacedBody': 'ออเดอร์ของคุณเข้าคิวครัวแล้ว เก็บหน้าจอนี้ไว้ดูสถานะได้เลย',
    'modal.keepTracking': 'ดูสถานะออเดอร์',
    'status.PENDING': 'รอยืนยัน',
    'status.CONFIRMED': 'ยืนยันแล้ว',
    'status.PREPARING': 'กำลังทำ',
    'status.READY': 'พร้อมรับ',
    'status.COLLECTED': 'รับแล้ว',
    'status.CANCELLED': 'ยกเลิก',
    'status.REJECTED': 'ปฏิเสธ',
    'status.NO_SHOW': 'ไม่มารับ',
    'status.step.submitted': 'ส่งออเดอร์',
    'status.step.confirmed': 'ยืนยันแล้ว',
    'status.step.preparing': 'กำลังทำ',
    'status.step.ready': 'พร้อมรับ',
    'type.PREORDER': 'จองล่วงหน้า',
    'type.WALK_IN': 'หน้าร้าน',
    'notice.added': 'เพิ่มลงออเดอร์แล้ว',
    'notice.removed': 'นำรายการออกแล้ว',
    'notice.slot': 'เลือกรอบรับอาหารแล้ว',
    'notice.shopCart': 'ออเดอร์หนึ่งครั้งเลือกได้จากร้านเดียว',
    'notice.paused': 'ร้านพักรับออเดอร์ชั่วคราว',
    'notice.resumed': 'ร้านกลับมาเปิดรับออเดอร์แล้ว',
    'notice.soldOut': 'อัปเดตสถานะเมนูแล้ว',
    'notice.status': 'อัปเดตสถานะออเดอร์แล้ว',
    'notice.walkin': 'เพิ่มออเดอร์หน้าร้านเข้าคิวแล้ว',
    'notice.slotFull': 'รอบนี้เต็มแล้ว ลองเลือกรอบถัดไป',
    'notice.orderPlaced': 'จองสำเร็จ · ออเดอร์เข้าคิวครัวแล้ว',
    'notice.language': 'เปลี่ยนภาษาแล้ว',
    'notice.modifierRequired': 'กรุณาเลือกตัวเลือกที่จำเป็นก่อนเพิ่มรายการ',
    'notice.soldOutError': 'รายการนี้หมดแล้ว กรุณาเลือกเมนูอื่น',
    'notice.forbidden': 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้',
    'notice.sessionExpired': 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    'notice.failure': 'ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง',
    'orders.pickup': 'ยืนยันว่ารับอาหารแล้ว',
    'orders.pickupHint': 'กดเมื่อรับอาหารจากร้านเรียบร้อย',
    'misc.thanks': 'ขอบคุณที่ช่วยกระจายคิวให้ครัว',
    'misc.updated': 'อัปเดตเมื่อสักครู่นี้',
  },
  en: {
    'auth.kicker': 'Your canteen workspace',
    'auth.title': 'Reserve lunch before the rush',
    'auth.body': 'Sign in to browse today’s menus, reserve a pickup window, and track your order.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signIn': 'Sign in',
    'auth.demoHint': 'Demo account: student@demo.jongfood.local / demo-student',
    'auth.staffHint': 'Vendor account: staff@bai-tong.demo.jongfood.local / demo-staff',
    'auth.invalid': 'That email or password is not correct.',
    'auth.signOut': 'Sign out',
    'brand.subtitle': 'A canteen without the peak queue',
    'nav.customer': 'Order food',
    'nav.merchant': 'Back of house',
    'nav.orders': 'My orders',
    'nav.browse': 'Browse shops',
    'location': 'Central Court · Chiang Mai',
    'service.open': 'Ordering open · lunch service',
    'hero.kicker': 'A calmer lunch break',
    'hero.title': 'Reserve lunch. Skip the peak queue.',
    'hero.body': 'Choose a shop, pick a collection window, and let the kitchen get a head start.',
    'hero.browse': "See today's menu",
    'hero.walkin': 'Join walk-in queue',
    'shops.kicker': 'Open right now',
    'shops.title': 'What are you having?',
    'shops.note': 'Wait times reflect the live queue and current kitchen capacity.',
    'shop.open': 'Taking orders',
    'shop.paused': 'Orders paused',
    'shop.wait': 'About',
    'shop.sold': 'Temporarily sold out',
    'menu.kicker': 'Menu at this shop',
    'menu.capacity': 'Kitchen load',
    'menu.add': 'Add',
    'menu.customize': 'Choose options',
    'menu.required': 'Required',
    'menu.soldOut': 'Sold out',
    'menu.all': 'All items',
    'cart.title': 'Your order',
    'cart.empty': 'Nothing here yet. Pick something good from the menu.',
    'cart.subtotal': 'Food subtotal',
    'cart.fee': 'Service fee',
    'cart.total': 'Total',
    'cart.pickup': 'Choose a collection window',
    'cart.chooseSlot': 'Choose a time that works',
    'cart.cutoff': 'Cutoff',
    'cart.checkout': 'Confirm reservation',
    'cart.walkin': 'Get a walk-in number',
    'cart.note': 'Pay at shop · your total and queue number are confirmed before the kitchen starts.',
    'cart.items': 'items',
    'orders.kicker': 'Track your order',
    'orders.title': 'My orders',
    'orders.back': 'Back to menu',
    'orders.active': 'In progress',
    'orders.history': 'Order history',
    'orders.estimated': 'Ready around',
    'orders.slot': 'Collection window',
    'orders.queue': 'Queue',
    'orders.empty': 'No orders yet. Reserve your first lunch of the day.',
    'orders.view': 'View details',
    'merchant.kicker': 'Merchant mode · Bai Tong Kitchen',
    'merchant.title': 'What the kitchen is making',
    'merchant.subtitle': 'Update from a tablet. Every order carries a practical ready-time estimate.',
    'merchant.open': 'Taking orders',
    'merchant.paused': 'Orders paused',
    'merchant.walkin': 'Add walk-in order',
    'merchant.queue': 'Kitchen queue',
    'merchant.wait': 'Estimated wait',
    'merchant.menu': 'Menu & availability',
    'merchant.settings': 'Speed settings',
    'metric.active': 'In progress',
    'metric.wait': 'Displayed wait',
    'metric.capacity': 'Kitchen load',
    'metric.completed': 'Completed today',
    'metric.orders': 'orders in motion',
    'metric.stations': '3 prep stations',
    'metric.utilized': 'used in lunch service',
    'queue.filter': 'Show',
    'queue.all': 'Everything',
    'queue.preorder': 'Pre-orders',
    'queue.walkin': 'Walk-ins',
    'queue.new': 'New / confirmed',
    'queue.preparing': 'Preparing',
    'queue.ready': 'Ready for pickup',
    'queue.empty': 'No orders in this column',
    'queue.next': 'Move forward',
    'queue.readyAt': 'Ready around',
    'queue.submitted': 'Submitted',
    'queue.priority': 'Do next',
    'wait.title': 'Customer-facing wait',
    'wait.pageKicker': 'Counter display · live update',
    'wait.pageTitle': 'Estimated wait time',
    'wait.pageSubtitle': 'A practical range helps people decide without making a promise the kitchen cannot keep.',
    'wait.configButton': 'Configure',
    'wait.backQueue': 'Back to kitchen queue',
    'wait.rangeLabel': 'Customer-facing range',
    'wait.nextReady': 'Next order ready',
    'wait.activeWork': 'Active prep work',
    'wait.unitsPerMinute': 'Kitchen units per minute',
    'wait.confidence': 'Estimate confidence',
    'wait.mediumConfidence': 'Medium · queue is steady',
    'wait.calculation': 'Calculated from queue and capacity',
    'wait.liveSignals': 'Live queue signals',
    'wait.order': 'Order',
    'wait.readyBy': 'Ready around',
    'wait.load': 'Load',
    'wait.explainer': 'The range moves with real work in the queue and the shop buffer.',
    'wait.customerRange': 'A range, never a promise',
    'wait.current': 'Live queue',
    'wait.buffer': 'Shop buffer',
    'wait.manualDelay': 'Manual delay',
    'wait.capacity': 'Units per minute',
    'wait.saveHint': 'Change a value and the customer view recalculates immediately.',
    'wait.minutes': 'min',
    'wait.units': 'units',
    'menu.manageTitle': "Today's menu",
    'menu.manageHint': 'Switch off items when they sell out.',
    'settings.slots': 'Collection windows',
    'settings.slotCapacity': 'Window capacity',
    'settings.slotHint': 'Tune capacity to spread the queue, not only order count.',
    'modal.walkinTitle': 'Add a walk-in order',
    'modal.walkinBody': 'Pick a menu item and the order joins the same preparation queue as pre-orders.',
    'modal.item': 'Menu item',
    'modal.cancel': 'Cancel',
    'modal.confirmWalkin': 'Create order',
    'modal.orderPlacedTitle': 'Lunch reserved',
    'modal.orderPlacedBody': 'Your order is in the kitchen queue. Keep this screen open for live status.',
    'modal.keepTracking': 'Track this order',
    'status.PENDING': 'Needs confirmation',
    'status.CONFIRMED': 'Confirmed',
    'status.PREPARING': 'Preparing',
    'status.READY': 'Ready',
    'status.COLLECTED': 'Collected',
    'status.CANCELLED': 'Cancelled',
    'status.REJECTED': 'Rejected',
    'status.NO_SHOW': 'No show',
    'status.step.submitted': 'Submitted',
    'status.step.confirmed': 'Confirmed',
    'status.step.preparing': 'Preparing',
    'status.step.ready': 'Ready',
    'type.PREORDER': 'Pre-order',
    'type.WALK_IN': 'Walk-in',
    'notice.added': 'Added to your order',
    'notice.removed': 'Item removed',
    'notice.slot': 'Collection window selected',
    'notice.shopCart': 'One order can only come from one shop',
    'notice.paused': 'This shop is pausing online orders',
    'notice.resumed': 'This shop is accepting orders again',
    'notice.soldOut': 'Menu availability updated',
    'notice.status': 'Order status updated',
    'notice.walkin': 'Walk-in order added to the queue',
    'notice.slotFull': 'That window is full. Try the next one.',
    'notice.orderPlaced': 'Reservation confirmed · order is in the kitchen queue',
    'notice.language': 'Language changed',
    'notice.modifierRequired': 'Choose every required option before adding this item.',
    'notice.soldOutError': 'That item is sold out. Choose another menu item.',
    'notice.forbidden': 'This account cannot perform that action.',
    'notice.sessionExpired': 'Your session expired. Sign in again.',
    'notice.failure': 'That action did not complete. Try again.',
    'orders.pickup': 'Confirm pickup',
    'orders.pickupHint': 'Use this after you collect the order from the vendor.',
    'misc.thanks': 'Thanks for helping the kitchen spread the rush',
    'misc.updated': 'Updated just now',
  },
};

const fallbackShops = [
  {
    id: 'bai-tong',
    name: { th: 'ครัวใบตอง', en: 'Bai Tong Kitchen' },
    description: { th: 'ข้าวราดแกง · กับข้าวทำใหม่', en: 'Thai rice bowls · cooked fresh' },
    emoji: '🍱',
    image: imageUrls.baiTong,
    settings: { baseCapacityPerMinute: 1.7, bufferMinutes: 3 },
    menu: [
      { id: 'bai-1', category: 'จานเดียว / Bowls', name: { th: 'กะเพราไก่ไข่ดาว', en: 'Basil chicken with egg' }, description: { th: 'เผ็ดกำลังดี ข้าวหอมมะลิร้อนๆ', en: 'Fragrant jasmine rice, medium heat' }, priceMinor: 5500, capacityUnits: 1.2, emoji: '🍳', image: imageUrls.rice, available: true },
      { id: 'bai-2', category: 'จานเดียว / Bowls', name: { th: 'ข้าวหมูกรอบคั่วพริกเกลือ', en: 'Crispy pork with chili salt' }, description: { th: 'หมูกรอบชิ้นพอดีคำ หอมพริกคั่ว', en: 'Crisp pork with toasted chili' }, priceMinor: 6500, capacityUnits: 1.6, emoji: '🥓', image: imageUrls.rice, available: true },
      { id: 'bai-3', category: 'กับข้าว / Sides', name: { th: 'ไข่พะโล้เต้าหู้', en: 'Five-spice egg & tofu' }, description: { th: 'หวานเค็มกลมกล่อม ทานง่าย', en: 'Soft, savoury and comforting' }, priceMinor: 3500, capacityUnits: 0.8, emoji: '🥚', image: imageUrls.toast, available: true },
      { id: 'bai-4', category: 'กับข้าว / Sides', name: { th: 'ต้มจืดสาหร่ายหมูสับ', en: 'Clear pork & seaweed soup' }, description: { th: 'ซุปร้อนเบาๆ สำหรับวันเร่งรีบ', en: 'A light hot soup for busy days' }, priceMinor: 4000, capacityUnits: 0.9, emoji: '🍲', image: imageUrls.rice, available: false },
      { id: 'bai-5', category: 'เครื่องดื่ม / Drinks', name: { th: 'น้ำเก๊กฮวยไม่หวาน', en: 'Unsweetened chrysanthemum tea' }, description: { th: 'เย็นสดชื่น ดื่มคู่กับทุกจาน', en: 'Cold and bright with any meal' }, priceMinor: 2000, capacityUnits: 0.1, emoji: '🧃', image: imageUrls.coffee, available: true },
    ],
  },
  {
    id: 'khlong-noodles',
    name: { th: 'เส้นสดริมคลอง', en: 'Khlong Noodles' },
    description: { th: 'ก๋วยเตี๋ยวชามไว · ซุปเคี่ยว', en: 'Fast bowls · slow-simmered broth' },
    emoji: '🍜',
    image: imageUrls.khlong,
    settings: { baseCapacityPerMinute: 2.2, bufferMinutes: 2 },
    menu: [
      { id: 'khlong-1', category: 'ก๋วยเตี๋ยว / Noodles', name: { th: 'ก๋วยเตี๋ยวหมูตุ๋น', en: 'Braised pork noodles' }, description: { th: 'ซุปเข้มข้น เส้นนุ่มพอดี', en: 'Deep broth, springy noodles' }, priceMinor: 5000, capacityUnits: 1.2, emoji: '🍜', image: imageUrls.noodles, available: true },
      { id: 'khlong-2', category: 'ก๋วยเตี๋ยว / Noodles', name: { th: 'เย็นตาโฟเครื่องแน่น', en: 'Yentafo noodle bowl' }, description: { th: 'เต้าหู้ปลา ลูกชิ้น และผักสด', en: 'Fish tofu, meatballs and greens' }, priceMinor: 5500, capacityUnits: 1.5, emoji: '🥢', image: imageUrls.noodles, available: true },
      { id: 'khlong-3', category: 'ทานเล่น / Snacks', name: { th: 'เกี๊ยวทอด', en: 'Crispy dumplings' }, description: { th: 'กรอบใหม่ทุกชั่วโมง', en: 'Crisp and fried in small batches' }, priceMinor: 3000, capacityUnits: 0.5, emoji: '🥟', image: imageUrls.toast, available: true },
      { id: 'khlong-4', category: 'เครื่องดื่ม / Drinks', name: { th: 'ชาไทยเย็น', en: 'Iced Thai tea' }, description: { th: 'หอมชา เข้มกำลังดี', en: 'Bold tea, gently sweet' }, priceMinor: 2500, capacityUnits: 0.2, emoji: '🧋', image: imageUrls.coffee, available: true },
      { id: 'khlong-5', category: 'ทานเล่น / Snacks', name: { th: 'ลูกชิ้นปิ้ง', en: 'Grilled meatballs' }, description: { th: 'น้ำจิ้มมะขามเผ็ดหวาน', en: 'Sweet-spicy tamarind sauce' }, priceMinor: 3500, capacityUnits: 0.7, emoji: '🍢', image: imageUrls.rice, available: true },
    ],
  },
  {
    id: 'chong-dee',
    name: { th: 'ชงดี', en: 'Chong Dee Coffee' },
    description: { th: 'กาแฟ · ขนมปังปิ้ง · พักสั้นๆ', en: 'Coffee · toast · a small pause' },
    emoji: '☕',
    image: imageUrls.chongDee,
    settings: { baseCapacityPerMinute: 2.8, bufferMinutes: 2 },
    menu: [
      { id: 'chong-1', category: 'กาแฟ / Coffee', name: { th: 'อเมริกาโน่น้ำผึ้ง', en: 'Honey americano' }, description: { th: 'กาแฟคั่วกลาง หอมหวานบางๆ', en: 'Medium roast with a soft sweetness' }, priceMinor: 4500, capacityUnits: 0.4, emoji: '☕', image: imageUrls.coffee, available: true },
      { id: 'chong-2', category: 'กาแฟ / Coffee', name: { th: 'ลาเต้เย็น', en: 'Iced latte' }, description: { th: 'นมเนียน กาแฟชัด', en: 'Silky milk, clear espresso' }, priceMinor: 5000, capacityUnits: 0.5, emoji: '🥛', image: imageUrls.coffee, available: true },
      { id: 'chong-3', category: 'ขนม / Bakery', name: { th: 'ขนมปังปิ้งสังขยา', en: 'Toast with pandan custard' }, description: { th: 'ปิ้งร้อน กรอบนอกนุ่มใน', en: 'Toasted warm, crisp outside' }, priceMinor: 3500, capacityUnits: 0.6, emoji: '🍞', image: imageUrls.toast, available: true },
      { id: 'chong-4', category: 'ขนม / Bakery', name: { th: 'ครัวซองต์เนยสด', en: 'Butter croissant' }, description: { th: 'อบเช้านี้ เหลือจำนวนจำกัด', en: 'Baked this morning, limited batch' }, priceMinor: 5500, capacityUnits: 0.4, emoji: '🥐', image: imageUrls.toast, available: false },
      { id: 'chong-5', category: 'เครื่องดื่ม / Drinks', name: { th: 'มัทฉะนมสด', en: 'Matcha milk' }, description: { th: 'มัทฉะกลิ่นหญ้า นมสดเย็น', en: 'Green, creamy and cold' }, priceMinor: 5500, capacityUnits: 0.6, emoji: '🍵', image: imageUrls.coffee, available: true },
    ],
  },
];

let shops = fallbackShops;

const slotTemplates = [
  { id: 'slot-1', label: '11:30–11:45', cutoff: '11:15', maxOrders: 10, maxCapacityUnits: 15 },
  { id: 'slot-2', label: '11:45–12:00', cutoff: '11:30', maxOrders: 10, maxCapacityUnits: 15 },
  { id: 'slot-3', label: '12:00–12:15', cutoff: '11:45', maxOrders: 10, maxCapacityUnits: 15 },
  { id: 'slot-4', label: '12:15–12:30', cutoff: '12:00', maxOrders: 8, maxCapacityUnits: 12 },
];

const seedOrders = [
  {
    id: 'order-0412', ref: 'JF-0412', queueNumber: 'A12', shopId: 'bai-tong', orderType: 'PREORDER', status: 'PREPARING',
    items: [{ itemId: 'bai-1', quantity: 1, priceMinor: 5500, capacityUnits: 1.2 }], totalMinor: 5500, capacityUnits: 1.2,
    slotId: 'slot-2', slotLabel: '11:45–12:00', createdAt: '2026-08-03T04:36:00.000Z', confirmedAt: '2026-08-03T04:37:00.000Z', estimatedReadyAt: '2026-08-03T05:12:00.000Z',
    statusHistory: [{ status: 'CONFIRMED', at: '2026-08-03T04:37:00.000Z' }, { status: 'PREPARING', at: '2026-08-03T04:43:00.000Z' }],
  },
  {
    id: 'order-0411', ref: 'JF-0411', queueNumber: 'A11', shopId: 'bai-tong', orderType: 'WALK_IN', status: 'READY',
    items: [{ itemId: 'bai-2', quantity: 1, priceMinor: 6500, capacityUnits: 1.6 }], totalMinor: 6500, capacityUnits: 1.6,
    createdAt: '2026-08-03T04:31:00.000Z', confirmedAt: '2026-08-03T04:31:00.000Z', estimatedReadyAt: '2026-08-03T04:49:00.000Z', readyAt: '2026-08-03T04:50:00.000Z',
    statusHistory: [{ status: 'CONFIRMED', at: '2026-08-03T04:31:00.000Z' }, { status: 'PREPARING', at: '2026-08-03T04:35:00.000Z' }, { status: 'READY', at: '2026-08-03T04:50:00.000Z' }],
  },
  {
    id: 'order-0409', ref: 'JF-0409', queueNumber: 'A09', shopId: 'bai-tong', orderType: 'PREORDER', status: 'COLLECTED',
    items: [{ itemId: 'bai-1', quantity: 1, priceMinor: 5500, capacityUnits: 1.2 }, { itemId: 'bai-5', quantity: 1, priceMinor: 2000, capacityUnits: 0.1 }], totalMinor: 7500, capacityUnits: 1.3,
    slotId: 'slot-1', slotLabel: '11:30–11:45', createdAt: '2026-08-03T04:03:00.000Z', confirmedAt: '2026-08-03T04:04:00.000Z', estimatedReadyAt: '2026-08-03T04:28:00.000Z', collectedAt: '2026-08-03T04:38:00.000Z',
    statusHistory: [{ status: 'CONFIRMED', at: '2026-08-03T04:04:00.000Z' }, { status: 'PREPARING', at: '2026-08-03T04:11:00.000Z' }, { status: 'READY', at: '2026-08-03T04:28:00.000Z' }, { status: 'COLLECTED', at: '2026-08-03T04:38:00.000Z' }],
  },
];

const baseState = {
  lang: 'th',
  session: null,
  isLoading: true,
  authError: '',
  submitting: false,
  view: 'customer',
  customerSection: 'browse',
  activeShopId: 'bai-tong',
  activeCategory: 'all',
  cart: [],
  selectedSlotId: 'slot-2',
  merchantTab: 'queue',
  queueFilter: 'all',
  paused: false,
  notice: '',
  modal: null,
  walkInItemId: 'bai-2',
  orderSequence: 13,
  orders: seedOrders,
  waitSettings: {
    baseCapacityPerMinute: 1.7,
    bufferMinutes: 3,
    manualDelayMinutes: 0,
    minimumWaitMinutes: 5,
    maximumWaitMinutes: 60,
    roundingMinutes: 5,
  },
  slotUsage: {
    'bai-tong:slot-1': { bookedOrders: 7, bookedCapacityUnits: 9.4 },
    'bai-tong:slot-2': { bookedOrders: 6, bookedCapacityUnits: 9.5 },
    'bai-tong:slot-3': { bookedOrders: 2, bookedCapacityUnits: 3.2 },
    'bai-tong:slot-4': { bookedOrders: 0, bookedCapacityUnits: 0 },
  },
  availability: {},
};

const loadState = () => {
  return structuredClone(baseState);
};

let state = loadState();
let noticeTimer;

const t = (key) => copy[state.lang]?.[key] || copy.en[key] || key;
const localized = (value) => value?.[state.lang] || value?.en || value || '';
const shopById = (id) => shops.find((shop) => shop.id === id) || shops[0];
const itemById = (shopId, itemId) => shopById(shopId).menu.find((item) => item.id === itemId);
const activeShop = () => shopById(state.activeShopId);
const statusText = (status) => t(`status.${status}`);
const orderTypeText = (type) => t(`type.${type}`);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const formatMoney = (minorUnits) => formatCurrency(minorUnits, 'THB', state.lang === 'th' ? 'th-TH' : 'en-US');
const formatTime = (value) => new Intl.DateTimeFormat(state.lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = payload.error?.code || 'REQUEST_FAILED';
    error.details = payload.error?.details;
    throw error;
  }
  return payload;
}

async function refreshFromServer({ renderAfter = true } = {}) {
  const payload = await api('/api/bootstrap');
  shops = payload.vendors?.length ? payload.vendors : fallbackShops;
  state.session = payload.user;
  state.orders = payload.orders || [];
  state.slotUsage = payload.slotUsage || {};
  state.managedVendorIds = payload.managedVendorIds || [];
  state.metrics = payload.metrics || null;
  if (!shops.some((shop) => shop.id === state.activeShopId)) state.activeShopId = shops[0]?.id || 'bai-tong';
  const firstSlot = getSlots(state.activeShopId).find((slot) => !getSlotAvailability(slot, 0).full);
  if (!getSlots(state.activeShopId).some((slot) => slot.id === state.selectedSlotId)) state.selectedSlotId = firstSlot?.id || getSlots(state.activeShopId)[0]?.id || null;
  state.paused = Boolean(activeShop()?.serviceOpen === false);
  state.waitSettings = { ...state.waitSettings, ...(activeShop()?.settings || {}) };
  state.isLoading = false;
  state.authError = '';
  if (renderAfter) render();
  return payload;
}

function friendlyError(error) {
  if (error?.code === 'CAPACITY_EXHAUSTED') return t('notice.slotFull');
  if (error?.code === 'REQUIRED_MODIFIER') return t('notice.modifierRequired');
  if (error?.code === 'SOLD_OUT') return t('notice.soldOutError');
  if (error?.code === 'FORBIDDEN') return t('notice.forbidden');
  if (error?.code === 'UNAUTHENTICATED') return t('notice.sessionExpired');
  return error?.message || t('notice.failure');
}

function icon(name, size = 18) {
  const paths = {
    bowl: '<path d="M3.5 7.5h13l-1 5.2a2.8 2.8 0 0 1-2.75 2.3h-4.5a2.8 2.8 0 0 1-2.75-2.3l-1-5.2Z"/><path d="M2.5 7.5h15M6.5 18h7M9 3.5c0 1 1.5 1 1.5 2.5M12.5 3.5c0 1-1.5 1-1.5 2.5"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.7 3.9-3.9 1.7 1.7-3.9 3.9-1.7Z"/>',
    receipt: '<path d="M6 3.5h12v17l-3-1.7-3 1.7-3-1.7-3 1.7v-17Z"/><path d="M9 8h6M9 11.5h6M9 15h3"/>',
    store: '<path d="M4 10.5V20h16v-9.5M3 10.5h18L19 4H5l-2 6.5Z"/><path d="M8 20v-5h8v5M3.5 10.5c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12 4.3 4.3L19 7"/>',
    pause: '<rect x="6.5" y="5" width="3" height="14" rx="1"/><rect x="14.5" y="5" width="3" height="14" rx="1"/>',
    play: '<path d="m8 5 10 7-10 7V5Z"/>',
    spark: '<path d="m12 3 1.4 6.6L20 11l-6.6 1.4L12 19l-1.4-6.6L4 11l6.6-1.4L12 3Z"/>',
    settings: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19 13.5 1.4 1-.9 1.6-1.7-.4a7.3 7.3 0 0 1-1.1 1.1l.4 1.7-1.6.9-1-1.4a7.4 7.4 0 0 1-1.5.2l-.7 1.6h-1.9l-.7-1.6a7.4 7.4 0 0 1-1.5-.2l-1 1.4-1.6-.9.4-1.7a7.3 7.3 0 0 1-1.1-1.1l-1.7.4-.9-1.6 1.4-1a7.2 7.2 0 0 1-.1-1.5l-1.6-.7v-1.9l1.6-.7a7.2 7.2 0 0 1 .1-1.5l-1.4-1 .9-1.6 1.7.4a7.3 7.3 0 0 1 1.1-1.1L6.8 3l1.6-.9 1 1.4a7.4 7.4 0 0 1 1.5-.2l.7-1.6h1.9l.7 1.6a7.4 7.4 0 0 1 1.5.2l1-1.4 1.6.9-.4 1.7a7.3 7.3 0 0 1 1.1 1.1l1.7-.4.9 1.6-1.4 1a7.2 7.2 0 0 1 .1 1.5l1.6.7v1.9l-1.6.7a7.2 7.2 0 0 1-.1 1.5Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    refresh: '<path d="M19 8a7.5 7.5 0 0 0-13.3-1.8L4 8.5M4 4v4.5h4.5M5 16a7.5 7.5 0 0 0 13.3 1.8l1.7-2.3M20 20v-4.5h-4.5"/>',
    'log-out': '<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>',
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.spark}</svg>`;
}

function renderAuth() {
  return `<main class="auth-shell"><section class="auth-panel" aria-labelledby="auth-title"><div class="auth-brand"><span class="brand-mark">${icon('bowl', 22)}</span><span><strong>JongFood</strong><small>${escapeHtml(t('brand.subtitle'))}</small></span></div><p class="eyebrow">${escapeHtml(t('auth.kicker'))}</p><h1 id="auth-title">${escapeHtml(t('auth.title'))}</h1><p class="lede">${escapeHtml(t('auth.body'))}</p><form class="auth-form" data-auth-form><label for="auth-email">${escapeHtml(t('auth.email'))}</label><input id="auth-email" name="email" type="email" autocomplete="username" required value="student@demo.jongfood.local"><label for="auth-password">${escapeHtml(t('auth.password'))}</label><input id="auth-password" name="password" type="password" autocomplete="current-password" required value="demo-student">${state.authError ? `<p class="form-error" role="alert">${escapeHtml(state.authError)}</p>` : ''}<button class="button button-primary button-full" type="submit" ${state.submitting ? 'disabled' : ''}>${state.submitting ? escapeHtml(state.lang === 'th' ? 'กำลังตรวจสอบ…' : 'Checking…') : `${icon('arrow', 16)}${escapeHtml(t('auth.signIn'))}`}</button></form><div class="auth-hints"><p>${escapeHtml(t('auth.demoHint'))}</p><p>${escapeHtml(t('auth.staffHint'))}</p></div></section></main>`;
}

function persist() {
  // Identity, orders, capacity, and operational state live on the server. This
  // function remains as a no-op so view-only transitions stay easy to audit.
}

function notify(message) {
  state.notice = message;
  persist();
  render();
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    state.notice = '';
    render();
  }, 3200);
}

function waitForShop(shopId = state.activeShopId) {
  const shop = shopById(shopId);
  if (shop.wait) return { ...shop.wait, estimatedReadyAt: new Date(shop.wait.estimatedReadyAt) };
  const activeOrders = state.orders.filter((order) => order.shopId === shopId && ['CONFIRMED', 'PREPARING'].includes(order.status));
  const activeUnits = activeOrders.reduce((sum, order) => sum + Number(order.capacityUnits || 0), 0);
  const nearTermUnits = state.orders.filter((order) => order.shopId === shopId && order.status === 'PENDING').reduce((sum, order) => sum + Number(order.capacityUnits || 0), 0);
  const settings = shopId === 'bai-tong' ? state.waitSettings : { ...state.waitSettings, ...shop.settings };
  return calculateWaitEstimate({
    ...settings,
    activeOrderWorkUnits: activeUnits,
    incomingOrderWorkUnits: 0,
    nearTermReservedWorkUnits: nearTermUnits,
    confidence: activeOrders.length > 4 ? 'low' : 'medium',
  });
}

function getSlots(shopId = state.activeShopId) {
  const shop = shopById(shopId);
  if (Array.isArray(shop.slots) && shop.slots.length) return shop.slots;
  return slotTemplates.map((slot) => ({ ...slot, ...(state.slotUsage[`${shopId}:${slot.id}`] || { bookedOrders: 0, bookedCapacityUnits: 0 }) }));
}

function cartLines() {
  return state.cart.map((line) => {
    const item = itemById(line.shopId, line.itemId);
    return item ? { ...item, quantity: line.quantity, shopId: line.shopId, modifiers: line.modifiers || [] } : null;
  }).filter(Boolean);
}

function cartTotals() {
  return calculateCartTotals(cartLines(), 0.02);
}

function currentAvailability(item) {
  return state.availability[item.id] ?? item.available !== false;
}

function orderItemsLabel(order) {
  return order.items.map((line) => {
    const item = itemById(order.shopId, line.itemId);
    return `${line.quantity}× ${localized(item?.name) || line.itemId}`;
  }).join(', ');
}

function statusClass(status) {
  if (['READY', 'COLLECTED'].includes(status)) return 'is-positive';
  if (['PENDING', 'PREPARING'].includes(status)) return 'is-warning';
  if (['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(status)) return 'is-danger';
  return 'is-info';
}

function formatWait(estimate) {
  if (estimate.lowerBoundMinutes === estimate.upperBoundMinutes) return `${estimate.lowerBoundMinutes} ${t('wait.minutes')}`;
  return `${estimate.lowerBoundMinutes}–${estimate.upperBoundMinutes} ${t('wait.minutes')}`;
}

function renderTopbar() {
  const customerActive = state.view === 'customer';
  const canManage = ['VENDOR_STAFF', 'MANAGER', 'ORG_ADMIN'].includes(state.session?.role);
  const displayName = localized(state.session?.displayName) || state.session?.email || 'JongFood';
  return `
    <header class="topbar">
      <a class="brand-lockup" href="#" data-action="home" aria-label="JongFood home">
        <span class="brand-mark">${icon('bowl', 20)}</span>
        <span><span class="brand-name">JongFood</span><span class="brand-subtitle">${escapeHtml(t('brand.subtitle'))}</span></span>
      </a>
      <nav class="primary-nav" aria-label="${state.lang === 'th' ? 'เมนูหลัก' : 'Primary navigation'}">
        <button class="nav-button ${customerActive && state.customerSection === 'browse' ? 'is-active' : ''}" data-view="customer" data-customer-section="browse">${icon('compass', 16)}${escapeHtml(t('nav.customer'))}</button>
        <button class="nav-button ${customerActive && state.customerSection === 'orders' ? 'is-active' : ''}" data-view="customer" data-customer-section="orders">${icon('receipt', 16)}${escapeHtml(t('nav.orders'))}${state.orders.filter((order) => !['COLLECTED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(order.status)).length ? `<span class="cart-count">${state.orders.filter((order) => !['COLLECTED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(order.status)).length}</span>` : ''}</button>
        ${canManage ? `<button class="nav-button ${state.view === 'merchant' ? 'is-active' : ''}" data-view="merchant">${icon('store', 16)}${escapeHtml(t('nav.merchant'))}</button>` : ''}
      </nav>
      <div class="topbar-actions">
        <span class="sr-only">${state.lang === 'th' ? 'เลือกภาษา' : 'Choose language'}</span>
        <div class="locale-toggle" role="group" aria-label="Language">
          <button class="locale-button ${state.lang === 'th' ? 'is-active' : ''}" data-lang="th" aria-pressed="${state.lang === 'th'}">TH</button>
          <button class="locale-button ${state.lang === 'en' ? 'is-active' : ''}" data-lang="en" aria-pressed="${state.lang === 'en'}">EN</button>
        </div>
        <span class="avatar" aria-label="${escapeHtml(displayName)}">${escapeHtml(displayName.slice(0, 1).toUpperCase())}</span>
        <button class="icon-button topbar-logout" data-action="logout" aria-label="${escapeHtml(t('auth.signOut'))}" title="${escapeHtml(t('auth.signOut'))}">${icon('log-out', 17)}</button>
      </div>
    </header>`;
}

function renderWorkspaceHeader() {
  return `
    <div class="workspace-header">
      <div>
        <p class="eyebrow">${escapeHtml(t('location'))}</p>
        <h1>${escapeHtml(state.customerSection === 'orders' ? t('orders.title') : t('hero.title'))}</h1>
        <p class="lede">${escapeHtml(state.customerSection === 'orders' ? t('orders.kicker') : t('hero.body'))}</p>
      </div>
      <button class="button button-ghost" data-view="customer" data-customer-section="orders">${icon('receipt', 16)}${escapeHtml(t('nav.orders'))}</button>
    </div>`;
}

function renderHero() {
  const wait = waitForShop('bai-tong');
  return `
    <section class="hero-panel" aria-labelledby="hero-heading">
      <div class="hero-copy">
        <div>
          <span class="hero-kicker">${escapeHtml(t('hero.kicker'))}</span>
          <h2 id="hero-heading">${escapeHtml(t('hero.title'))}</h2>
          <p>${escapeHtml(t('hero.body'))}</p>
        </div>
        <div class="hero-actions">
          <button class="button button-light" data-action="scroll-menu">${escapeHtml(t('hero.browse'))} ${icon('arrow', 16)}</button>
          <button class="button button-ghost" data-action="walk-in" style="color: var(--color-text-inverse); border-color: rgba(252, 250, 245, 0.35);">${escapeHtml(t('hero.walkin'))}</button>
        </div>
      </div>
      <div class="hero-image" style="background-image: url('${imageUrls.hero}')" role="img" aria-label="${state.lang === 'th' ? 'อาหารไทยที่จัดเตรียมสดใหม่' : 'Freshly prepared Thai food'}">
        <div class="hero-stamp"><span><strong>${wait.upperBoundMinutes}</strong>${escapeHtml(t('wait.minutes'))}<br>${state.lang === 'th' ? 'โดยประมาณ' : 'estimate'}</span></div>
      </div>
    </section>`;
}

function renderShops() {
  return `
    <section class="shop-section" aria-labelledby="shops-heading">
      <div class="section-heading">
        <div><p class="section-kicker">${escapeHtml(t('shops.kicker'))}</p><h2 id="shops-heading">${escapeHtml(t('shops.title'))}</h2></div>
        <p class="section-intro">${escapeHtml(t('shops.note'))}</p>
      </div>
      <div class="shop-grid">
        ${shops.map((shop) => {
          const wait = waitForShop(shop.id);
          const isPaused = shop.serviceOpen === false;
          return `<button class="shop-choice ${state.activeShopId === shop.id ? 'is-active' : ''}" data-shop-id="${shop.id}" aria-pressed="${state.activeShopId === shop.id}">
            <span class="shop-photo" style="background-image: url('${shop.image}')"><span class="shop-emoji">${shop.emoji}</span></span>
            <span class="shop-details"><span class="shop-meta"><span><i class="status-dot ${isPaused ? 'is-danger' : wait.upperBoundMinutes >= 30 ? 'is-warning' : ''}"></i>${escapeHtml(isPaused ? t('shop.paused') : t('shop.open'))}</span><span>${escapeHtml(t('shop.wait'))} ${wait.lowerBoundMinutes}–${wait.upperBoundMinutes}m</span></span><h3>${escapeHtml(localized(shop.name))}</h3><span class="shop-meta"><span>${escapeHtml(localized(shop.description))}</span><span>${shop.menu.filter((item) => currentAvailability(item)).length}/${shop.menu.length}</span></span></span>
          </button>`;
        }).join('')}
      </div>
    </section>`;
}

function renderMenu() {
  const shop = activeShop();
  const categories = ['all', ...new Set(shop.menu.map((item) => item.category))];
  const items = shop.menu.filter((item) => state.activeCategory === 'all' || item.category === state.activeCategory);
  return `
    <section class="menu-section" id="menu" aria-labelledby="menu-heading">
      <div class="section-heading"><div><p class="section-kicker">${escapeHtml(t('menu.kicker'))}</p><h2 id="menu-heading">${escapeHtml(localized(shop.name))}</h2></div><span class="availability-badge ${shop.serviceOpen === false ? 'is-sold' : 'is-open'}">${icon('clock', 13)}${escapeHtml(formatWait(waitForShop(shop.id)))} · ${escapeHtml(t('shop.wait'))}</span></div>
      <div class="menu-toolbar"><div class="category-tabs" role="tablist" aria-label="${state.lang === 'th' ? 'หมวดหมู่เมนู' : 'Menu categories'}">${categories.map((category) => `<button class="category-tab ${state.activeCategory === category ? 'is-active' : ''}" data-category="${escapeHtml(category)}" role="tab" aria-selected="${state.activeCategory === category}">${escapeHtml(category === 'all' ? t('menu.all') : category)}</button>`).join('')}</div><span class="table-label">${shop.menu.filter((item) => currentAvailability(item)).length} / ${shop.menu.length} ${state.lang === 'th' ? 'รายการพร้อมสั่ง' : 'items available'}</span></div>
      <div class="menu-list">
        ${items.map((item) => {
          const available = currentAvailability(item) && shop.serviceOpen !== false;
          const needsOptions = (item.modifiers || []).some((modifier) => modifier.required);
          return `<article class="menu-row" data-testid="menu-item-${escapeHtml(item.id)}"><span class="menu-thumbnail" style="background-image: url('${item.image}')"><span>${item.emoji}</span></span><div class="menu-copy"><h3>${escapeHtml(localized(item.name))}</h3><p>${escapeHtml(localized(item.description))}</p><div class="menu-line-meta"><strong>${formatMoney(item.priceMinor)}</strong><span>${escapeHtml(t('menu.capacity'))} ${item.capacityUnits} ${escapeHtml(t('wait.units'))}</span>${needsOptions ? `<span class="modifier-hint">${escapeHtml(t('menu.customize'))} · ${escapeHtml(t('menu.required'))}</span>` : ''}${!available ? `<span class="availability-badge is-sold">${escapeHtml(t('menu.soldOut'))}</span>` : ''}</div></div><button class="menu-action" data-action="add-item" data-item-id="${item.id}" data-shop-id="${shop.id}" ${available ? '' : 'disabled'} aria-label="${escapeHtml(t('menu.add'))} ${escapeHtml(localized(item.name))}">${icon('plus', 18)}</button></article>`;
        }).join('')}
      </div>
    </section>`;
}

function renderCart() {
  const lines = cartLines();
  const totals = cartTotals();
  const slots = getSlots();
  const selectedSlot = slots.find((slot) => slot.id === state.selectedSlotId);
  const shop = activeShop();
  return `
    <aside class="cart-rail" aria-labelledby="cart-heading">
      <div class="cart-rail-header"><h2 id="cart-heading">${escapeHtml(t('cart.title'))}</h2><span class="cart-count" aria-label="${lines.length} ${escapeHtml(t('cart.items'))}">${lines.reduce((sum, line) => sum + line.quantity, 0)}</span></div>
      ${lines.length ? `<div class="cart-items">${lines.map((line) => `<div class="cart-item"><div class="cart-item-main"><strong>${escapeHtml(localized(line.name))}</strong><span>${formatMoney(line.priceMinor)} · ${line.quantity}×</span></div><div class="quantity-control"><button class="quantity-button" data-action="decrement" data-item-id="${line.id}" aria-label="${state.lang === 'th' ? 'ลดจำนวน' : 'Decrease quantity'}">${icon('minus', 13)}</button><span>${line.quantity}</span><button class="quantity-button" data-action="increment" data-item-id="${line.id}" aria-label="${state.lang === 'th' ? 'เพิ่มจำนวน' : 'Increase quantity'}">${icon('plus', 13)}</button></div></div>`).join('')}</div>` : `<div class="empty-cart">${icon('bowl', 24)}<br>${escapeHtml(t('cart.empty'))}</div>`}
      <div class="slot-picker"><h3>${escapeHtml(t('cart.pickup'))}</h3><div class="slot-list">${slots.map((slot) => { const availability = getSlotAvailability(slot, totals.capacityUnits); return `<button class="slot-option ${state.selectedSlotId === slot.id ? 'is-selected' : ''}" data-action="select-slot" data-slot-id="${slot.id}" ${availability.available ? '' : 'disabled'}><span><span class="slot-time">${slot.label}</span><span class="slot-meta">${availability.remainingOrders} ${state.lang === 'th' ? 'ที่เหลือ' : 'spots left'} · ${availability.remainingCapacityUnits.toFixed(1)} ${escapeHtml(t('wait.units'))}</span></span><span class="slot-cutoff">${escapeHtml(t('cart.cutoff'))}<br>${slot.cutoff}</span></button>`; }).join('')}</div><p class="cart-note">${escapeHtml(selectedSlot ? `${t('cart.chooseSlot')} · ${selectedSlot.label}` : t('cart.chooseSlot'))}</p></div>
      <div class="cart-summary"><div class="cart-total-line"><span>${escapeHtml(t('cart.subtotal'))}</span><strong>${formatMoney(totals.subtotalMinor)}</strong></div><div class="cart-total-line"><span>${escapeHtml(t('cart.fee'))}</span><strong>${formatMoney(totals.serviceFeeMinor)}</strong></div><div class="cart-total-line total"><span>${escapeHtml(t('cart.total'))}</span><strong>${formatMoney(totals.totalMinor)}</strong></div></div>
      <button class="button button-primary button-full" data-action="place-order" data-testid="place-order" ${lines.length && selectedSlot && !state.submitting && shop.serviceOpen !== false ? '' : 'disabled'}>${state.submitting ? escapeHtml(state.lang === 'th' ? 'กำลังยืนยัน…' : 'Confirming…') : `${icon('check', 16)}${escapeHtml(t('cart.checkout'))}`}</button>
      <button class="button button-ghost button-full" style="margin-top: var(--space-2);" data-action="walk-in" ${shop.serviceOpen === false ? 'disabled' : ''}>${icon('clock', 16)}${escapeHtml(t('cart.walkin'))}</button>
      <p class="cart-note">${escapeHtml(t('cart.note'))}</p>
    </aside>`;
}

function renderCustomerBrowse() {
  return `<div class="customer-layout"><section class="customer-main">${renderHero()}${renderShops()}${renderMenu()}</section>${renderCart()}</div>`;
}

function progressIndex(status) {
  if (status === 'COLLECTED') return 4;
  if (status === 'READY') return 3;
  if (status === 'PREPARING') return 2;
  if (status === 'CONFIRMED') return 1;
  return 0;
}

function renderOrderTracker(order) {
  const progress = progressIndex(order.status);
  const estimate = order.estimatedReadyAt ? formatTime(order.estimatedReadyAt) : '—';
  const steps = [
    ['submitted', 0],
    ['confirmed', 1],
    ['preparing', 2],
    ['ready', 3],
  ];
  const pickupAction = state.session?.role === 'STUDENT' && order.status === 'READY' ? `<div class="pickup-action"><button class="button button-primary" data-action="pickup-order" data-order-id="${escapeHtml(order.id)}" data-testid="pickup-order">${icon('check', 16)}${escapeHtml(t('orders.pickup'))}</button><span>${escapeHtml(t('orders.pickupHint'))}</span></div>` : '';
  return `<article class="order-tracker"><div class="order-tracker-top"><div><p class="section-kicker">${escapeHtml(t('orders.active'))}</p><h2>${escapeHtml(localized(shopById(order.shopId).name))}</h2><span class="order-reference">${escapeHtml(order.ref)} · ${escapeHtml(orderTypeText(order.orderType))}</span></div><div class="queue-number"><span>${escapeHtml(t('orders.queue'))}</span><strong>${escapeHtml(order.queueNumber)}</strong></div></div><div class="progress-track" aria-label="${escapeHtml(statusText(order.status))}">${steps.map(([key, index]) => `<div class="progress-step ${progress > index ? 'is-complete' : progress === index ? 'is-current' : ''}">${escapeHtml(t(`status.step.${key}`))}</div>`).join('')}</div><p class="tracker-footnote"><span><strong>${escapeHtml(statusText(order.status))}</strong> · ${escapeHtml(orderItemsLabel(order))}</span><span>${escapeHtml(t('orders.estimated'))} <strong>${estimate}</strong></span></p><p class="tracker-footnote" style="margin-top: var(--space-3);"><span>${escapeHtml(t('orders.slot'))}: ${escapeHtml(order.slotLabel || (order.orderType === 'WALK_IN' ? t('type.WALK_IN') : '—'))}</span><span>${formatMoney(order.totalMinor)}</span></p>${pickupAction}</article>`;
}

function renderOrderHistory(order) {
  return `<article class="history-row"><div><h3>${escapeHtml(order.ref)} · ${escapeHtml(localized(shopById(order.shopId).name))}</h3><p>${escapeHtml(orderItemsLabel(order))} · ${formatMoney(order.totalMinor)}</p></div><span class="status-badge ${statusClass(order.status)}">${escapeHtml(statusText(order.status))}</span></article>`;
}

function renderCustomerOrders() {
  const activeOrders = state.orders.filter((order) => !['COLLECTED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(order.status));
  const history = state.orders.filter((order) => ['COLLECTED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(order.status));
  return `<section class="orders-section" aria-labelledby="orders-heading"><div class="section-heading"><div><p class="section-kicker">${escapeHtml(t('orders.kicker'))}</p><h2 id="orders-heading">${escapeHtml(t('orders.title'))}</h2></div><button class="button button-ghost" data-view="customer" data-customer-section="browse">${icon('compass', 16)}${escapeHtml(t('orders.back'))}</button></div>${activeOrders.length ? `<div class="orders-list">${activeOrders.map(renderOrderTracker).join('')}</div>` : `<div class="muted-empty">${icon('receipt', 28)}<br>${escapeHtml(t('orders.empty'))}<br><br><button class="button button-primary" data-view="customer" data-customer-section="browse">${escapeHtml(t('hero.browse'))}</button></div>`}${history.length ? `<div class="orders-section"><div class="section-heading"><div><p class="section-kicker">${escapeHtml(t('orders.history'))}</p><h3>${escapeHtml(t('orders.history'))}</h3></div></div><div class="orders-list">${history.map(renderOrderHistory).join('')}</div></div>` : ''}</section>`;
}

function renderCustomer() {
  return `<div class="workspace">${renderWorkspaceHeader()}${state.customerSection === 'orders' ? renderCustomerOrders() : renderCustomerBrowse()}</div>`;
}

function merchantOrders() {
  return state.orders.filter((order) => order.shopId === state.activeShopId && !['COLLECTED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(order.status)).filter((order) => state.queueFilter === 'all' || (state.queueFilter === 'preorder' && order.orderType === 'PREORDER') || (state.queueFilter === 'walkin' && order.orderType === 'WALK_IN'));
}

function renderMetricStrip() {
  const orders = state.orders.filter((order) => order.shopId === state.activeShopId);
  const active = orders.filter((order) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status));
  const ready = orders.filter((order) => order.status === 'READY');
  const wait = waitForShop(state.activeShopId);
  const capacity = Math.min(100, Math.round(active.reduce((sum, order) => sum + Number(order.capacityUnits || 0), 0) / 15 * 100));
  return `<div class="metric-strip"><div class="metric"><span class="metric-label">${escapeHtml(t('metric.active'))}</span><span class="metric-value">${active.length}</span><span class="metric-context">${escapeHtml(t('metric.orders'))}</span></div><div class="metric"><span class="metric-label">${escapeHtml(t('metric.wait'))}</span><span class="metric-value">${wait.lowerBoundMinutes}–${wait.upperBoundMinutes}</span><span class="metric-context">${escapeHtml(t('wait.minutes'))} · ${escapeHtml(t('wait.customerRange'))}</span></div><div class="metric"><span class="metric-label">${escapeHtml(t('metric.capacity'))}</span><span class="metric-value">${capacity}%</span><span class="metric-context">${escapeHtml(t('metric.utilized'))}</span></div><div class="metric"><span class="metric-label">${escapeHtml(t('metric.completed'))}</span><span class="metric-value">${orders.filter((order) => order.status === 'COLLECTED').length}</span><span class="metric-context">${ready.length} ${escapeHtml(t('queue.ready').toLowerCase())}</span></div></div>`;
}

function renderQueueCard(order) {
  const next = getNextOrderStatus(order.status);
  const nextLabel = next === 'PREPARING' ? t('queue.preparing') : next === 'READY' ? t('queue.ready') : next === 'COLLECTED' ? t('status.COLLECTED') : t('queue.next');
  return `<article class="queue-card"><div class="queue-card-header"><div><strong>${escapeHtml(order.queueNumber)}</strong><span>${escapeHtml(order.ref)} · ${escapeHtml(orderTypeText(order.orderType))}</span></div><span class="${order.orderType === 'WALK_IN' ? 'order-type-badge' : 'status-badge is-info'}">${escapeHtml(orderTypeText(order.orderType))}</span></div><ul class="queue-card-items">${order.items.map((line) => `<li><span>${line.quantity}× ${escapeHtml(localized(itemById(order.shopId, line.itemId)?.name) || line.itemId)}</span><span>${Number(line.capacityUnits || 0).toFixed(1)}u</span></li>`).join('')}</ul><div class="queue-card-footer"><div><small>${escapeHtml(t('queue.readyAt'))}</small><strong>${order.estimatedReadyAt ? formatTime(order.estimatedReadyAt) : '—'}</strong></div>${next ? `<button class="button button-primary" data-action="advance-order" data-order-id="${order.id}">${escapeHtml(nextLabel)} ${icon('arrow', 14)}</button>` : `<span class="status-badge ${statusClass(order.status)}">${escapeHtml(statusText(order.status))}</span>`}</div></article>`;
}

function renderQueueBoard() {
  const orders = merchantOrders();
  const columns = [
    { key: 'new', title: t('queue.new'), statuses: ['PENDING', 'CONFIRMED'] },
    { key: 'preparing', title: t('queue.preparing'), statuses: ['PREPARING'] },
    { key: 'ready', title: t('queue.ready'), statuses: ['READY'] },
  ];
  return `<div class="queue-board">${columns.map((column) => { const columnOrders = orders.filter((order) => column.statuses.includes(order.status)); return `<section class="queue-column" aria-labelledby="column-${column.key}"><div class="queue-column-header"><h3 id="column-${column.key}">${escapeHtml(column.title)}</h3><span class="column-count">${columnOrders.length}</span></div><div class="queue-column-list">${columnOrders.length ? columnOrders.map(renderQueueCard).join('') : `<p class="muted-empty">${escapeHtml(t('queue.empty'))}</p>`}</div></section>`; }).join('')}</div>`;
}

function renderWaitSidePanel() {
  const wait = waitForShop(state.activeShopId);
  const orders = state.orders.filter((order) => order.shopId === state.activeShopId && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status));
  const capacity = Math.min(100, Math.round(orders.reduce((sum, order) => sum + Number(order.capacityUnits || 0), 0) / 15 * 100));
  return `<aside class="queue-side"><section class="side-panel"><h3>${escapeHtml(t('wait.title'))}</h3><div class="wait-display"><strong>${formatWait(wait)}</strong><span>${escapeHtml(t('wait.customerRange'))}</span></div><div class="capacity-meter"><div class="metric-line"><span>${escapeHtml(t('wait.current'))}</span><strong>${orders.length}</strong></div><div class="meter-bar"><span class="meter-fill" style="width: ${capacity}%"></span></div></div></section><section class="side-panel"><h3>${escapeHtml(t('misc.thanks'))}</h3><p class="section-intro">${escapeHtml(t('wait.saveHint'))}</p><button class="button button-ghost button-full" data-action="refresh">${icon('refresh', 16)}${escapeHtml(state.lang === 'th' ? 'คำนวณใหม่' : 'Recalculate')}</button></section></aside>`;
}

function renderWaitPage() {
  const wait = waitForShop(state.activeShopId);
  const activeOrders = state.orders.filter((order) => order.shopId === state.activeShopId && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status));
  const visibleOrders = state.orders.filter((order) => order.shopId === state.activeShopId && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)).sort((a, b) => new Date(a.estimatedReadyAt || 0) - new Date(b.estimatedReadyAt || 0));
  const nextReadyOrder = visibleOrders[0];
  const activeUnits = activeOrders.reduce((sum, order) => sum + Number(order.capacityUnits || 0), 0);
  const capacity = Math.min(100, Math.round(activeUnits / 15 * 100));
  const serviceStatus = state.paused ? t('merchant.paused') : t('merchant.open');
  return `<section class="wait-page" aria-labelledby="wait-page-title"><div class="wait-page-header"><div><p class="section-kicker">${escapeHtml(t('wait.pageKicker'))}</p><h2 id="wait-page-title">${escapeHtml(t('wait.pageTitle'))}</h2><p class="section-intro">${escapeHtml(t('wait.pageSubtitle'))}</p></div><div class="wait-page-actions"><button class="button button-quiet config-button" data-merchant-tab="settings" aria-label="${escapeHtml(t('wait.configButton'))}">${icon('settings', 14)}<span>${escapeHtml(t('wait.configButton'))}</span></button><button class="button button-ghost" data-merchant-tab="queue">${icon('receipt', 15)}${escapeHtml(t('wait.backQueue'))}</button></div></div><div class="wait-dashboard-grid"><section class="wait-hero-card"><div class="wait-hero-top"><div><span class="wait-overline">${escapeHtml(t('wait.rangeLabel'))}</span><h3>${escapeHtml(localized(shopById('bai-tong').name))}</h3></div><span class="live-indicator"><span></span>${escapeHtml(t('misc.updated'))}</span></div><div class="wait-range-label">${icon('clock', 15)}${escapeHtml(t('wait.customerRange'))}</div><div class="wait-range-value"><strong>${wait.lowerBoundMinutes}</strong><span>–</span><strong>${wait.upperBoundMinutes}</strong><small>${escapeHtml(t('wait.minutes'))}</small></div><div class="wait-range-rail" aria-hidden="true"><span class="wait-range-fill" style="width: ${Math.min(92, Math.max(26, wait.upperBoundMinutes / 60 * 100))}%"></span><span class="wait-range-marker" style="left: ${Math.min(92, Math.max(26, wait.upperBoundMinutes / 60 * 100))}%"></span></div><div class="wait-hero-footer"><span>${escapeHtml(t('wait.explainer'))}</span><strong>${escapeHtml(t('wait.mediumConfidence'))}</strong></div></section><aside class="wait-context-panel"><div class="wait-context-card"><span class="wait-context-label">${escapeHtml(t('wait.nextReady'))}</span><strong>${nextReadyOrder?.estimatedReadyAt ? formatTime(nextReadyOrder.estimatedReadyAt) : '—'}</strong><span>${nextReadyOrder ? `${escapeHtml(nextReadyOrder.ref)} · ${escapeHtml(nextReadyOrder.queueNumber)}` : escapeHtml(t('queue.empty'))}</span></div><div class="wait-context-card"><span class="wait-context-label">${escapeHtml(t('wait.activeWork'))}</span><strong>${activeUnits.toFixed(1)} <small>${escapeHtml(t('wait.units'))}</small></strong><div class="wait-context-meter"><span style="width: ${capacity}%"></span></div><span>${activeOrders.length} ${escapeHtml(t('metric.orders'))}</span></div><div class="wait-context-card wait-context-card--quiet"><span class="wait-context-label">${escapeHtml(t('wait.unitsPerMinute'))}</span><strong>${Number(state.waitSettings.baseCapacityPerMinute).toFixed(1)}</strong><span>${escapeHtml(t('wait.calculation'))}</span></div></aside></div><div class="wait-lower-grid"><section class="wait-signals"><div class="wait-section-heading"><div><p class="section-kicker">${escapeHtml(t('wait.liveSignals'))}</p><h3>${escapeHtml(t('wait.liveSignals'))}</h3></div><span class="status-badge ${state.paused ? 'is-warning' : 'is-positive'}"><span class="status-dot ${state.paused ? 'is-warning' : ''}"></span>${escapeHtml(serviceStatus)}</span></div><div class="wait-signal-table">${visibleOrders.length ? visibleOrders.slice(0, 5).map((order) => `<div class="wait-signal-row"><div><strong>${escapeHtml(order.queueNumber)}</strong><span>${escapeHtml(order.ref)} · ${escapeHtml(orderTypeText(order.orderType))}</span></div><span class="status-badge ${statusClass(order.status)}">${escapeHtml(statusText(order.status))}</span><span class="wait-signal-time">${order.estimatedReadyAt ? formatTime(order.estimatedReadyAt) : '—'}</span><span class="wait-signal-load">${Number(order.capacityUnits || 0).toFixed(1)}u</span></div>`).join('') : `<p class="muted-empty">${escapeHtml(t('queue.empty'))}</p>`}</div></section><section class="wait-method-card"><div class="wait-section-heading"><div><p class="section-kicker">${escapeHtml(t('wait.confidence'))}</p><h3>${escapeHtml(t('wait.calculation'))}</h3></div><span class="wait-method-icon">${icon('spark', 18)}</span></div><div class="wait-method-list"><div class="wait-method-row"><span>${escapeHtml(t('wait.activeWork'))}</span><strong>${activeUnits.toFixed(1)} ${escapeHtml(t('wait.units'))}</strong></div><div class="wait-method-row"><span>${escapeHtml(t('wait.unitsPerMinute'))}</span><strong>${Number(state.waitSettings.baseCapacityPerMinute).toFixed(1)}</strong></div><div class="wait-method-row"><span>${escapeHtml(t('wait.buffer'))}</span><strong>${state.waitSettings.bufferMinutes} ${escapeHtml(t('wait.minutes'))}</strong></div></div><p class="wait-method-note">${escapeHtml(t('wait.mediumConfidence'))}</p></section></div></section>`;
}

function renderQueueTab() {
  return `<div class="queue-layout"><section><div class="queue-heading"><h2>${escapeHtml(t('merchant.queue'))}</h2><div class="queue-filter"><label class="sr-only" for="queue-filter">${escapeHtml(t('queue.filter'))}</label><select id="queue-filter" data-queue-filter><option value="all" ${state.queueFilter === 'all' ? 'selected' : ''}>${escapeHtml(t('queue.all'))}</option><option value="preorder" ${state.queueFilter === 'preorder' ? 'selected' : ''}>${escapeHtml(t('queue.preorder'))}</option><option value="walkin" ${state.queueFilter === 'walkin' ? 'selected' : ''}>${escapeHtml(t('queue.walkin'))}</option></select></div></div>${renderQueueBoard()}</section>${renderWaitSidePanel()}</div>`;
}

function renderMenuManagement() {
  const shop = activeShop();
  return `<section class="menu-management"><div class="section-heading"><div><p class="section-kicker">${escapeHtml(t('merchant.menu'))}</p><h2>${escapeHtml(t('menu.manageTitle'))}</h2></div><p class="section-intro">${escapeHtml(t('menu.manageHint'))}</p></div><div class="management-list">${shop.menu.map((item) => { const available = currentAvailability(item); return `<div class="management-row"><span class="menu-thumbnail" style="background-image: url('${item.image}')"><span>${item.emoji}</span></span><div><h4>${escapeHtml(localized(item.name))}</h4><p>${formatMoney(item.priceMinor)} · ${item.capacityUnits} ${escapeHtml(t('wait.units'))}</p></div><button class="switch ${available ? 'is-on' : ''}" data-action="toggle-availability" data-item-id="${item.id}" aria-label="${escapeHtml(localized(item.name))} · ${available ? (state.lang === 'th' ? 'พร้อมขาย' : 'Available') : t('menu.soldOut')}"><span class="sr-only">${available ? t('shop.open') : t('menu.soldOut')}</span></button></div>`; }).join('')}</div></section>`;
}

function renderSettings() {
  const settings = state.waitSettings;
  const slots = getSlots(state.activeShopId);
  return `<div class="queue-layout"><section class="settings-grid"><section class="settings-panel"><div class="section-heading"><div><p class="section-kicker">${escapeHtml(t('merchant.settings'))}</p><h2>${escapeHtml(t('wait.title'))}</h2></div><p class="section-intro">${escapeHtml(t('wait.saveHint'))}</p></div><div class="settings-grid"><div class="settings-line"><label for="capacity-range">${escapeHtml(t('wait.capacity'))}<span>${escapeHtml(t('wait.units'))} ${state.lang === 'th' ? 'ต่อหนึ่งนาที' : 'per minute'}</span></label><input id="capacity-range" class="settings-range" type="range" min="0.5" max="4" step="0.1" value="${settings.baseCapacityPerMinute}" data-setting="baseCapacityPerMinute" aria-label="${escapeHtml(t('wait.capacity'))}"><output class="settings-number">${Number(settings.baseCapacityPerMinute).toFixed(1)}</output></div><div class="settings-line"><label for="buffer-range">${escapeHtml(t('wait.buffer'))}<span>${escapeHtml(t('wait.minutes'))}</span></label><input id="buffer-range" class="settings-range" type="range" min="0" max="15" step="1" value="${settings.bufferMinutes}" data-setting="bufferMinutes" aria-label="${escapeHtml(t('wait.buffer'))}"><output class="settings-number">${settings.bufferMinutes}</output></div><div class="settings-line"><label for="delay-range">${escapeHtml(t('wait.manualDelay'))}<span>${escapeHtml(t('wait.minutes'))}</span></label><input id="delay-range" class="settings-range" type="range" min="0" max="30" step="5" value="${settings.manualDelayMinutes}" data-setting="manualDelayMinutes" aria-label="${escapeHtml(t('wait.manualDelay'))}"><output class="settings-number">${settings.manualDelayMinutes}</output></div></div></section><section class="settings-panel"><div class="section-heading"><div><p class="section-kicker">${escapeHtml(t('settings.slots'))}</p><h2>${escapeHtml(t('settings.slotCapacity'))}</h2></div><p class="section-intro">${escapeHtml(t('settings.slotHint'))}</p></div><div class="management-list">${slots.map((slot) => { const availability = getSlotAvailability(slot, 0); return `<div class="settings-line" style="padding: var(--space-3) 0; border-bottom: var(--border-thin) solid var(--color-border-subtle);"><label>${slot.label}<span>${availability.remainingOrders} ${state.lang === 'th' ? 'ออเดอร์เหลือ' : 'orders left'} · ${availability.remainingCapacityUnits.toFixed(1)}u</span></label><strong>${slot.maxOrders} / ${slot.maxCapacityUnits}u</strong></div>`; }).join('')}</div></section></section>${renderWaitSidePanel()}</div>`;
}

function renderMerchant() {
  const isPaused = state.paused;
  return `<div class="workspace merchant-view"><div class="merchant-header"><div><p class="eyebrow">${escapeHtml(t('merchant.kicker'))}</p><h1>${escapeHtml(t('merchant.title'))}</h1><p class="lede">${escapeHtml(t('merchant.subtitle'))}</p></div><div class="merchant-actions"><button class="service-toggle ${isPaused ? 'is-paused' : ''}" data-action="toggle-pause"><span class="toggle-dot"></span>${escapeHtml(isPaused ? t('merchant.paused') : t('merchant.open'))}</button><button class="button button-primary" data-action="open-walkin">${icon('plus', 16)}${escapeHtml(t('merchant.walkin'))}</button></div></div>${renderMetricStrip()}<div class="merchant-tabs" role="tablist"><button class="merchant-tab ${state.merchantTab === 'queue' ? 'is-active' : ''}" data-merchant-tab="queue" role="tab" aria-selected="${state.merchantTab === 'queue'}">${icon('receipt', 15)} ${escapeHtml(t('merchant.queue'))}</button><button class="merchant-tab ${state.merchantTab === 'wait' ? 'is-active' : ''}" data-merchant-tab="wait" role="tab" aria-selected="${state.merchantTab === 'wait'}">${icon('clock', 15)} ${escapeHtml(t('merchant.wait'))}</button><button class="merchant-tab ${state.merchantTab === 'menu' ? 'is-active' : ''}" data-merchant-tab="menu" role="tab" aria-selected="${state.merchantTab === 'menu'}">${icon('bowl', 15)} ${escapeHtml(t('merchant.menu'))}</button><button class="merchant-tab ${state.merchantTab === 'settings' ? 'is-active' : ''}" data-merchant-tab="settings" role="tab" aria-selected="${state.merchantTab === 'settings'}">${icon('settings', 15)} ${escapeHtml(t('merchant.settings'))}</button></div>${state.merchantTab === 'queue' ? renderQueueTab() : state.merchantTab === 'wait' ? renderWaitPage() : state.merchantTab === 'menu' ? renderMenuManagement() : renderSettings()}</div>`;
}

function renderModal() {
  if (!state.modal) return '';
  if (state.modal === 'walkin' || state.modal.kind === 'walkin') {
    const shop = activeShop();
    const options = shop.menu.filter((item) => currentAvailability(item));
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-modal-content><div class="modal-header"><div><h2 id="modal-title">${escapeHtml(t('modal.walkinTitle'))}</h2><p>${escapeHtml(t('modal.walkinBody'))}</p></div><button class="icon-button" data-action="close-modal" aria-label="${escapeHtml(t('modal.cancel'))}">${icon('close', 18)}</button></div><div class="modal-body"><label class="modal-select">${escapeHtml(t('modal.item'))}<select data-walkin-item>${options.map((item) => `<option value="${item.id}" ${state.walkInItemId === item.id ? 'selected' : ''}>${escapeHtml(localized(item.name))} · ${formatMoney(item.priceMinor)}</option>`).join('')}</select></label><div class="modal-summary"><p><span>${escapeHtml(t('orders.queue'))}</span><strong>A${String(state.orderSequence + 1).padStart(2, '0')}</strong></p><p><span>${escapeHtml(t('orders.estimated'))}</span><strong>${escapeHtml(formatWait(waitForShop('bai-tong')))}</strong></p><p><span>${escapeHtml(t('cart.note'))}</span><strong>${escapeHtml(t('type.WALK_IN'))}</strong></p></div><div class="modal-actions"><button class="button button-ghost" data-action="close-modal">${escapeHtml(t('modal.cancel'))}</button><button class="button button-primary" data-action="confirm-walkin">${icon('check', 16)}${escapeHtml(t('modal.confirmWalkin'))}</button></div></div></section></div>`;
  }
  if (state.modal.kind === 'modifier') {
    const item = itemById(state.activeShopId, state.modal.itemId);
    if (!item) return '';
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modifier-modal-title" data-modal-content><div class="modal-header"><div><p class="section-kicker">${escapeHtml(t('menu.customize'))}</p><h2 id="modifier-modal-title">${escapeHtml(localized(item.name))}</h2><p>${escapeHtml(localized(item.description))}</p></div><button class="icon-button" data-action="close-modal" aria-label="${escapeHtml(t('modal.cancel'))}">${icon('close', 18)}</button></div><div class="modal-body modifier-form">${(item.modifiers || []).map((modifier) => `<label class="modal-select" for="modifier-${escapeHtml(modifier.id)}">${escapeHtml(localized(modifier.name))}${modifier.required ? ` <span class="required-label">· ${escapeHtml(t('menu.required'))}</span>` : ''}<select id="modifier-${escapeHtml(modifier.id)}" data-modifier-id="${escapeHtml(modifier.id)}" ${modifier.required ? 'required' : ''}><option value="">${escapeHtml(state.lang === 'th' ? 'เลือก…' : 'Choose…')}</option>${modifier.options.map((choice) => `<option value="${escapeHtml(choice.id)}">${escapeHtml(localized(choice.name))}${choice.priceMinor ? ` · ${formatMoney(choice.priceMinor)}` : ''}</option>`).join('')}</select></label>`).join('')}${state.modal.error ? `<p class="form-error" role="alert">${escapeHtml(state.modal.error)}</p>` : ''}<div class="modal-actions"><button class="button button-ghost" data-action="close-modal">${escapeHtml(t('modal.cancel'))}</button><button class="button button-primary" data-action="confirm-modifier">${icon('plus', 16)}${escapeHtml(t('menu.add'))}</button></div></div></section></div>`;
  }
  return '';
}

function renderNotification() {
  return state.notice ? `<div class="notification" role="status">${icon('check', 18)}<span>${escapeHtml(state.notice)}</span></div>` : '';
}

function render() {
  document.documentElement.lang = state.lang === 'th' ? 'th' : 'en';
  document.body.classList.toggle('lang-th', state.lang === 'th');
  if (state.isLoading) {
    app.innerHTML = '<main class="loading-shell"><div class="loading-mark">🍱</div><p>JongFood · กำลังโหลด / Loading…</p></main>';
    return;
  }
  if (!state.session) {
    app.innerHTML = renderAuth();
    return;
  }
  app.innerHTML = `${renderTopbar()}<main id="main-content">${state.view === 'customer' ? renderCustomer() : renderMerchant()}</main>${renderModal()}${renderNotification()}`;
}

function updateCart(itemId, delta) {
  const item = itemById(state.activeShopId, itemId);
  if (!item || !currentAvailability(item)) return;
  const requiredModifiers = (item.modifiers || []).filter((modifier) => modifier.required);
  if (delta > 0 && requiredModifiers.length) {
    state.modal = { kind: 'modifier', itemId, orderType: 'PREORDER', selections: {} };
    render();
    return;
  }
  const existing = state.cart.find((line) => line.itemId === itemId && !(line.modifiers || []).length);
  if (existing) {
    existing.quantity += delta;
    if (existing.quantity <= 0) state.cart = state.cart.filter((line) => line.itemId !== itemId);
  } else if (delta > 0) {
    state.cart.push({ shopId: state.activeShopId, itemId, quantity: 1 });
  }
  persist();
  render();
}

async function placeOrder() {
  if (state.submitting) return;
  const lines = cartLines();
  const totals = cartTotals();
  const slot = getSlots().find((candidate) => candidate.id === state.selectedSlotId);
  if (!lines.length || !slot) return;
  const availability = getSlotAvailability(slot, totals.capacityUnits);
  if (!availability.available) {
    notify(t('notice.slotFull'));
    return;
  }
  state.submitting = true;
  render();
  try {
    const payload = await api('/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ vendorId: state.activeShopId, pickupSlotId: slot.id, orderType: 'PREORDER', paymentMethod: 'PAY_AT_PICKUP', items: lines.map((line) => ({ menuItemId: line.id, quantity: line.quantity, modifiers: line.modifiers || [] })) }),
    });
    state.cart = [];
    state.customerSection = 'orders';
    state.submitting = false;
    await refreshFromServer({ renderAfter: false });
    render();
    notify(`${t('notice.orderPlaced')} · ${payload.order.ref}`);
  } catch (error) {
    state.submitting = false;
    render();
    notify(friendlyError(error));
  }
}

async function createWalkIn(itemId = state.walkInItemId, shopId = state.activeShopId, modifiers = []) {
  const item = itemById(shopId, itemId);
  if (!item || !currentAvailability(item)) return;
  if (!modifiers.length && (item.modifiers || []).some((modifier) => modifier.required)) {
    state.modal = { kind: 'modifier', itemId, orderType: 'WALK_IN', shopId, selections: {} };
    render();
    return;
  }
  state.submitting = true;
  render();
  try {
    const payload = await api('/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ vendorId: shopId, orderType: 'WALK_IN', paymentMethod: 'PAY_AT_PICKUP', items: [{ menuItemId: item.id, quantity: 1, modifiers }] }),
    });
    state.modal = null;
    state.submitting = false;
    state.view = 'customer';
    state.customerSection = 'orders';
    await refreshFromServer({ renderAfter: false });
    render();
    notify(`${t('notice.walkin')} · ${payload.order.ref}`);
  } catch (error) {
    state.submitting = false;
    render();
    notify(friendlyError(error));
  }
}

async function advanceOrder(orderId) {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!order) return;
  const next = getNextOrderStatus(order.status);
  if (!next || !canTransitionOrderStatus(order.status, next)) return;
  if (state.mutationOrderId) return;
  state.mutationOrderId = orderId;
  render();
  try {
    await api(`/api/orders/${encodeURIComponent(orderId)}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    await refreshFromServer({ renderAfter: false });
    state.mutationOrderId = null;
    render();
    notify(t('notice.status'));
  } catch (error) {
    state.mutationOrderId = null;
    render();
    notify(friendlyError(error));
  }
}

async function toggleAvailability(itemId) {
  const item = itemById(state.activeShopId, itemId);
  if (!item) return;
  try {
    await api(`/api/menu-items/${encodeURIComponent(itemId)}/availability`, { method: 'PATCH', body: JSON.stringify({ available: !currentAvailability(item) }) });
    await refreshFromServer({ renderAfter: false });
    render();
    notify(t('notice.soldOut'));
  } catch (error) {
    notify(friendlyError(error));
  }
}

async function pickupOrder(orderId) {
  if (state.mutationOrderId) return;
  state.mutationOrderId = orderId;
  render();
  try {
    await api(`/api/orders/${encodeURIComponent(orderId)}/pickup`, { method: 'POST' });
    await refreshFromServer({ renderAfter: false });
    state.mutationOrderId = null;
    render();
    notify(t('notice.status'));
  } catch (error) {
    state.mutationOrderId = null;
    render();
    notify(friendlyError(error));
  }
}

function selectedModifierValues() {
  return [...document.querySelectorAll('[data-modifier-id]')].map((select) => ({ modifierId: select.dataset.modifierId, optionId: select.value })).filter((selection) => selection.optionId);
}

function confirmModifier() {
  if (state.modal?.kind !== 'modifier') return;
  const item = itemById(state.activeShopId, state.modal.itemId);
  if (!item) return;
  const selections = selectedModifierValues();
  const missing = (item.modifiers || []).some((modifier) => modifier.required && !selections.some((selection) => selection.modifierId === modifier.id));
  if (missing) {
    state.modal.error = t('notice.modifierRequired');
    render();
    return;
  }
  const orderType = state.modal.orderType;
  const shopId = state.modal.shopId || state.activeShopId;
  state.modal = null;
  if (orderType === 'WALK_IN') return createWalkIn(item.id, shopId, selections);
  const existing = state.cart.find((line) => line.itemId === item.id && JSON.stringify(line.modifiers || []) === JSON.stringify(selections));
  if (existing) existing.quantity += 1;
  else state.cart.push({ shopId, itemId: item.id, quantity: 1, modifiers: selections });
  render();
  notify(t('notice.added'));
}

async function signIn(form) {
  const formData = new FormData(form);
  state.submitting = true;
  state.authError = '';
  render();
  try {
    const payload = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') }) });
    state.session = payload.user;
    state.view = payload.user.role === 'STUDENT' ? 'customer' : 'merchant';
    state.customerSection = 'browse';
    state.merchantTab = 'queue';
    await refreshFromServer({ renderAfter: false });
    state.submitting = false;
    render();
  } catch (error) {
    state.submitting = false;
    state.authError = error.code === 'INVALID_CREDENTIALS' ? t('auth.invalid') : friendlyError(error);
    render();
  }
}

async function signOut() {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  state = { ...structuredClone(baseState), isLoading: false };
  shops = fallbackShops;
  render();
}

async function togglePause() {
  const vendor = activeShop();
  if (!vendor) return;
  try {
    await api(`/api/vendors/${encodeURIComponent(vendor.id)}/pause`, { method: 'POST', body: JSON.stringify({ paused: vendor.serviceOpen !== false }) });
    await refreshFromServer({ renderAfter: false });
    render();
    notify(state.paused ? t('notice.paused') : t('notice.resumed'));
  } catch (error) {
    notify(friendlyError(error));
  }
}

function setLanguage(lang) {
  if (!['th', 'en'].includes(lang)) return;
  state.lang = lang;
  persist();
  render();
  notify(t('notice.language'));
}

function handleClick(event) {
  const target = event.target.closest('button, a, [data-shop-id], [data-category]');
  if (!target) return;
  if (target.tagName === 'A') event.preventDefault();
  const lang = target.dataset.lang;
  if (lang) return setLanguage(lang);
  const view = target.dataset.view;
  if (view) {
    if (view === 'merchant' && !['VENDOR_STAFF', 'MANAGER', 'ORG_ADMIN'].includes(state.session?.role)) return notify(t('notice.forbidden'));
    state.view = view;
    if (view === 'merchant' && !target.dataset.merchantTab) state.merchantTab = 'wait';
    if (view === 'customer' && target.dataset.customerSection) state.customerSection = target.dataset.customerSection;
    persist();
    render();
    return;
  }
  const action = target.dataset.action;
  const shopId = target.dataset.shopId;
  if (shopId && !action) {
    if (state.cart.length && shopId !== state.activeShopId) return notify(t('notice.shopCart'));
    state.activeShopId = shopId;
    state.activeCategory = 'all';
    state.selectedSlotId = getSlots(shopId).find((slot) => !getSlotAvailability(slot, 0).full)?.id || getSlots(shopId)[0]?.id || null;
    persist();
    render();
    return;
  }
  const category = target.dataset.category;
  if (category && !action) {
    state.activeCategory = category;
    persist();
    render();
    return;
  }
  const merchantTab = target.dataset.merchantTab;
  if (merchantTab && !action) {
    state.merchantTab = merchantTab;
    persist();
    render();
    return;
  }
  if (!action) return;
  if (action === 'home') {
    state.view = 'customer';
    state.customerSection = 'browse';
    persist();
    render();
  } else if (action === 'scroll-menu') {
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (action === 'add-item') {
    updateCart(target.dataset.itemId, 1);
    if (!(itemById(state.activeShopId, target.dataset.itemId)?.modifiers || []).some((modifier) => modifier.required)) notify(t('notice.added'));
  } else if (action === 'increment') {
    updateCart(target.dataset.itemId, 1);
  } else if (action === 'decrement') {
    updateCart(target.dataset.itemId, -1);
  } else if (action === 'select-slot') {
    state.selectedSlotId = target.dataset.slotId;
    persist();
    render();
    notify(t('notice.slot'));
  } else if (action === 'place-order') {
    void placeOrder();
  } else if (action === 'walk-in') {
    if (state.paused && state.activeShopId === 'bai-tong') return notify(t('notice.paused'));
    state.view = 'customer';
    state.customerSection = 'orders';
    const shop = activeShop();
    const firstAvailable = shop.menu.find((item) => currentAvailability(item));
    if (firstAvailable) void createWalkIn(firstAvailable.id, shop.id);
  } else if (action === 'open-walkin') {
    state.view = 'merchant';
    state.modal = 'walkin';
    persist();
    render();
  } else if (action === 'confirm-walkin') {
    void createWalkIn(state.walkInItemId, state.managedVendorIds?.[0] || 'bai-tong');
  } else if (action === 'confirm-modifier') {
    confirmModifier();
  } else if (action === 'close-modal') {
    if (target.dataset.action === 'close-modal' && target.dataset.modalContent) return;
    state.modal = null;
    persist();
    render();
  } else if (action === 'advance-order') {
    void advanceOrder(target.dataset.orderId);
  } else if (action === 'pickup-order') {
    void pickupOrder(target.dataset.orderId);
  } else if (action === 'toggle-availability') {
    toggleAvailability(target.dataset.itemId);
  } else if (action === 'toggle-pause') {
    void togglePause();
  } else if (action === 'refresh') {
    void refreshFromServer().catch((error) => notify(friendlyError(error)));
  } else if (action === 'logout') {
    void signOut();
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.matches('[data-queue-filter]')) {
    state.queueFilter = target.value;
    persist();
    render();
  } else if (target.matches('[data-walkin-item]')) {
    state.walkInItemId = target.value;
    persist();
  } else if (target.matches('[data-setting]')) {
    state.waitSettings[target.dataset.setting] = Number(target.value);
    persist();
    render();
  }
}

function handleSubmit(event) {
  if (!event.target.matches('[data-auth-form]')) return;
  event.preventDefault();
  void signIn(event.target);
}

async function init() {
  try {
    const session = await api('/api/session');
    if (session.authenticated) {
      state.session = session.user;
      await refreshFromServer({ renderAfter: false });
    } else {
      state.isLoading = false;
    }
  } catch (error) {
    state.isLoading = false;
    state.authError = friendlyError(error);
  }
  render();
}

app.addEventListener('click', handleClick);
app.addEventListener('change', handleChange);
app.addEventListener('submit', handleSubmit);
render();
void init();
