const STORAGE_KEY = "umkmControlDataV1";
const SESSION_KEY = "umkmControlSessionV1";

const seedData = {
  users: [
    {
      id: 1,
      name: "Pemilik Usaha",
      username: "owner",
      password: "owner123",
      role: "OWNER",
      status: "AKTIF"
    },
    {
      id: 2,
      name: "Made",
      username: "made",
      password: "123456",
      role: "KASIR",
      status: "AKTIF"
    },
    {
      id: 3,
      name: "Putu",
      username: "putu",
      password: "123456",
      role: "KASIR",
      status: "AKTIF"
    }
  ],

  menus: [
    {
      id: 1,
      code: "M001",
      name: "Nasi Babi Campur",
      category: "Makanan",
      price: 25000,
      portionUsage: 1,
      status: "TERSEDIA"
    },
    {
      id: 2,
      code: "M002",
      name: "Nasi Babi Spesial",
      category: "Makanan",
      price: 35000,
      portionUsage: 1.5,
      status: "TERSEDIA"
    },
    {
      id: 3,
      code: "M003",
      name: "Tambahan Daging",
      category: "Tambahan",
      price: 15000,
      portionUsage: 0.5,
      status: "TERSEDIA"
    },
    {
      id: 4,
      code: "M004",
      name: "Air Mineral",
      category: "Minuman",
      price: 5000,
      portionUsage: 0,
      status: "TERSEDIA"
    }
  ],

  production: [
    {
      id: 1,
      date: todayISO(),
      ingredient: "Daging matang",
      stockWeight: 50,
      estimatedPortion: 100,
      notes: "Produksi awal hari"
    }
  ],

  transactions: [],
  waste: [],
  stockOpnames: [],
  closings: [],
  auditLogs: []
};

let db = loadDB();

let currentUser =
  JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

let currentPage = "dashboard";
let cart = [];

function login(e) {
  e.preventDefault();

  const username =
    document.getElementById("username").value.trim();

  const password =
    document.getElementById("password").value;

  const user = db.users.find(
    u =>
      u.username === username &&
      u.password === password &&
      u.status === "AKTIF"
  );

  if (!user) {
    document.getElementById("loginError").textContent =
      "Username/password salah atau akun tidak aktif.";
    return;
  }

  currentUser = user;

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(user)
  );

  addAudit(
    "LOGIN",
    "Login ke sistem",
    user.id
  );

  if (user.role === "OWNER") {
  window.location.href = "Dashboard/index.html";
} else if (user.role === "KASIR") {
  window.location.href = "pos/index.html";
}
}

function loadDB() {
  const savedData =
    localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(seedData)
    );

    return JSON.parse(
      JSON.stringify(seedData)
    );
  }

  try {
    const data =
      JSON.parse(savedData);

    data.users = data.users || [];
    data.menus = data.menus || [];
    data.production = data.production || [];
    data.transactions = data.transactions || [];
    data.waste = data.waste || [];
    data.stockOpnames = data.stockOpnames || [];
    data.closings = data.closings || [];
    data.auditLogs = data.auditLogs || [];

    return data;
  } catch (error) {
    console.error(
      "Gagal membaca data:",
      error
    );

    return JSON.parse(
      JSON.stringify(seedData)
    );
  }
}

function saveDB() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  );
}

function addAudit(
  action,
  description,
  userId
) {
  if (!db.auditLogs) {
    db.auditLogs = [];
  }

  db.auditLogs.push({
    id: Date.now(),
    userId: userId,
    action: action,
    description: description,
    createdAt: new Date().toISOString()
  });

  saveDB();
}

function todayISO() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMenu(menuId) {
  return db.menus.find(
    menu =>
      Number(menu.id) ===
      Number(menuId)
  );
}

function productionToday() {
  const today =
    todayISO();

  return db.production.filter(
    item =>
      item.date === today
  );
}

function validTransactions() {
  const today =
    todayISO();

  return db.transactions.filter(
    transaksi =>
      transaksi.date === today &&
      transaksi.status !== "VOID"
  );
}

function todayWaste() {
  const today =
    todayISO();

  return db.waste.filter(
    waste => {
      if (waste.date) {
        return waste.date === today;
      }

      if (waste.createdAt) {
        return (
          waste.createdAt.substring(0, 10)
          === today
        );
      }

      return false;
    }
  );
}

function initialPortionsToday() {
  return productionToday().reduce(
    (total, item) =>
      total +
      Number(
        item.estimatedPortion || 0
      ),
    0
  );
}

function soldPortionsToday() {
  return validTransactions().reduce(
    (total, transaksi) => {

      return total +
        (transaksi.items || []).reduce(
          (subtotal, item) => {

            const menu =
              getMenu(item.menuId);

            return subtotal +
              Number(item.quantity) *
              Number(
                menu?.portionUsage || 0
              );
          },
          0
        );
    },
    0
  );
}

function wastePortionsToday() {
  return todayWaste().reduce(
    (total, waste) =>
      total +
      Number(waste.quantity || 0) *
      Number(
        waste.portionUsage ?? 1
      ),
    0
  );
}

function expectedStockToday() {
  return (
    initialPortionsToday()
    -
    soldPortionsToday()
    -
    wastePortionsToday()
  );
}

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener(
    "submit",
    login
  );
}