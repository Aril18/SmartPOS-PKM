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


if (!currentUser) {

    window.location.href =
        "../index.html";

}


/* =========================================
   DATA MYSQL
========================================= */

let users = [];

let transactions = [];

let closings = [];


/* =========================================
   API HELPER
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
   BASIC
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


function formatRupiah(
    value
) {

    return new Intl.NumberFormat(
        "id-ID",
        {

            style:
                "currency",

            currency:
                "IDR",

            minimumFractionDigits:
                0

        }
    ).format(
        Number(
            value || 0
        )
    );

}


/* =========================================
   LOAD USERS
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

}


/* =========================================
   LOAD TRANSACTIONS
========================================= */

async function loadTransactions() {

    const result =
        await apiRequest(
            "/api/transactions"
        );


    transactions =
        (result.data || [])
            .map(
                transaction => ({

                    ...transaction,

                    id:
                        Number(
                            transaction.id
                        ),

                    cashierId:
                        Number(
                            transaction.cashierId
                        ),

                    total:
                        Number(
                            transaction.total || 0
                        )

                })
            );

}


/* =========================================
   LOAD CLOSINGS
========================================= */

async function loadClosings() {

    const result =
        await apiRequest(
            "/api/closings"
        );


    closings =
        (result.data || [])
            .map(
                closing => ({

                    ...closing,

                    id:
                        Number(
                            closing.id
                        ),

                    cashierId:
                        Number(
                            closing.cashierId
                        ),

                    transactionCount:
                        Number(
                            closing.transactionCount || 0
                        ),

                    voidCount:
                        Number(
                            closing.voidCount || 0
                        ),

                    cashSales:
                        Number(
                            closing.cashSales || 0
                        ),

                    nonCashSales:
                        Number(
                            closing.nonCashSales || 0
                        ),

                    systemCash:
                        Number(
                            closing.systemCash || 0
                        ),

                    actualCash:
                        Number(
                            closing.actualCash || 0
                        ),

                    cashDifference:
                        Number(
                            closing.cashDifference || 0
                        )

                })
            );


    console.log(
        "✅ CLOSINGS MYSQL:",
        closings
    );

}


/* =========================================
   USER
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
   TRANSACTIONS USER HARI INI
========================================= */

function userTransactionsToday() {

    return transactions.filter(

        transaction =>

            transaction.date ===
            todayISO()

            &&

            Number(
                transaction.cashierId
            )
            ===
            Number(
                currentUser.id
            )

    );

}


function validTransactionsToday() {

    return userTransactionsToday()
        .filter(

            transaction =>
                transaction.status !==
                "VOID"

        );

}


function voidTransactionsToday() {

    return userTransactionsToday()
        .filter(

            transaction =>
                transaction.status ===
                "VOID"

        );

}


/* =========================================
   PENJUALAN
========================================= */

function cashSalesToday() {

    return validTransactionsToday()

        .filter(

            transaction =>
                String(
                    transaction.paymentMethod
                ).toUpperCase()
                ===
                "TUNAI"

        )

        .reduce(

            (
                total,
                transaction
            ) =>

                total
                +
                Number(
                    transaction.total || 0
                ),

            0

        );

}


function nonCashSalesToday() {

    return validTransactionsToday()

        .filter(

            transaction =>
                String(
                    transaction.paymentMethod
                ).toUpperCase()
                !==
                "TUNAI"

        )

        .reduce(

            (
                total,
                transaction
            ) =>

                total
                +
                Number(
                    transaction.total || 0
                ),

            0

        );

}


/* =========================================
   CLOSINGS HARI INI
========================================= */

function closingsToday() {

    return closings.filter(

        closing =>
            closing.date ===
            todayISO()

    );

}


function currentUserClosingToday() {

    return [...closingsToday()]
        .reverse()
        .find(

            closing =>

                Number(
                    closing.cashierId
                )

                ===

                Number(
                    currentUser.id
                )

        );

}


/* =========================================
   USER DISPLAY
========================================= */

function renderUser() {

    const namaUser =
        document.getElementById(
            "namaUser"
        );


    if (
        namaUser
    ) {

        namaUser.textContent =
            currentUser.name;

    }


    const sidebarUser =
        document.getElementById(
            "sidebarUser"
        );


    if (
        sidebarUser
    ) {

        sidebarUser.textContent =
            currentUser.name;

    }


    document
        .getElementById(
            "tanggalHariIni"
        )
        .textContent =
        new Date()
            .toLocaleDateString(
                "id-ID",
                {

                    day:
                        "2-digit",

                    month:
                        "long",

                    year:
                        "numeric"

                }
            );

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    document
        .getElementById(
            "cashSales"
        )
        .textContent =
        formatRupiah(
            cashSalesToday()
        );


    document
        .getElementById(
            "nonCashSales"
        )
        .textContent =
        formatRupiah(
            nonCashSalesToday()
        );


    document
        .getElementById(
            "transactionCount"
        )
        .textContent =
        validTransactionsToday()
            .length;


    document
        .getElementById(
            "voidCount"
        )
        .textContent =
        voidTransactionsToday()
            .length;


    document
        .getElementById(
            "systemCash"
        )
        .textContent =
        formatRupiah(
            cashSalesToday()
        );

}


/* =========================================
   DIFFERENCE PREVIEW
========================================= */

function updateDifferencePreview() {

    const physicalInput =
        document.getElementById(
            "physicalCash"
        );


    const value =
        physicalInput.value;


    const physicalCash =
        Number(
            value || 0
        );


    const systemCash =
        cashSalesToday();


    const difference =
        physicalCash -
        systemCash;


    document
        .getElementById(
            "physicalCashPreview"
        )
        .textContent =
        formatRupiah(
            physicalCash
        );


    document
        .getElementById(
            "cashDifference"
        )
        .textContent =
        formatRupiah(
            difference
        );


    const box =
        document.getElementById(
            "differenceBox"
        );


    const description =
        document.getElementById(
            "differenceDescription"
        );


    box.className =
        "difference-box";


    if (
        value === ""
    ) {

        box.classList.add(
            "neutral"
        );


        description.textContent =
            "Masukkan kas fisik untuk melihat selisih";


        document
            .getElementById(
                "cashDifference"
            )
            .textContent =
            formatRupiah(
                0
            );


        return;

    }


    if (
        difference === 0
    ) {

        box.classList.add(
            "match"
        );


        description.textContent =
            "Kas fisik sesuai dengan sistem";

    }

    else if (
        difference < 0
    ) {

        box.classList.add(
            "short"
        );


        description.textContent =
            `Kas kurang ${formatRupiah(
                Math.abs(
                    difference
                )
            )}`;

    }

    else {

        box.classList.add(
            "over"
        );


        description.textContent =
            `Kas lebih ${formatRupiah(
                difference
            )}`;

    }

}


/* =========================================
   STATUS CLOSING
========================================= */

function renderClosingStatus() {

    const closing =
        currentUserClosingToday();


    const badge =
        document.getElementById(
            "closingStatusBadge"
        );


    const button =
        document.getElementById(
            "closingBtn"
        );


    const physicalInput =
        document.getElementById(
            "physicalCash"
        );


    const notesInput =
        document.getElementById(
            "notes"
        );


    if (!closing) {

        badge.textContent =
            "Belum Closing";


        badge.className =
            "status-badge open";


        button.disabled =
            false;


        button.textContent =
            "Simpan Closing";


        physicalInput.disabled =
            false;


        notesInput.disabled =
            false;


        return;

    }


    badge.textContent =
        "Sudah Closing";


    badge.className =
        "status-badge closed";


    button.disabled =
        true;


    button.textContent =
        "Closing Sudah Disimpan";


    physicalInput.value =
        Number(
            closing.actualCash || 0
        );


    notesInput.value =
        closing.notes || "";


    physicalInput.disabled =
        true;


    notesInput.disabled =
        true;


    updateDifferencePreview();

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(
    message,
    type = "success"
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    box.style.display =
        "block";


    box.textContent =
        message;


    if (
        type ===
        "success"
    ) {

        box.style.background =
            "#dcfce7";

        box.style.color =
            "#166534";

        box.style.border =
            "1px solid #bbf7d0";

    }

    else {

        box.style.background =
            "#fee2e2";

        box.style.color =
            "#991b1b";

        box.style.border =
            "1px solid #fecaca";

    }


    setTimeout(

        () => {

            box.style.display =
                "none";

        },

        4000

    );

}


/* =========================================
   SAVE CLOSING MYSQL
========================================= */

async function saveClosing(
    event
) {

    event.preventDefault();


    if (
        currentUserClosingToday()
    ) {

        showMessage(
            "Closing hari ini sudah dilakukan.",
            "error"
        );


        return;

    }


    const physicalCash =
        Number(
            document
                .getElementById(
                    "physicalCash"
                )
                .value
        );


    const notes =
        document
            .getElementById(
                "notes"
            )
            .value
            .trim();


    if (
        Number.isNaN(
            physicalCash
        )
        ||
        physicalCash < 0
    ) {

        showMessage(
            "Kas fisik tidak valid.",
            "error"
        );


        return;

    }


    const button =
        document.getElementById(
            "closingBtn"
        );


    const originalText =
        button.textContent;


    try {

        button.disabled =
            true;


        button.textContent =
            "Menyimpan...";


        await apiRequest(
            "/api/closings",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        cashierId:
                            Number(
                                currentUser.id
                            ),

                        date:
                            todayISO(),

                        actualCash:
                            physicalCash,

                        notes:
                            notes

                    })

            }
        );


        await Promise.all([

            loadTransactions(),

            loadClosings()

        ]);


        renderSummary();

        renderClosingTable();

        renderClosingStatus();


        showMessage(
            "Closing berhasil disimpan ke database.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "❌ Save Closing Error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal menyimpan closing.",
            "error"
        );


        button.disabled =
            false;


        button.textContent =
            originalText;

    }

}


/* =========================================
   TABLE
========================================= */

function renderClosingTable() {

    const table =
        document.getElementById(
            "closingTable"
        );


    table.innerHTML =
        "";


    const records =
        [...closingsToday()]
            .sort(

                (
                    a,
                    b
                ) =>

                    new Date(
                        b.createdAt || 0
                    )

                    -

                    new Date(
                        a.createdAt || 0
                    )

            );


    if (
        records.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        color:#9ca3af;
                    "
                >
                    Belum ada closing hari ini.
                </td>

            </tr>

        `;


        return;

    }


    records.forEach(

        closing => {

            const user =
                getUser(
                    closing.cashierId
                );


            let time =
                "-";


            if (
                closing.createdAt
            ) {

                const date =
                    new Date(
                        closing.createdAt
                    );


                if (
                    !Number.isNaN(
                        date.getTime()
                    )
                ) {

                    time =
                        date
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

            }


            const difference =
                Number(
                    closing.cashDifference ||
                    0
                );


            let statusClass =
                "status-ok";


            if (
                difference < 0
            ) {

                statusClass =
                    "status-short";

            }

            else if (
                difference > 0
            ) {

                statusClass =
                    "status-over";

            }


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${time}
                </td>

                <td>
                    ${
                        closing.cashierName
                        ||
                        user?.name
                        ||
                        "-"
                    }
                </td>

                <td>
                    ${formatRupiah(
                        closing.systemCash
                    )}
                </td>

                <td>
                    ${formatRupiah(
                        closing.actualCash
                    )}
                </td>

                <td class="${statusClass}">
                    ${formatRupiah(
                        difference
                    )}
                </td>

                <td class="${statusClass}">
                    ${closing.status || "-"}
                </td>

                <td>
                    ${closing.notes || "-"}
                </td>

            `;


            table.appendChild(
                row
            );

        }

    );

}


/* =========================================
   EVENTS
========================================= */

document
    .getElementById(
        "physicalCash"
    )
    .addEventListener(
        "input",
        updateDifferencePreview
    );


document
    .getElementById(
        "closingForm"
    )
    .addEventListener(
        "submit",
        saveClosing
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

async function initializeClosing() {

    renderUser();


    try {

        await Promise.all([

            loadUsers(),

            loadTransactions(),

            loadClosings()

        ]);


        renderSummary();

        renderClosingTable();

        updateDifferencePreview();

        renderClosingStatus();


        console.log(
            "✅ CLOSING MYSQL SIAP"
        );

    }

    catch (error) {

        console.error(
            "❌ Initialize Closing Error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal memuat halaman Closing.",
            "error"
        );

    }

}


initializeClosing();