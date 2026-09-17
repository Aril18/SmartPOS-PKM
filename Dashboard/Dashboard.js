const STORAGE_KEY = "umkmControlDataV1";
const SESSION_KEY = "umkmControlSessionV1";

const currentUser =
    JSON.parse(localStorage.getItem(SESSION_KEY) || "null");


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
// AMBIL DATA DARI LOCAL STORAGE
// ==========================================

const db =
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

db.users = db.users || [];
db.menus = db.menus || [];
db.production = db.production || [];
db.transactions = db.transactions || [];
db.waste = db.waste || [];
db.stockOpnames = db.stockOpnames || [];
db.closings = db.closings || [];
db.auditLogs = db.auditLogs || [];


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
// FORMAT RUPIAH
// ==========================================

function formatRupiah(value) {
    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }
    ).format(Number(value || 0));
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
// AMBIL MENU BERDASARKAN ID
// ==========================================

function getMenu(menuId) {
    return db.menus.find(
        menu =>
            Number(menu.id) ===
            Number(menuId)
    );
}


function getUser(userId) {
    return db.users.find(
        user =>
            Number(user.id) ===
            Number(userId)
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


function transactionsToday() {
    const today =
        todayISO();

    return db.transactions.filter(
        transaction =>
            transaction.date === today
    );
}


function validTransactions() {
    return transactionsToday().filter(
        transaction =>
            transaction.status !== "VOID"
    );
}


function voidTransactions() {
    return transactionsToday().filter(
        transaction =>
            transaction.status === "VOID"
    );
}


function initialPortionsToday() {
    return productionToday().reduce(
        (total, item) =>
            total +
            Number(item.estimatedPortion || 0),
        0
    );
}


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

            return total + transactionPortions;
        },
        0
    );
}

function todayWaste() {
    const today =
        todayISO();

    return db.waste.filter(
        item => {

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
        }
    );
}


function wastePortionsToday() {
    return todayWaste().reduce(
        (total, item) =>
            total +
            (
                Number(item.quantity || 0) *
                Number(item.portionUsage ?? 1)
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

function omzetToday() {
    return validTransactions().reduce(
        (total, transaction) =>
            total +
            Number(transaction.total || 0),
        0
    );
}


function stockDifferenceToday() {
    const today =
        todayISO();

    const stockOpname =
        [...db.stockOpnames]
            .reverse()
            .find(
                item =>
                    item.date === today
            );

    if (!stockOpname) {
        return 0;
    }

    return Number(
        stockOpname.difference || 0
    );
}


function cashDifferenceToday() {
    const today =
        todayISO();

    const closing =
        [...db.closings]
            .reverse()
            .find(
                item =>
                    item.date === today
            );

    if (!closing) {
        return 0;
    }

    return Number(
        closing.cashDifference || 0
    );
}

function renderDashboard() {

    document
        .getElementById("namaUser")
        .textContent =
        currentUser.name;


    document
        .getElementById("omzetHariIni")
        .textContent =
        formatRupiah(
            omzetToday()
        );


    document
        .getElementById("jumlahTransaksi")
        .textContent =
        validTransactions().length;


    document
        .getElementById("porsiTerjual")
        .textContent =
        formatPortion(
            soldPortionsToday()
        );


    document
        .getElementById("stokTersisa")
        .textContent =
        formatPortion(
            expectedStockToday()
        ) + " Porsi";


    document
        .getElementById("wasteHariIni")
        .textContent =
        formatPortion(
            wastePortionsToday()
        ) + " Porsi";


    document
        .getElementById("jumlahVoid")
        .textContent =
        voidTransactions().length;


    document
        .getElementById("selisihStok")
        .textContent =
        formatPortion(
            stockDifferenceToday()
        ) + " Porsi";


    document
        .getElementById("selisihKas")
        .textContent =
        formatRupiah(
            cashDifferenceToday()
        );


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

    renderAuditTable();
}


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

    }

    else if (stock <= 10) {

        stockAlert.textContent =
            `STOK MENIPIS: Tersisa ${formatPortion(stock)} porsi`;

        stockAlert.style.background =
            "#fef3c7";

        stockAlert.style.color =
            "#92400e";

        stockAlert.style.borderColor =
            "#fde68a";

    }

    else {

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


function renderAuditTable() {

    const auditTable =
        document.getElementById("auditTable");

    auditTable.innerHTML = "";


    const logs =
        [...db.auditLogs]
            .reverse()
            .slice(0, 10);


    if (logs.length === 0) {

        auditTable.innerHTML = `
            <tr>
                <td colspan="4">
                    Belum ada aktivitas.
                </td>
            </tr>
        `;

        return;
    }


    logs.forEach(log => {

        const user =
            getUser(log.userId);


        let time = "-";


        if (log.createdAt) {

            time =
                new Date(
                    log.createdAt
                ).toLocaleTimeString(
                    "id-ID",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${time}</td>
            <td>${user?.name || "-"}</td>
            <td>${log.action || "-"}</td>
            <td>${log.description || "-"}</td>
        `;


        auditTable.appendChild(row);

    });
}


function logout() {

    localStorage.removeItem(
        SESSION_KEY
    );

    window.location.href =
        "../index.html";
}

window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
        location.reload();
    }
});
renderDashboard();