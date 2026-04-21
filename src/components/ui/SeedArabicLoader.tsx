import { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from './ui/button';

const VENUES_DATA = [
  {
    name: "Moon Hall",
    nameAr: "قاعة موون",
    location: "Villa",
    zone: "Local",
    price: 15000,
    capacity: 200,
    rating: 5.0,
    reviews: 0,
    type: "wedding",
    ownerId: "SEED_ARABIC_VILLA",
    images: [], // Fake pics removed
    description: "Elegant villa hall equipped with standard party packages.",
    descriptionAr: "قاعة فيلا أنيقة ومميزة جداً، تتسع حتى 200 فرد بتصميم راقي، مجهزة بالكامل بأحدث أنظمة الإضاءة والصوت وشاشات العرض لتوفر لك ليلة عمر لا تُنسى في أجواء ساحرة.",
    policiesAr: "حجز اليوم بدفع قيمة التأمين 1000 و مقدم حجز 5000 جنية. فى حاله الغاء التعاقد لأى سبب يتم خصم المبلغ المدفوع بالكامل. فى حالة حجز اليوم لعميل اخر يتم رد المبلغ. عدم تناول المسكرات و المخدرات. لا يسمح باستخدام الالعاب النارية أو المأكولات الخارجية. يضاف 10% خدمة.",
    amenities: [
      "ديكور مدخل القاعة",
      "كوشة ليد اسكرين",
      "ترابيزات - كراسي",
      "دانس فلور - DJ",
      "سنتر بيس - ديكور سلم",
      "تصوير فيديو - كاميرا كرين",
      "لايت سيستم كامل - دخان",
      "وحدة مكسر-شاشة عرض"
    ],
    packages: [
      { id: "p1", name: "High Tea 1", nameAr: "بوفية هاي تي 1", price: 50, description: "قطعة جاتوة + ميني بيتزا + ميني باتية + كانز + 1 مياة كبيرة" },
      { id: "p2", name: "High Tea 2", nameAr: "بوفية هاي تي 2", price: 70, description: "قطعة جاتوة + ميني بيتزا + ميني باتية + سندوتش كفتة + كانز + 1 مياة كبيرة" },
      { id: "p3", name: "High Tea 3", nameAr: "بوفية هاي تي 3", price: 80, description: "قطعة جاتوة + سندوتش كفتة + سندوتش فراخ + كانز + 1 مياة كبيرة" },
      { id: "p4", name: "Dinner Level 1", nameAr: "عشاء مستوى 1", price: 150, description: "ارز بالخلطة + شريحة فراخ + 1 ص كفتة + 3 ص ورق عنب + 4 انواع سلطة + عيش + 2 ق جاتوة + كانز + مياة" },
      { id: "p5", name: "Dinner Level 2", nameAr: "عشاء مستوى 2", price: 200, description: "ارز بالخلطة + شريحة فراخ + شريحة رومي + 2 ص كفتة + 3 ص ورق عنب + 4 انواع سلطة + عيش + 2 ق جاتوة + كانز + مياة" }
    ],
    services: [
      { id: "s1", name: "Extra Laser", nameAr: "ليزر اضافى", price: 2500, category: "addon" },
      { id: "s2", name: "Bride Room", nameAr: "غرفة عروسة", price: 1000, category: "addon" },
      { id: "s3", name: "Zaffa Domyaty", nameAr: "زفة دمياطي", price: 2000, category: "addon" },
      { id: "s4", name: "Lebanese Zaffa", nameAr: "دبكة لبناني", price: 6000, category: "addon" },
      { id: "s5", name: "Mazoun Table Decor", nameAr: "ديكور ترابيزة مأذون", price: 500, category: "addon" },
      { id: "s6", name: "Screens", nameAr: "استربات + شاشات", price: 5000, category: "addon" },
      { id: "s7", name: "Guest Book & Table", nameAr: "جست بوك + ترابيزة", price: 700, category: "book" },
      { id: "s8", name: "Welcome Board", nameAr: "Welcome Board", price: 800, category: "book" },
      { id: "s9", name: "Party Photography", nameAr: "تصوير الحفلة", price: 1500, category: "photo" },
      { id: "s10", name: "Photo Session", nameAr: "فوتوسيشن", price: 4000, category: "photo" },
      { id: "s11", name: "Photo + Makeup", nameAr: "ميك اب + فوتوسيشن + الحفلة", price: 5000, category: "photo" },
      { id: "s12", name: "Photo + Promo", nameAr: "ميك اب + فوتوسيشن + الحفلة + برومو", price: 7000, category: "photo" },
      { id: "s13", name: "Fire Show 1", nameAr: "فاير شو slow dance", price: 1500, category: "fire" },
      { id: "s14", name: "Fire Show 2", nameAr: "فاير شو entrance + slow dance", price: 2500, category: "fire" },
      { id: "s15", name: "Fire Show 3", nameAr: "فاير شو 4 سبارك", price: 3500, category: "fire" },
      { id: "s16", name: "Cake 3-tier", nameAr: "تورتة 3 ادوار", price: 1200, category: "cake" },
      { id: "s17", name: "Cake 5-tier", nameAr: "تورتة 5 ادوار", price: 1400, category: "cake" },
      { id: "s18", name: "Cake 7-tier", nameAr: "تورتة 7 ادوار", price: 1600, category: "cake" },
      { id: "s19", name: "Mazoun Entry", nameAr: "رسم دخول مأذون", price: 300, category: "entry" },
      { id: "s20", name: "Outside Photographer", nameAr: "رسم دخول مصور خارجي", price: 1000, category: "entry" },
      { id: "s21", name: "Makeup Artist Entry", nameAr: "رسم دخول ميكب ارتيست", price: 500, category: "entry" },
      { id: "s22", name: "Food Entry Fee", nameAr: "رسم دخول مأكولات", price: 35, category: "entry" }
    ],
    availability: {},
    createdAt: new Date()
  },
  {
    name: "Soul Hall",
    nameAr: "قاعة سول",
    location: "Villa",
    zone: "Local",
    price: 25000,
    capacity: 400,
    rating: 5.0,
    reviews: 0,
    type: "wedding",
    ownerId: "SEED_ARABIC_VILLA",
    images: [],
    description: "Spacious premium villa hall for large gatherings.",
    descriptionAr: "قاعة فيلا فاخرة وواسعة للتجمعات الكبرى، تتسع حتى 400 فرد، تم تصميمها خصيصاً للمناسبات الفخمة مع توفير أعلى مستويات الخدمة والرفاهية لتناسب جميع أذواقكم.",
    policiesAr: "حجز اليوم بدفع قيمة التأمين 1000 و مقدم حجز 5000 جنية. فى حاله الغاء التعاقد لأى سبب يتم خصم المبلغ المدفوع بالكامل. فى حالة حجز اليوم لعميل اخر يتم رد المبلغ. عدم تناول المسكرات و المخدرات. لا يسمح باستخدام الالعاب النارية أو المأكولات الخارجية. يضاف 10% خدمة.",
     amenities: [
      "ديكور مدخل القاعة",
      "كوشة ليد اسكرين",
      "ترابيزات - كراسي",
      "دانس فلور - DJ",
      "سنتر بيس - ديكور سلم",
      "تصوير فيديو - كاميرا كرين",
      "لايت سيستم كامل - دخان",
      "وحدة مكسر-شاشة عرض"
    ],
    packages: [
      { id: "p1", name: "High Tea 1", nameAr: "بوفية هاي تي 1", price: 50, description: "قطعة جاتوة + ميني بيتزا + ميني باتية + كانز + 1 مياة كبيرة" },
      { id: "p2", name: "High Tea 2", nameAr: "بوفية هاي تي 2", price: 70, description: "قطعة جاتوة + ميني بيتزا + ميني باتية + سندوتش كفتة + كانز + 1 مياة كبيرة" },
      { id: "p3", name: "High Tea 3", nameAr: "بوفية هاي تي 3", price: 80, description: "قطعة جاتوة + سندوتش كفتة + سندوتش فراخ + كانز + 1 مياة كبيرة" },
      { id: "p4", name: "Dinner Level 1", nameAr: "عشاء مستوى 1", price: 150, description: "ارز بالخلطة + شريحة فراخ + 1 ص كفتة + 3 ص ورق عنب + 4 انواع سلطة + عيش + 2 ق جاتوة + كانز + مياة" },
      { id: "p5", name: "Dinner Level 2", nameAr: "عشاء مستوى 2", price: 200, description: "ارز بالخلطة + شريحة فراخ + شريحة رومي + 2 ص كفتة + 3 ص ورق عنب + 4 انواع سلطة + عيش + 2 ق جاتوة + كانز + مياة" }
    ],
    services: [
      { id: "s1", name: "Extra Laser", nameAr: "ليزر اضافى", price: 2500, category: "addon" },
      { id: "s2", name: "Bride Room", nameAr: "غرفة عروسة", price: 1000, category: "addon" },
      { id: "s3", name: "Zaffa Domyaty", nameAr: "زفة دمياطي", price: 2000, category: "addon" },
      { id: "s4", name: "Lebanese Zaffa", nameAr: "دبكة لبناني", price: 6000, category: "addon" },
      { id: "s5", name: "Mazoun Table Decor", nameAr: "ديكور ترابيزة مأذون", price: 500, category: "addon" },
      { id: "s6", name: "Screens", nameAr: "استربات + شاشات", price: 5000, category: "addon" },
      { id: "s7", name: "Guest Book & Table", nameAr: "جست بوك + ترابيزة", price: 700, category: "book" },
      { id: "s8", name: "Welcome Board", nameAr: "Welcome Board", price: 800, category: "book" },
      { id: "s9", name: "Party Photography", nameAr: "تصوير الحفلة", price: 1500, category: "photo" },
      { id: "s10", name: "Photo Session", nameAr: "فوتوسيشن", price: 4000, category: "photo" },
      { id: "s11", name: "Photo + Makeup", nameAr: "ميك اب + فوتوسيشن + الحفلة", price: 5000, category: "photo" },
      { id: "s12", name: "Photo + Promo", nameAr: "ميك اب + فوتوسيشن + الحفلة + برومو", price: 7000, category: "photo" },
      { id: "s13", name: "Fire Show 1", nameAr: "فاير شو slow dance", price: 1500, category: "fire" },
      { id: "s14", name: "Fire Show 2", nameAr: "فاير شو entrance + slow dance", price: 2500, category: "fire" },
      { id: "s15", name: "Fire Show 3", nameAr: "فاير شو 4 سبارك", price: 3500, category: "fire" },
      { id: "s16", name: "Cake 3-tier", nameAr: "تورتة 3 ادوار", price: 1200, category: "cake" },
      { id: "s17", name: "Cake 5-tier", nameAr: "تورتة 5 ادوار", price: 1400, category: "cake" },
      { id: "s18", name: "Cake 7-tier", nameAr: "تورتة 7 ادوار", price: 1600, category: "cake" },
      { id: "s19", name: "Mazoun Entry", nameAr: "رسم دخول مأذون", price: 300, category: "entry" },
      { id: "s20", name: "Outside Photographer", nameAr: "رسم دخول مصور خارجي", price: 1000, category: "entry" },
      { id: "s21", name: "Makeup Artist Entry", nameAr: "رسم دخول ميكب ارتيست", price: 500, category: "entry" },
      { id: "s22", name: "Food Entry Fee", nameAr: "رسم دخول مأكولات", price: 35, category: "entry" }
    ],
    availability: {},
    createdAt: new Date()
  }
];

export function SeedArabicLoader() {
  const [seeding, setSeeding] = useState(false);

  const seedDB = async () => {
    setSeeding(true);
    try {
      // Create a vendor user so we have a valid ownerId
      await setDoc(doc(db, "users", "SEED_ARABIC_VILLA"), {
        email: "villa@metysaravendors.com",
        name: "Villa Management",
        role: "vendor",
        createdAt: new Date(),
      });

      // Add venues
      for (const vData of VENUES_DATA) {
        await addDoc(collection(db, "venues"), vData);
      }
      alert("Seeded 2 Arabic Venues Successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to seed venues");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Button onClick={seedDB} disabled={seeding} className="bg-orange-500 z-50 fixed bottom-4 right-4">
      {seeding ? "Seeding..." : "Inject 2 Arabic Venues"}
    </Button>
  );
}
