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
    ).format(
        Number(value || 0)
    );
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
// AMBIL USER
// ==========================================

function getUser(userId) {

    return db.users.find(
        user =>
            Number(user.id) ===
            Number(userId)
    );
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
// TANGGAL LAPORAN
// ==========================================

function selectedDate() {

    return document
        .getElementById("reportDate")
        .value;
}


// ==========================================
// TRANSAKSI BERDASARKAN TANGGAL
// ==========================================

function transactionsByDate(date) {

    return db.transactions.filter(
        transaction =>
            transaction.date === date
    );
}


// ==========================================
// TRANSAKSI VALID
// ==========================================

function validTransactions(date) {

    return transactionsByDate(date)
        .filter(
            transaction =>
                transaction.status !== "VOID"
        );
}


// ==========================================
// TRANSAKSI VOID
// ==========================================

function voidTransactions(date) {

    return transactionsByDate(date)
        .filter(
            transaction =>
                transaction.status === "VOID"
        );
}


// ==========================================
// OMZET
// ==========================================

function calculateOmzet(date) {

    return validTransactions(date)
        .reduce(
            (total, transaction) =>
                total +
                Number(transaction.total || 0),
            0
        );
}


// ==========================================
// PENJUALAN TUNAI
// ==========================================

function calculateCashSales(date) {

    return validTransactions(date)
        .filter(
            transaction =>
                transaction.paymentMethod === "TUNAI"
        )
        .reduce(
            (total, transaction) =>
                total +
                Number(transaction.total || 0),
            0
        );
}


// ==========================================
// PENJUALAN NON TUNAI
// ==========================================

function calculateNonCashSales(date) {

    return validTransactions(date)
        .filter(
            transaction =>
                transaction.paymentMethod !== "TUNAI"
        )
        .reduce(
            (total, transaction) =>
                total +
                Number(transaction.total || 0),
            0
        );
}


// ==========================================
// PRODUKSI
// ==========================================

function productionPortions(date) {

    return db.production
        .filter(
            item =>
                item.date === date
        )
        .reduce(
            (total, item) =>
                total +
                Number(item.estimatedPortion || 0),
            0
        );
}


// ==========================================
// PORSI TERJUAL
// ==========================================

function soldPortions(date) {

    return validTransactions(date)
        .reduce(
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
                                    Number(item.quantity || 0)
                                    *
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

function wastePortions(date) {

    return db.waste
        .filter(item => {

            if (item.date) {
                return item.date === date;
            }


            if (item.createdAt) {

                return (
                    item.createdAt.substring(0, 10)
                    === date
                );
            }


            return false;
        })
        .reduce(
            (total, item) =>
                total +
                (
                    Number(item.quantity || 0)
                    *
                    Number(item.portionUsage ?? 1)
                ),
            0
        );
}


// ==========================================
// STOK SISTEM
// ==========================================

function systemStock(date) {

    return (
        productionPortions(date)
        -
        soldPortions(date)
        -
        wastePortions(date)
    );
}


// ==========================================
// SELISIH STOCK OPNAME
// ==========================================

function stockDifference(date) {

    const opname =
        [...db.stockOpnames]
            .reverse()
            .find(
                item =>
                    item.date === date
            );


    if (!opname) {
        return 0;
    }


    return Number(
        opname.difference || 0
    );
}


// ==========================================
// SELISIH KAS
// ==========================================

function cashDifference(date) {

    const closing =
        [...db.closings]
            .reverse()
            .find(
                item =>
                    item.date === date
            );


    if (!closing) {
        return 0;
    }


    return Number(
        closing.cashDifference || 0
    );
}


// ==========================================
// RENDER USER
// ==========================================

function renderUser() {

    if (!currentUser) {
        return;
    }


    document
        .getElementById("namaUser")
        .textContent =
        currentUser.name;


    document
        .getElementById("sidebarUser")
        .textContent =
        currentUser.name;
}


// ==========================================
// RENDER SUMMARY
// ==========================================

function renderSummary() {

    const date =
        selectedDate();


    document
        .getElementById("totalOmzet")
        .textContent =
        formatRupiah(
            calculateOmzet(date)
        );


    document
        .getElementById("totalTransaksi")
        .textContent =
        validTransactions(date).length;


    document
        .getElementById("penjualanTunai")
        .textContent =
        formatRupiah(
            calculateCashSales(date)
        );


    document
        .getElementById("penjualanNonTunai")
        .textContent =
        formatRupiah(
            calculateNonCashSales(date)
        );


    document
        .getElementById("totalVoid")
        .textContent =
        voidTransactions(date).length;


    document
        .getElementById("porsiTerjual")
        .textContent =
        formatPortion(
            soldPortions(date)
        ) + " Porsi";


    document
        .getElementById("totalWaste")
        .textContent =
        formatPortion(
            wastePortions(date)
        ) + " Porsi";


    document
        .getElementById("stokSistem")
        .textContent =
        formatPortion(
            systemStock(date)
        ) + " Porsi";
}


// ==========================================
// RENDER STOK
// ==========================================

function renderStockReport() {

    const date =
        selectedDate();


    document
        .getElementById("stokProduksi")
        .textContent =
        formatPortion(
            productionPortions(date)
        ) + " Porsi";


    document
        .getElementById("stokTerjual")
        .textContent =
        formatPortion(
            soldPortions(date)
        ) + " Porsi";


    document
        .getElementById("stokWaste")
        .textContent =
        formatPortion(
            wastePortions(date)
        ) + " Porsi";


    document
        .getElementById("stokAkhir")
        .textContent =
        formatPortion(
            systemStock(date)
        ) + " Porsi";


    document
        .getElementById("selisihStok")
        .textContent =
        formatPortion(
            stockDifference(date)
        ) + " Porsi";


    document
        .getElementById("selisihKas")
        .textContent =
        formatRupiah(
            cashDifference(date)
        );
}


// ==========================================
// RENDER TRANSAKSI
// ==========================================

function renderTransactionTable() {

    const table =
        document.getElementById(
            "transactionTable"
        );


    table.innerHTML =
        "";


    const date =
        selectedDate();


    const transactions =
        transactionsByDate(date);


    if (transactions.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Belum ada transaksi pada tanggal ini.
                </td>
            </tr>
        `;

        return;
    }


    const data =
        [...transactions].reverse();


    data.forEach(transaction => {

        const user =
            getUser(
                transaction.cashierId
            );


        let time =
            "-";


        if (transaction.createdAt) {

            time =
                new Date(
                    transaction.createdAt
                ).toLocaleTimeString(
                    "id-ID",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );
        }


        const totalItem =
            (transaction.items || [])
                .reduce(
                    (total, item) =>
                        total +
                        Number(item.quantity || 0),
                    0
                );


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${transaction.code || "-"}
            </td>

            <td>
                ${time}
            </td>

            <td>
                ${user?.name || "-"}
            </td>

            <td>
                ${totalItem}
            </td>

            <td>
                ${transaction.paymentMethod || "-"}
            </td>

            <td>
                ${formatRupiah(transaction.total)}
            </td>

            <td
                class="${
                    transaction.status === "VOID"
                        ? "status-void"
                        : "status-valid"
                }"
            >
                ${transaction.status || "-"}
            </td>
        `;


        table.appendChild(
            row
        );
    });
}


// ==========================================
// JUDUL LAPORAN
// ==========================================

function renderReportTitle() {

    const date =
        selectedDate();


    if (!date) {
        return;
    }


    const formatted =
        new Date(
            date + "T00:00:00"
        ).toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    document
        .getElementById("reportDateTitle")
        .textContent =
        formatted;
}


// ==========================================
// RENDER SEMUA
// ==========================================

function renderReport() {

    renderSummary();

    renderStockReport();

    renderTransactionTable();

    renderReportTitle();
}


// ==========================================
// CETAK
// ==========================================

function printReport() {

    window.print();
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
    .getElementById("reportDate")
    .addEventListener(
        "change",
        renderReport
    );


// ==========================================
// DEFAULT TANGGAL
// ==========================================

document
    .getElementById("reportDate")
    .value =
    todayISO();


// ==========================================
// JALANKAN
// ==========================================

renderUser();

renderReport();