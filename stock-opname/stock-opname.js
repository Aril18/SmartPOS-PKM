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

    const now =
        new Date();

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

    return number
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
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
// PORSI TERJUAL
// ==========================================

function soldPortionsToday() {

    return validTransactions().reduce(
        (total, transaction) => {

            const items =
                transaction.items || [];


            const portions =
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
                portions;
        },
        0
    );
}


// ==========================================
// WASTE
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

                    Number(
                        item.portionUsage ?? 1
                    )
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
// HITUNG SELISIH
// ==========================================

function calculateDifference() {

    const systemStock =
        expectedStockToday();


    const physicalStock =
        Number(
            document
                .getElementById("physicalStock")
                .value || 0
        );


    return (
        systemStock -
        physicalStock
    );
}


// ==========================================
// TENTUKAN STATUS
// ==========================================

function getStatus(difference) {

    const absDifference =
        Math.abs(
            Number(difference)
        );


    if (absDifference === 0) {

        return "NORMAL";

    }


    if (absDifference <= 2) {

        return "PERLU DIPERIKSA";

    }


    return "SELISIH TINGGI";
}


// ==========================================
// TAMPILKAN RINGKASAN
// ==========================================

function renderStockSummary() {

    const systemStock =
        expectedStockToday();


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
            systemStock
        ) + " Porsi";


    document
        .getElementById("systemStock")
        .value =
        systemStock;
}


// ==========================================
// PREVIEW SELISIH
// ==========================================

function renderDifference() {

    const difference =
        calculateDifference();


    const status =
        getStatus(
            difference
        );


    document
        .getElementById("stockDifference")
        .value =
        formatPortion(
            difference
        ) + " Porsi";


    const statusBox =
        document.getElementById(
            "opnameStatus"
        );


    statusBox.textContent =
        status;


    statusBox.className =
        "status-box";


    if (status === "NORMAL") {

        statusBox.classList.add(
            "normal"
        );

    } else if (
        status === "PERLU DIPERIKSA"
    ) {

        statusBox.classList.add(
            "warning"
        );

    } else {

        statusBox.classList.add(
            "danger"
        );
    }
}


// ==========================================
// AUDIT
// ==========================================

function addAudit(
    action,
    description,
    userId
) {

    db.auditLogs.push({

        id:
            Date.now(),

        userId:
            userId,

        action:
            action,

        description:
            description,

        createdAt:
            new Date().toISOString()

    });
}


// ==========================================
// SIMPAN STOCK OPNAME
// ==========================================

function saveStockOpname(event) {

    event.preventDefault();


    const date =
        document
            .getElementById("opnameDate")
            .value;


    const expectedStock =
        expectedStockToday();


    const physicalStock =
        Number(
            document
                .getElementById("physicalStock")
                .value
        );


    const notes =
        document
            .getElementById("notes")
            .value
            .trim();


    if (!date) {

        alert(
            "Tanggal stock opname harus diisi."
        );

        return;
    }


    if (
        Number.isNaN(physicalStock) ||
        physicalStock < 0
    ) {

        alert(
            "Stok fisik tidak valid."
        );

        return;
    }


    const difference =
        expectedStock -
        physicalStock;


    const status =
        getStatus(
            difference
        );


    const stockOpname = {

        id:
            Date.now(),

        date:
            date,

        expectedStock:
            expectedStock,

        physicalStock:
            physicalStock,

        difference:
            difference,

        status:
            status,

        notes:
            notes,

        createdBy:
            currentUser.id,

        createdAt:
            new Date().toISOString()

    };


    db.stockOpnames.push(
        stockOpname
    );


    addAudit(
        "STOCK OPNAME",
        `Stok sistem ${formatPortion(expectedStock)} porsi, stok fisik ${formatPortion(physicalStock)} porsi, selisih ${formatPortion(difference)} porsi`,
        currentUser.id
    );


    saveDB();


    alert(
        "Stock opname berhasil disimpan."
    );


    document
        .getElementById("physicalStock")
        .value =
        "";


    document
        .getElementById("notes")
        .value =
        "";


    renderDifference();

    renderStockOpnameTable();
}


// ==========================================
// RIWAYAT STOCK OPNAME
// ==========================================

function renderStockOpnameTable() {

    const table =
        document.getElementById(
            "stockOpnameTable"
        );


    table.innerHTML =
        "";


    if (
        db.stockOpnames.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Belum ada data stock opname.
                </td>
            </tr>
        `;

        return;
    }


    const records =
        [...db.stockOpnames]
            .reverse();


    records.forEach(item => {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td>
                ${item.date}
            </td>

            <td>
                ${formatPortion(item.expectedStock)} Porsi
            </td>

            <td>
                ${formatPortion(item.physicalStock)} Porsi
            </td>

            <td>
                ${formatPortion(item.difference)} Porsi
            </td>

            <td>
                ${item.status}
            </td>

            <td>
                ${item.notes || "-"}
            </td>
        `;


        table.appendChild(
            row
        );
    });
}


// ==========================================
// USER
// ==========================================

function renderUser() {

    document
        .getElementById("namaUser")
        .textContent =
        currentUser.name;
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
// EVENT
// ==========================================

document
    .getElementById("stockOpnameForm")
    .addEventListener(
        "submit",
        saveStockOpname
    );


document
    .getElementById("physicalStock")
    .addEventListener(
        "input",
        renderDifference
    );


// ==========================================
// DEFAULT TANGGAL
// ==========================================

document
    .getElementById("opnameDate")
    .value =
    todayISO();


// ==========================================
// JALANKAN
// ==========================================

renderUser();

renderStockSummary();

renderDifference();

renderStockOpnameTable();