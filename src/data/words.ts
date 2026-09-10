export const INITIAL_WORDS = [
  "بيتزا",
  "شاورما",
  "بحر",
  "جامعة",
  "مدرسة",
  "عرس",
  "مطار",
  "سيارة",
  "قهوة",
  "مطعم",
  "سينما",
  "كرة قدم",
  "سفر",
  "مستشفى",
  "حفلة",
  "عيد ميلاد",
  "بقالة",
  "هاتف",
  "حديقة",
  "صيف",
  "شتاء",
  "مطر",
  "قطار",
  "طيارة",
  "فندق",
  "مسبح",
  "شاطئ",
  "شوكولاتة",
  "ثلج",
  "آيس كريم",
  "ساعة",
  "كتاب",
  "كاميرا",
  "طبيب",
  "حديقة حيوان",
  "نظارة",
  "سوق",
  "دراجة",
  "برج",
  "جزيرة",
];

export const AVATARS = [
  "🕵️‍♂️",
  "🦊",
  "🎭",
  "🐱",
  "🦁",
  "🐼",
  "🥷",
  "👾",
  "🦄",
  "🚀",
  "👑",
  "🦉",
  "🐯",
  "👻",
  "🥑",
  "🍕",
];

// Clean Arabic text for comparison (remove tashkeel and normalize alef)
export function normalizeArabic(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}
