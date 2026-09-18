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
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
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
// FORMAT TANGGAL
// ==========================================

function formatDate(createdAt) {

    if (!createdAt) {
        return "-";
    }


    const date =
        new Date(createdAt);


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// ==========================================
// FORMAT WAKTU
// ==========================================

function formatTime(createdAt) {

    if (!createdAt) {
        return "-";
    }


    const date =
        new Date(createdAt);


    return date.toLocaleTimeString(
        "id-ID",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// TANGGAL LOG ISO
// ==========================================

function getLogDate(log) {

    if (!log.createdAt) {
        return "";
    }


    const date =
        new Date(log.createdAt);


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


// ==========================================
// USER
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
// SUMMARY
// ==========================================

function renderSummary() {

    const today =
        todayISO();


    const logsToday =
        db.auditLogs.filter(
            log =>
                getLogDate(log) === today
        );


    const loginToday =
        logsToday.filter(
            log =>
                log.action === "LOGIN"
        ).length;


    const transactionToday =
        logsToday.filter(
            log =>
                log.action === "TRANSAKSI"
        ).length;


    document
        .getElementById("totalAktivitas")
        .textContent =
        db.auditLogs.length;


    document
        .getElementById("aktivitasHariIni")
        .textContent =
        logsToday.length;


    document
        .getElementById("loginHariIni")
        .textContent =
        loginToday;


    document
        .getElementById("transaksiHariIni")
        .textContent =
        transactionToday;
}


// ==========================================
// ISI FILTER PEGAWAI
// ==========================================

function renderUserFilter() {

    const filterUser =
        document.getElementById("filterUser");


    filterUser.innerHTML = `
        <option value="">
            Semua Pegawai
        </option>
    `;


    db.users.forEach(user => {

        const option =
            document.createElement("option");


        option.value =
            user.id;


        option.textContent =
            `${user.name} (${user.role})`;


        filterUser.appendChild(
            option
        );
    });
}


// ==========================================
// FILTER LOG
// ==========================================

function getFilteredLogs() {

    const keyword =
        document
            .getElementById("searchAudit")
            .value
            .toLowerCase()
            .trim();


    const action =
        document
            .getElementById("filterAction")
            .value;


    const userId =
        document
            .getElementById("filterUser")
            .value;


    const date =
        document
            .getElementById("filterDate")
            .value;


    return db.auditLogs.filter(
        log => {

            const user =
                getUser(log.userId);


            const name =
                user?.name || "";


            const description =
                log.description || "";


            const actionText =
                log.action || "";


            const matchesKeyword =
                !keyword
                ||
                name
                    .toLowerCase()
                    .includes(keyword)
                ||
                description
                    .toLowerCase()
                    .includes(keyword)
                ||
                actionText
                    .toLowerCase()
                    .includes(keyword);


            const matchesAction =
                !action
                ||
                log.action === action;


            const matchesUser =
                !userId
                ||
                Number(log.userId) ===
                    Number(userId);


            const matchesDate =
                !date
                ||
                getLogDate(log) === date;


            return (
                matchesKeyword
                &&
                matchesAction
                &&
                matchesUser
                &&
                matchesDate
            );
        }
    );
}


// ==========================================
// TAMPILKAN AUDIT
// ==========================================

function renderAuditTable() {

    const auditTable =
        document.getElementById("auditTable");


    auditTable.innerHTML =
        "";


    const logs =
        getFilteredLogs()
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );


    if (logs.length === 0) {

        auditTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Tidak ada aktivitas yang ditemukan.
                </td>
            </tr>
        `;

        return;
    }


    logs.forEach(log => {

        const user =
            getUser(log.userId);


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${formatDate(log.createdAt)}
            </td>

            <td>
                ${formatTime(log.createdAt)}
            </td>

            <td>
                ${user?.name || "-"}
            </td>

            <td>
                <span class="role-badge">
                    ${user?.role || "-"}
                </span>
            </td>

            <td>
                <span class="activity-badge">
                    ${log.action || "-"}
                </span>
            </td>

            <td>
                ${log.description || "-"}
            </td>
        `;


        auditTable.appendChild(
            row
        );
    });
}


// ==========================================
// RESET FILTER
// ==========================================

function resetFilter() {

    document
        .getElementById("searchAudit")
        .value =
        "";


    document
        .getElementById("filterAction")
        .value =
        "";


    document
        .getElementById("filterUser")
        .value =
        "";


    document
        .getElementById("filterDate")
        .value =
        "";


    renderAuditTable();
}


// ==========================================
// EVENT FILTER
// ==========================================

document
    .getElementById("searchAudit")
    .addEventListener(
        "input",
        renderAuditTable
    );


document
    .getElementById("filterAction")
    .addEventListener(
        "change",
        renderAuditTable
    );


document
    .getElementById("filterUser")
    .addEventListener(
        "change",
        renderAuditTable
    );


document
    .getElementById("filterDate")
    .addEventListener(
        "change",
        renderAuditTable
    );


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
// JALANKAN
// ==========================================

renderUser();

renderSummary();

renderUserFilter();

renderAuditTable();