const SESSION_KEY =
    "umkmControlSessionV1";

const API_URL =
    "http://localhost:3000";


/* =========================================
   SESSION
========================================= */

const currentUser =
    JSON.parse(
        localStorage.getItem(
            SESSION_KEY
        ) || "null"
    );


/* =========================================
   CEK LOGIN
========================================= */

if (!currentUser) {

    window.location.href =
        "../index.html";

}


/* =========================================
   KHUSUS OWNER
========================================= */

if (
    currentUser &&
    currentUser.role !==
    "OWNER"
) {

    window.location.href =
        "../pos/index.html";

}


/* =========================================
   DATA MYSQL
========================================= */

let users = [];

let auditLogs = [];


/* =========================================
   API
========================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            `${API_URL}${url}`,
            {

                ...options,

                headers: {

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                }

            }
        );


    let result;


    try {

        result =
            await response.json();

    }

    catch {

        throw new Error(
            "Respons server tidak valid."
        );

    }


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            "Terjadi kesalahan pada server."
        );

    }


    return result;

}


/* =========================================
   LOAD USERS MYSQL
========================================= */

async function loadUsers() {

    const result =
        await apiRequest(
            "/api/users"
        );


    users =
        (result.data || [])
            .map(
                user => ({

                    ...user,

                    id:
                        Number(
                            user.id
                        )

                })
            );


    console.log(
        "✅ AUDIT USERS MYSQL:",
        users
    );

}


/* =========================================
   LOAD AUDIT LOG MYSQL
========================================= */

async function loadAuditLogs() {

    const result =
        await apiRequest(
            "/api/audit-logs"
        );


    auditLogs =
        (result.data || [])
            .map(
                log => ({

                    ...log,

                    id:
                        Number(
                            log.id
                        ),

                    userId:
                        Number(
                            log.userId
                        )

                })
            );


    console.log(
        "✅ AUDIT LOGS MYSQL:",
        auditLogs
    );

}


/* =========================================
   TANGGAL HARI INI
========================================= */

function todayISO() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================
   AMBIL USER
========================================= */

function getUser(
    userId
) {

    return users.find(

        user =>
            Number(
                user.id
            )
            ===
            Number(
                userId
            )

    );

}


/* =========================================
   FORMAT TANGGAL
========================================= */

function formatDate(
    createdAt
) {

    if (!createdAt) {

        return "-";

    }


    const date =
        new Date(
            createdAt
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date
        .toLocaleDateString(
            "id-ID",
            {

                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"

            }
        );

}


/* =========================================
   FORMAT WAKTU
========================================= */

function formatTime(
    createdAt
) {

    if (!createdAt) {

        return "-";

    }


    const date =
        new Date(
            createdAt
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date
        .toLocaleTimeString(
            "id-ID",
            {

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );

}


/* =========================================
   TANGGAL LOG
========================================= */

function getLogDate(
    log
) {

    if (
        !log.createdAt
    ) {

        return "";

    }


    /*
     * Endpoint sudah mengirim:
     * YYYY-MM-DDTHH:mm:ss
     */

    if (
        typeof log.createdAt ===
        "string"

        &&

        log.createdAt.length >=
        10
    ) {

        return log.createdAt
            .substring(
                0,
                10
            );

    }


    return "";

}


/* =========================================
   USER
========================================= */

function renderUser() {

    document
        .getElementById(
            "namaUser"
        )
        .textContent =
        currentUser.name;


    document
        .getElementById(
            "sidebarUser"
        )
        .textContent =
        currentUser.name;

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const today =
        todayISO();


    const logsToday =
        auditLogs.filter(

            log =>
                getLogDate(
                    log
                )
                ===
                today

        );


    const loginToday =
        logsToday.filter(

            log =>
                log.action ===
                "LOGIN"

        ).length;


    const transactionToday =
        logsToday.filter(

            log =>
                log.action ===
                "TRANSAKSI"

        ).length;


    document
        .getElementById(
            "totalAktivitas"
        )
        .textContent =
        auditLogs.length;


    document
        .getElementById(
            "aktivitasHariIni"
        )
        .textContent =
        logsToday.length;


    document
        .getElementById(
            "loginHariIni"
        )
        .textContent =
        loginToday;


    document
        .getElementById(
            "transaksiHariIni"
        )
        .textContent =
        transactionToday;

}


/* =========================================
   FILTER PEGAWAI
========================================= */

function renderUserFilter() {

    const filterUser =
        document.getElementById(
            "filterUser"
        );


    filterUser.innerHTML = `

        <option value="">
            Semua Pegawai
        </option>

    `;


    users.forEach(

        user => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                user.id;


            option.textContent =
                `${user.name} (${user.role})`;


            filterUser.appendChild(
                option
            );

        }

    );

}


/* =========================================
   FILTER ACTION DINAMIS
========================================= */

function renderActionFilter() {

    const filterAction =
        document.getElementById(
            "filterAction"
        );


    const currentValue =
        filterAction.value;


    const actions =
        [
            ...new Set(
                auditLogs
                    .map(
                        log =>
                            log.action
                    )
                    .filter(
                        Boolean
                    )
            )
        ]
            .sort();


    filterAction.innerHTML = `

        <option value="">
            Semua Aktivitas
        </option>

    `;


    actions.forEach(

        action => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                action;


            option.textContent =
                action;


            filterAction.appendChild(
                option
            );

        }

    );


    if (
        actions.includes(
            currentValue
        )
    ) {

        filterAction.value =
            currentValue;

    }

}


/* =========================================
   FILTER
========================================= */

function getFilteredLogs() {

    const keyword =
        document
            .getElementById(
                "searchAudit"
            )
            .value
            .toLowerCase()
            .trim();


    const action =
        document
            .getElementById(
                "filterAction"
            )
            .value;


    const userId =
        document
            .getElementById(
                "filterUser"
            )
            .value;


    const date =
        document
            .getElementById(
                "filterDate"
            )
            .value;


    return auditLogs.filter(

        log => {

            const user =
                getUser(
                    log.userId
                );


            const name =
                (
                    log.userName
                    ||
                    user?.name
                    ||
                    ""
                );


            const description =
                log.description ||
                "";


            const actionText =
                log.action ||
                "";


            const matchesKeyword =
                !keyword

                ||

                name
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                ||

                description
                    .toLowerCase()
                    .includes(
                        keyword
                    )

                ||

                actionText
                    .toLowerCase()
                    .includes(
                        keyword
                    );


            const matchesAction =
                !action

                ||

                log.action ===
                action;


            const matchesUser =
                !userId

                ||

                Number(
                    log.userId
                )
                ===
                Number(
                    userId
                );


            const matchesDate =
                !date

                ||

                getLogDate(
                    log
                )
                ===
                date;


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


/* =========================================
   TABLE
========================================= */

function renderAuditTable() {

    const auditTable =
        document.getElementById(
            "auditTable"
        );


    auditTable.innerHTML =
        "";


    const logs =
        [...getFilteredLogs()]
            .sort(

                (
                    a,
                    b
                ) =>

                    new Date(
                        b.createdAt
                    )

                    -

                    new Date(
                        a.createdAt
                    )

            );


    if (
        logs.length ===
        0
    ) {

        auditTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        color:#9ca3af;
                    "
                >
                    Tidak ada aktivitas yang ditemukan.
                </td>

            </tr>

        `;


        return;

    }


    logs.forEach(

        log => {

            const user =
                getUser(
                    log.userId
                );


            const userName =
                log.userName
                ||
                user?.name
                ||
                "-";


            const userRole =
                log.userRole
                ||
                user?.role
                ||
                "-";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${formatDate(
                        log.createdAt
                    )}
                </td>

                <td>
                    ${formatTime(
                        log.createdAt
                    )}
                </td>

                <td>
                    ${userName}
                </td>

                <td>

                    <span class="role-badge">
                        ${userRole}
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

        }

    );

}


/* =========================================
   RESET FILTER
========================================= */

function resetFilter() {

    document
        .getElementById(
            "searchAudit"
        )
        .value =
        "";


    document
        .getElementById(
            "filterAction"
        )
        .value =
        "";


    document
        .getElementById(
            "filterUser"
        )
        .value =
        "";


    document
        .getElementById(
            "filterDate"
        )
        .value =
        "";


    renderAuditTable();

}


/* =========================================
   EVENTS
========================================= */

document
    .getElementById(
        "searchAudit"
    )
    .addEventListener(
        "input",
        renderAuditTable
    );


document
    .getElementById(
        "filterAction"
    )
    .addEventListener(
        "change",
        renderAuditTable
    );


document
    .getElementById(
        "filterUser"
    )
    .addEventListener(
        "change",
        renderAuditTable
    );


document
    .getElementById(
        "filterDate"
    )
    .addEventListener(
        "change",
        renderAuditTable
    );


/* =========================================
   LOGOUT
========================================= */

function logout() {

    localStorage.removeItem(
        SESSION_KEY
    );


    window.location.href =
        "../index.html";

}


/* =========================================
   INITIALIZE
========================================= */

async function initializeAudit() {

    renderUser();


    try {

        await Promise.all([

            loadUsers(),

            loadAuditLogs()

        ]);


        renderSummary();

        renderUserFilter();

        renderActionFilter();

        renderAuditTable();


        console.log(
            "✅ AUDIT MYSQL SIAP"
        );

    }

    catch (error) {

        console.error(
            "❌ Initialize Audit Error:",
            error
        );


        alert(
            error.message ||
            "Gagal memuat Audit Aktivitas."
        );

    }

}


initializeAudit();