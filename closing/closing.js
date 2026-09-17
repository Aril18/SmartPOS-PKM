const STORAGE_KEY =
    "umkmControlDataV1";

const SESSION_KEY =
    "umkmControlSessionV1";


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


const db =
    JSON.parse(
        localStorage.getItem(
            STORAGE_KEY
        ) || "{}"
    );


db.users =
    db.users || [];

db.transactions =
    db.transactions || [];

db.closings =
    db.closings || [];

db.auditLogs =
    db.auditLogs || [];


/* ================================
   BASIC
================================ */

function saveDB() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );

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


function getUser(userId) {

    return db.users.find(
        user =>
            Number(user.id) ===
            Number(userId)
    );

}


function addAudit(
    action,
    description
) {

    db.auditLogs.push({

        id:
            Date.now(),

        userId:
            currentUser.id,

        action:
            action,

        description:
            description,

        createdAt:
            new Date()
                .toISOString()

    });


    saveDB();

}


/* ================================
   TRANSACTIONS
================================ */

function userTransactionsToday() {

    return db.transactions.filter(
        transaction =>

            transaction.date ===
            todayISO()

            &&

            Number(
                transaction.cashierId
            ) ===
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


function cashSalesToday() {

    return validTransactionsToday()

        .filter(
            transaction =>
                String(
                    transaction.paymentMethod
                ).toUpperCase() ===
                "TUNAI"
        )

        .reduce(
            (total, transaction) =>

                total +
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
                ).toUpperCase() !==
                "TUNAI"
        )

        .reduce(
            (total, transaction) =>

                total +
                Number(
                    transaction.total || 0
                ),

            0
        );

}


/* ================================
   CLOSINGS
================================ */

function closingsToday() {

    return db.closings.filter(
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
                    closing.userId
                    ??
                    closing.cashierId
                ) ===
                Number(
                    currentUser.id
                )
        );

}


/* ================================
   ROLE
================================ */

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


    document
        .getElementById(
            "tanggalHariIni"
        )
        .textContent =
        new Date()
            .toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );


    const ownerOnlyMenus =
        document.querySelectorAll(
            ".owner-only"
        );


    if (
        currentUser.role ===
        "KASIR"
    ) {

        ownerOnlyMenus.forEach(
            menu => {

                menu.style.display =
                    "none";

            }
        );

    }

}


/* ================================
   SUMMARY
================================ */

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


/* ================================
   DIFFERENCE PREVIEW
================================ */

function updateDifferencePreview() {

    const physicalInput =
        document
            .getElementById(
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
            formatRupiah(0);


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


/* ================================
   CLOSING STATUS
================================ */

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


/* ================================
   MESSAGE
================================ */

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
        type === "success"
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


/* ================================
   SAVE CLOSING
================================ */

function saveClosing(event) {

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
        physicalCash < 0
        ||
        Number.isNaN(
            physicalCash
        )
    ) {

        showMessage(
            "Kas fisik tidak valid.",
            "error"
        );

        return;

    }


    const systemCash =
        cashSalesToday();


    const cashDifference =
        physicalCash -
        systemCash;


    let status =
        "SESUAI";


    if (
        cashDifference < 0
    ) {

        status =
            "KURANG";

    }

    else if (
        cashDifference > 0
    ) {

        status =
            "LEBIH";

    }


    const closing = {

        id:
            Date.now(),

        date:
            todayISO(),

        createdAt:
            new Date()
                .toISOString(),

        userId:
            currentUser.id,

        cashierId:
            currentUser.id,

        transactionCount:
            validTransactionsToday()
                .length,

        voidCount:
            voidTransactionsToday()
                .length,

        cashSales:
            systemCash,

        nonCashSales:
            nonCashSalesToday(),

        systemCash:
            systemCash,

        actualCash:
            physicalCash,

        cashDifference:
            cashDifference,

        status:
            status,

        notes:
            notes

    };


    db.closings.push(
        closing
    );


    saveDB();


    addAudit(
        "CREATE_CLOSING",
        `Closing ${currentUser.name} - sistem ${formatRupiah(
            systemCash
        )} - fisik ${formatRupiah(
            physicalCash
        )} - selisih ${formatRupiah(
            cashDifference
        )}`
    );


    showMessage(
        "Closing berhasil disimpan.",
        "success"
    );


    renderClosingTable();

    renderClosingStatus();

}


/* ================================
   TABLE
================================ */

function renderClosingTable() {

    const table =
        document.getElementById(
            "closingTable"
        );


    table.innerHTML = "";


    const records =
        [...closingsToday()]
        .sort(
            (a, b) =>

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
                    closing.userId
                    ??
                    closing.cashierId
                );


            const time =
                new Date(
                    closing.createdAt
                )
                .toLocaleTimeString(
                    "id-ID",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit"
                    }
                );


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
                    ${user?.name || "-"}
                </td>

                <td>
                    ${formatRupiah(
                        closing.systemCash
                        ??
                        closing.cashSales
                        ??
                        0
                    )}
                </td>

                <td>
                    ${formatRupiah(
                        closing.actualCash ||
                        0
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


/* ================================
   EVENTS
================================ */

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


/* ================================
   STORAGE UPDATE
================================ */

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key ===
            STORAGE_KEY
        ) {

            location.reload();

        }

    }
);


/* ================================
   LOGOUT
================================ */

function logout() {

    localStorage.removeItem(
        SESSION_KEY
    );


    window.location.href =
        "../index.html";

}


/* ================================
   INITIAL
================================ */

renderUser();

renderSummary();

renderClosingTable();

updateDifferencePreview();

renderClosingStatus();