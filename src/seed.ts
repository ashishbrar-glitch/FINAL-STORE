import { db } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const PRODUCTS = [
  { id: '1', name: 'Aashirvaad Atta (5kg)', price: 210, category: 'Grocery', image: '🌾' },
  { id: '2', name: 'Tata Salt (1kg)', price: 25, category: 'Grocery', image: '🧂' },
  { id: '3', name: 'Toor Dal (1kg)', price: 160, category: 'Grocery', image: '🥣' },
  { id: '4', name: 'Maggi Noodles (140g)', price: 30, category: 'Grocery', image: '🍜' },
  { id: '5', name: 'Paracetamol Strip', price: 15, category: 'Medicine', image: '💊' },
  { id: '6', name: 'LED Bulb 9W', price: 100, category: 'Hardware', image: '💡' },
  { id: '7', name: 'Notebook 200 Pages', price: 45, category: 'Stationery', image: '📓' },
  { id: '8', name: 'Amul Milk (1L)', price: 64, category: 'Grocery', image: '🥛' },
  { id: '9', name: 'Sugar (1kg)', price: 42, category: 'Grocery', image: '🍬' },
  { id: '10', name: 'Tea Leaves (250g)', price: 120, category: 'Grocery', image: '☕' },
  { id: '11', name: 'Onion (1kg)', price: 40, category: 'Grocery', image: '🧅' },
  { id: '12', name: 'Potato (1kg)', price: 30, category: 'Grocery', image: '🥔' },
];

const SEATS = ['G3', 'G12', 'G15', 'G22', 'B40', 'B45', 'B55', 'B60', 'B70'];

async function seed() {
  console.log("Starting seed...");
  
  // 1. Create superadmin directly in db
  try {
    const adminId = "user_superadmin";
    await setDoc(doc(db, 'users', adminId), {
      uid: adminId,
      email: 'admin@bcnstore.com',
      password: 'password123',
      role: 'superadmin',
      createdAt: new Date()
    });
    console.log("Superadmin created: admin@bcnstore.com / password123");
  } catch (e: any) {
    console.error("Error creating superadmin:", e);
  }

  // 2. Seed products
  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    await setDoc(doc(db, 'products', p.id), {
      name: p.name,
      price: p.price,
      category: p.category,
      imageUrl: p.image, // Use emoji as placeholder
      createdAt: new Date()
    });
  }

  // 3. Seed seats
  console.log("Seeding seats...");
  for (const s of SEATS) {
    await setDoc(doc(db, 'seats', s), {
      seatId: s,
      isOccupied: true,
      allocatedTo: 'Demo User',
      updatedAt: new Date()
    });
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed();
