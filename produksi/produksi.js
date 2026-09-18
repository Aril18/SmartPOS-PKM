const STORAGE_KEY = "umkmControlDataV1";
const SESSION_KEY = "umkmControlSessionV1";

let currentUser =
    JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

let db =
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");


// ==========================================
// CEK LOGIN
// ==========================================

if (!currentUser) {
    window.location.href = "../index.html";
}


// ==========================================
// CEK ROLE
// ==========================================

if (currentUser && currentUser.role !== "OWNER") {
    window.location.href = "../pos/index.html";
}


// ==========================================
// SIAPKAN DATABASE
// ==========================================

db.users = db.users || [];
db.menus = db.menus || [];
db.production = db.production || [];
db.transactions = db.transactions || [];
db.waste = db.waste || [];
db.stockOpnames = db.stockOpnames || [];
db.closings = db.closings || [];
db.auditLogs = db.auditLogs || [];


// ==========================================
// SIMPAN DATABASE
// ==========================================

function saveDB() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );
}


// ==========================================
// TANGGAL HARI INI
// ==========================================

function todayISO() {
    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// FORMAT PORSI
// ==========================================

function formatPortion(value) {
    const number =
        Number(value || 0);

    if (Number.isInteger(number)) {
        return number;
    }

    return number.toFixed(1);
}


// ==========================================
// AMBIL MENU
// ==========================================

function getMenu(menuId) {
    return db.menus.find(
        menu =>
            Number(menu.id) ===
            Number(menuId)
    );
}


// ==========================================
// PRODUKSI HARI INI
// ==========================================

function productionToday() {
    const today =
        todayISO();

    return db.production.filter(
        item =>
            item.date === today
    );
}


// ==========================================
// TRANSAKSI HARI INI
// ==========================================

function validTransactions() {
    const today =
        todayISO();

    return db.transactions.filter(
        transaction =>
            transaction.date === today &&
            transaction.status !== "VOID"
    );
}


// ==========================================
// STOK AWAL
// ==========================================

function initialPortionsToday() {
    return productionToday().reduce(
        (total, item) =>
            total +
            Number(item.estimatedPortion || 0),
        0
    );
}


// ==========================================
// PORSI TERJUAL
// ==========================================

function soldPortionsToday() {

    return validTransactions().reduce(
        (total, transaction) => {

            const items =
                transaction.items || [];

            const transactionPortions =
                items.reduce(
                    (subtotal, item) => {

                        const menu =
                            getMenu(item.menuId);

                        const portionUsage =
                            Number(
                                item.portionUsageAtSale ??
                                menu?.portionUsage ??
                                0
                            );

                        return subtotal +
                            (
                                Number(item.quantity || 0) *
                                portionUsage
                            );
                    },
                    0
                );

            return total +
                transactionPortions;
        },
        0
    );
}


// ==========================================
// WASTE HARI INI
// ==========================================

function wastePortionsToday() {

    const today =
        todayISO();

    return db.waste
        .filter(item => {

            if (item.date) {
                return item.date === today;
            }

            if (item.createdAt) {
                return (
                    item.createdAt.substring(0, 10)
                    === today
                );
            }

            return false;
        })
        .reduce(
            (total, item) =>
                total +
                (
                    Number(item.quantity || 0) *
                    Number(item.portionUsage ?? 1)
                ),
            0
        );
}


// ==========================================
// STOK SISTEM
// ==========================================

function expectedStockToday() {
    return (
        initialPortionsToday()
        -
        soldPortionsToday()
        -
        wastePortionsToday()
    );
}


// ==========================================
// TAMPILKAN USER
// ==========================================

function renderUser() {

    const namaUser =
        document.getElementById("namaUser");

    if (currentUser) {
        namaUser.textContent =
            currentUser.name;
    }
}


// ==========================================
// TAMPILKAN STOK
// ==========================================

function renderStock() {

    document
        .getElementById("stokAwal")
        .textContent =
        formatPortion(
            initialPortionsToday()
        ) + " Porsi";


    document
        .getElementById("stokTerjual")
        .textContent =
        formatPortion(
            soldPortionsToday()
        ) + " Porsi";


    document
        .getElementById("stokWaste")
        .textContent =
        formatPortion(
            wastePortionsToday()
        ) + " Porsi";


    document
        .getElementById("stokSistem")
        .textContent =
        formatPortion(
            expectedStockToday()
        ) + " Porsi";


    renderStockAlert();
}


// ==========================================
// STATUS STOK
// ==========================================

function renderStockAlert() {

    const stock =
        expectedStockToday();

    const stockAlert =
        document.getElementById("stockAlert");


    if (stock <= 0) {

        stockAlert.textContent =
            "STOK HABIS";

        stockAlert.style.background =
            "#fee2e2";

        stockAlert.style.color =
            "#991b1b";

        stockAlert.style.borderColor =
            "#fecaca";

    } else if (stock <= 10) {

        stockAlert.textContent =
            `STOK MENIPIS: Tersisa ${formatPortion(stock)} porsi`;

        stockAlert.style.background =
            "#fef3c7";

        stockAlert.style.color =
            "#92400e";

        stockAlert.style.borderColor =
            "#fde68a";

    } else {

        stockAlert.textContent =
            `STOK AMAN: Tersisa ${formatPortion(stock)} porsi`;

        stockAlert.style.background =
            "#dcfce7";

        stockAlert.style.color =
            "#166534";

        stockAlert.style.borderColor =
            "#bbf7d0";

    }
}


// ==========================================
// RIWAYAT PRODUKSI
// ==========================================

function renderProductionTable() {

    const productionTable =
        document.getElementById("productionTable");

    productionTable.innerHTML = "";


    if (db.production.length === 0) {

        productionTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada data produksi.
                </td>
            </tr>
        `;

        return;
    }


    const productionData =
        [...db.production].reverse();


    productionData.forEach(item => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${item.date || "-"}</td>

            <td>${item.ingredient || "-"}</td>

            <td>
                ${Number(item.stockWeight || 0)} Kg
            </td>

            <td>
                ${formatPortion(item.estimatedPortion)} Porsi
            </td>

            <td>
                ${item.notes || "-"}
            </td>
        `;


        productionTable.appendChild(
            row
        );
    });
}


// ==========================================
// AUDIT LOG
// ==========================================

function addAudit(
    action,
    description,
    userId
) {

    db.auditLogs.push({

        id: Date.now(),

        userId: userId,

        action: action,

        description: description,

        createdAt:
            new Date().toISOString()

    });
}


// ==========================================
// SIMPAN PRODUKSI
// ==========================================

function saveProduction(event) {

    event.preventDefault();


    const productionDate =
        document
            .getElementById("productionDate")
            .value;


    const ingredient =
        document
            .getElementById("ingredient")
            .value
            .trim();


    const stockWeight =
        Number(
            document
                .getElementById("stockWeight")
                .value
        );


    const estimatedPortion =
        Number(
            document
                .getElementById("estimatedPortion")
                .value
        );


    const notes =
        document
            .getElementById("notes")
            .value
            .trim();


    if (
        !productionDate ||
        !ingredient ||
        stockWeight <= 0 ||
        estimatedPortion <= 0
    ) {

        alert(
            "Lengkapi data produksi terlebih dahulu."
        );

        return;
    }


    const production = {

        id: Date.now(),

        date: productionDate,

        ingredient: ingredient,

        stockWeight: stockWeight,

        estimatedPortion:
            estimatedPortion,

        notes: notes,

        createdAt:
            new Date().toISOString(),

        createdBy:
            currentUser.id
    };


    db.production.push(
        production
    );


    addAudit(
        "PRODUKSI",
        `Produksi ${ingredient} sebanyak ${formatPortion(estimatedPortion)} porsi`,
        currentUser.id
    );


    saveDB();


    alert(
        "Data produksi berhasil disimpan."
    );


    document
        .getElementById("productionForm")
        .reset();


    document
        .getElementById("productionDate")
        .value =
        todayISO();


    renderStock();

    renderProductionTable();
}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem(
        SESSION_KEY
    );

    window.location.href =
        "../index.html";
}


// ==========================================
// EVENT FORM
// ==========================================

const productionForm =
    document.getElementById("productionForm");


if (productionForm) {

    productionForm.addEventListener(
        "submit",
        saveProduction
    );
}


// ==========================================
// DEFAULT TANGGAL
// ==========================================

document
    .getElementById("productionDate")
    .value =
    todayISO();


// ==========================================
// JALANKAN HALAMAN
// ==========================================

renderUser();

renderStock();

renderProductionTable();