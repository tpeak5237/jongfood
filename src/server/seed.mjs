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

export const DEMO_ORGANIZATION = {
  id: 'org-jongfood-demo',
  slug: 'jongfood-demo',
  name: 'JongFood Demo Organization',
};

export const DEMO_CAMPUS = {
  id: 'campus-central-court',
  organizationId: DEMO_ORGANIZATION.id,
  name: { th: 'โรงอาหารกลาง', en: 'Central Court' },
  city: 'Chiang Mai',
  timeZone: 'Asia/Bangkok',
  currency: 'THB',
};

export const DEMO_USERS = [
  {
    id: 'user-student-1',
    organizationId: DEMO_ORGANIZATION.id,
    email: 'student@demo.jongfood.local',
    password: 'demo-student',
    displayName: { th: 'นักเรียนสาธิต', en: 'Demo Student' },
    role: 'STUDENT',
  },
  {
    id: 'user-bai-staff',
    organizationId: DEMO_ORGANIZATION.id,
    email: 'staff@bai-tong.demo.jongfood.local',
    password: 'demo-staff',
    displayName: { th: 'ทีมครัวใบตอง', en: 'Bai Tong staff' },
    role: 'VENDOR_STAFF',
    vendorIds: ['bai-tong'],
  },
  {
    id: 'user-khlong-staff',
    organizationId: DEMO_ORGANIZATION.id,
    email: 'staff@khlong.demo.jongfood.local',
    password: 'demo-staff',
    displayName: { th: 'ทีมเส้นสดริมคลอง', en: 'Khlong staff' },
    role: 'VENDOR_STAFF',
    vendorIds: ['khlong-noodles'],
  },
];

const modifier = (id, name, options, required = false) => ({ id, name, options, required });
const option = (id, name, priceMinor = 0, capacityUnits = 0) => ({ id, name, priceMinor, capacityUnits });

const vendors = [
  {
    id: 'bai-tong',
    slug: 'bai-tong',
    organizationId: DEMO_ORGANIZATION.id,
    campusId: DEMO_CAMPUS.id,
    name: { th: 'ครัวใบตอง', en: 'Bai Tong Kitchen' },
    description: { th: 'ข้าวราดแกง · กับข้าวทำใหม่', en: 'Thai rice bowls · cooked fresh' },
    emoji: '🍱',
    image: imageUrls.baiTong,
    serviceOpen: true,
    settings: { baseCapacityPerMinute: 1.7, bufferMinutes: 3, manualDelayMinutes: 0, minimumWaitMinutes: 5, maximumWaitMinutes: 60, roundingMinutes: 5 },
    menu: [
      {
        id: 'bai-1', category: 'จานเดียว / Bowls', name: { th: 'กะเพราไก่ไข่ดาว', en: 'Basil chicken with egg' }, description: { th: 'เผ็ดกำลังดี ข้าวหอมมะลิร้อนๆ', en: 'Fragrant jasmine rice, medium heat' }, priceMinor: 5500, capacityUnits: 1.2, emoji: '🍳', image: imageUrls.rice, available: true,
        modifiers: [modifier('bai-1-spice', { th: 'ระดับความเผ็ด', en: 'Spice level' }, [option('mild', { th: 'ไม่เผ็ด', en: 'Mild' }), option('medium', { th: 'เผ็ดกลาง', en: 'Medium' }), option('hot', { th: 'เผ็ดมาก', en: 'Hot' })], true)],
      },
      {
        id: 'bai-2', category: 'จานเดียว / Bowls', name: { th: 'ข้าวหมูกรอบคั่วพริกเกลือ', en: 'Crispy pork with chili salt' }, description: { th: 'หมูกรอบชิ้นพอดีคำ หอมพริกคั่ว', en: 'Crisp pork with toasted chili' }, priceMinor: 6500, capacityUnits: 1.6, emoji: '🥓', image: imageUrls.rice, available: true, modifiers: [],
      },
      {
        id: 'bai-3', category: 'กับข้าว / Sides', name: { th: 'ไข่พะโล้เต้าหู้', en: 'Five-spice egg and tofu' }, description: { th: 'ไข่ต้มและเต้าหู้นุ่มในน้ำพะโล้', en: 'Soft egg and tofu in five-spice broth' }, priceMinor: 3500, capacityUnits: 0.6, emoji: '🥚', image: imageUrls.rice, available: true, modifiers: [],
      },
      {
        id: 'bai-4', category: 'กับข้าว / Sides', name: { th: 'ผัดผักรวม', en: 'Stir-fried vegetables' }, description: { th: 'ผักกรอบ ซอสกระเทียม', en: 'Crisp vegetables with garlic sauce' }, priceMinor: 3000, capacityUnits: 0.5, emoji: '🥬', image: imageUrls.rice, available: true, modifiers: [],
      },
      {
        id: 'bai-5', category: 'เครื่องดื่ม / Drinks', name: { th: 'น้ำเก๊กฮวย', en: 'Chrysanthemum tea' }, description: { th: 'หอมสดชื่น ดื่มเย็นๆ', en: 'Fragrant and refreshing over ice' }, priceMinor: 2000, capacityUnits: 0.1, emoji: '🧃', image: imageUrls.coffee, available: true, modifiers: [],
      },
    ],
  },
  {
    id: 'khlong-noodles',
    slug: 'khlong-noodles',
    organizationId: DEMO_ORGANIZATION.id,
    campusId: DEMO_CAMPUS.id,
    name: { th: 'เส้นสดริมคลอง', en: 'Khlong Noodles' },
    description: { th: 'ก๋วยเตี๋ยวชามไว · ซุปเคี่ยว', en: 'Fast bowls · slow-simmered broth' },
    emoji: '🍜',
    image: imageUrls.khlong,
    serviceOpen: true,
    settings: { baseCapacityPerMinute: 2.2, bufferMinutes: 2, manualDelayMinutes: 0, minimumWaitMinutes: 5, maximumWaitMinutes: 60, roundingMinutes: 5 },
    menu: [
      { id: 'khlong-1', category: 'ก๋วยเตี๋ยว / Noodles', name: { th: 'ก๋วยเตี๋ยวหมูตุ๋น', en: 'Braised pork noodles' }, description: { th: 'ซุปเข้มข้น เส้นนุ่มพอดี', en: 'Deep broth, springy noodles' }, priceMinor: 5000, capacityUnits: 1.2, emoji: '🍜', image: imageUrls.noodles, available: true, modifiers: [] },
      { id: 'khlong-2', category: 'ก๋วยเตี๋ยว / Noodles', name: { th: 'เย็นตาโฟเครื่องแน่น', en: 'Yentafo noodle bowl' }, description: { th: 'เต้าหู้ปลา ลูกชิ้น และผักสด', en: 'Fish tofu, meatballs and greens' }, priceMinor: 5500, capacityUnits: 1.5, emoji: '🥢', image: imageUrls.noodles, available: true, modifiers: [] },
      { id: 'khlong-3', category: 'ทานเล่น / Snacks', name: { th: 'เกี๊ยวทอด', en: 'Crispy dumplings' }, description: { th: 'กรอบใหม่ทุกชั่วโมง', en: 'Crisp and fried in small batches' }, priceMinor: 3000, capacityUnits: 0.5, emoji: '🥟', image: imageUrls.toast, available: true, modifiers: [] },
      { id: 'khlong-4', category: 'เครื่องดื่ม / Drinks', name: { th: 'ชาไทยเย็น', en: 'Iced Thai tea' }, description: { th: 'หอมชา เข้มกำลังดี', en: 'Bold tea, gently sweet' }, priceMinor: 2500, capacityUnits: 0.2, emoji: '🧋', image: imageUrls.coffee, available: true, modifiers: [] },
    ],
  },
  {
    id: 'chong-dee',
    slug: 'chong-dee',
    organizationId: DEMO_ORGANIZATION.id,
    campusId: DEMO_CAMPUS.id,
    name: { th: 'ชงดี', en: 'Chong Dee Coffee' },
    description: { th: 'กาแฟ · ขนมปังปิ้ง · พักสั้นๆ', en: 'Coffee · toast · a small pause' },
    emoji: '☕',
    image: imageUrls.chongDee,
    serviceOpen: true,
    settings: { baseCapacityPerMinute: 2.8, bufferMinutes: 2, manualDelayMinutes: 0, minimumWaitMinutes: 5, maximumWaitMinutes: 60, roundingMinutes: 5 },
    menu: [
      { id: 'chong-1', category: 'กาแฟ / Coffee', name: { th: 'อเมริกาโน่น้ำผึ้ง', en: 'Honey americano' }, description: { th: 'กาแฟคั่วกลาง หอมหวานบางๆ', en: 'Medium roast with a soft sweetness' }, priceMinor: 4500, capacityUnits: 0.4, emoji: '☕', image: imageUrls.coffee, available: true, modifiers: [] },
      { id: 'chong-2', category: 'กาแฟ / Coffee', name: { th: 'ลาเต้เย็น', en: 'Iced latte' }, description: { th: 'นมเนียน กาแฟชัด', en: 'Silky milk, clear espresso' }, priceMinor: 5000, capacityUnits: 0.5, emoji: '🥛', image: imageUrls.coffee, available: true, modifiers: [] },
      { id: 'chong-3', category: 'ขนม / Bakery', name: { th: 'ขนมปังปิ้งสังขยา', en: 'Toast with pandan custard' }, description: { th: 'ปิ้งร้อน กรอบนอกนุ่มใน', en: 'Toasted warm, crisp outside' }, priceMinor: 3500, capacityUnits: 0.6, emoji: '🍞', image: imageUrls.toast, available: true, modifiers: [] },
      { id: 'chong-4', category: 'ขนม / Bakery', name: { th: 'ครัวซองต์เนยสด', en: 'Butter croissant' }, description: { th: 'อบเช้านี้ เหลือจำนวนจำกัด', en: 'Baked this morning, limited batch' }, priceMinor: 5500, capacityUnits: 0.4, emoji: '🥐', image: imageUrls.toast, available: false, modifiers: [] },
    ],
  },
];

function makeSlots(vendorId, now) {
  const start = new Date(now.getTime() + 15 * 60_000);
  const labels = [
    ['11:30–11:35', '11:15', 1, 4],
    ['11:35–11:40', '11:20', 10, 15],
    ['11:40–11:45', '11:25', 10, 15],
    ['11:45–11:50', '11:30', 8, 12],
  ];
  return labels.map(([label, cutoff, maxOrders, maxCapacityUnits], index) => ({
    id: `${vendorId}-slot-${index + 1}`,
    vendorId,
    label,
    cutoff,
    startsAt: new Date(start.getTime() + index * 5 * 60_000).toISOString(),
    endsAt: new Date(start.getTime() + (index + 1) * 5 * 60_000).toISOString(),
    maxOrders,
    maxCapacityUnits,
    bookedOrders: 0,
    bookedCapacityUnits: 0,
    closed: false,
  }));
}

function demoOrder({ id, vendorId, ownerId, item, status, queueNumber, now, slotId = null }) {
  const createdAt = new Date(now.getTime() - 9 * 60_000).toISOString();
  const confirmedAt = new Date(now.getTime() - 8 * 60_000).toISOString();
  const statusHistory = [{ status: 'PENDING', at: createdAt }, { status: 'CONFIRMED', at: confirmedAt }];
  if (status === 'PREPARING' || status === 'READY') statusHistory.push({ status: 'PREPARING', at: new Date(now.getTime() - 5 * 60_000).toISOString() });
  if (status === 'READY') statusHistory.push({ status: 'READY', at: new Date(now.getTime() - 1 * 60_000).toISOString() });
  return {
    id,
    organizationId: DEMO_ORGANIZATION.id,
    vendorId,
    ownerId,
    ref: `JF-${queueNumber.replace(/\D/g, '').padStart(4, '0')}`,
    queueNumber,
    orderType: 'PREORDER',
    status,
    items: [{ menuItemId: item.id, itemId: item.id, quantity: 1, priceMinor: item.priceMinor, capacityUnits: item.capacityUnits, name: item.name, modifiers: [] }],
    subtotalMinor: item.priceMinor,
    serviceFeeMinor: Math.round(item.priceMinor * 0.02),
    totalMinor: item.priceMinor + Math.round(item.priceMinor * 0.02),
    capacityUnits: item.capacityUnits,
    slotId,
    slotLabel: slotId ? '11:35–11:40' : null,
    paymentMethod: 'PAY_AT_PICKUP',
    paymentStatus: 'UNPAID',
    createdAt,
    confirmedAt,
    estimatedReadyAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    statusHistory,
  };
}

export function createSeedData(now = new Date()) {
  const bai = vendors[0];
  const slots = vendors.flatMap((vendor) => makeSlots(vendor.id, now));
  const orders = [
    demoOrder({ id: 'order-demo-preparing', vendorId: bai.id, ownerId: 'user-student-1', item: bai.menu[1], status: 'PREPARING', queueNumber: 'A12', now, slotId: slots.find((slot) => slot.vendorId === bai.id && slot.id.endsWith('slot-2')).id }),
    demoOrder({ id: 'order-demo-ready', vendorId: bai.id, ownerId: 'user-student-1', item: bai.menu[2], status: 'READY', queueNumber: 'A11', now }),
  ];
  for (const order of orders) {
    if (!order.slotId) continue;
    const slot = slots.find((candidate) => candidate.id === order.slotId);
    if (!slot) continue;
    slot.bookedOrders += 1;
    slot.bookedCapacityUnits += order.capacityUnits;
  }
  return {
    organization: DEMO_ORGANIZATION,
    campus: DEMO_CAMPUS,
    users: DEMO_USERS.map((user) => ({ ...user, vendorIds: [...(user.vendorIds || [])] })),
    vendors: vendors.map((vendor) => ({ ...vendor, menu: vendor.menu.map((item) => ({ ...item, modifiers: item.modifiers.map((entry) => ({ ...entry, options: entry.options.map((choice) => ({ ...choice })) })) })) })),
    slots,
    orders,
    sessions: new Map(),
    idempotency: new Map(),
    auditEvents: [],
    nextQueueNumber: new Map([[bai.id, 13], ['khlong-noodles', 1], ['chong-dee', 1]]),
  };
}

export { imageUrls };
