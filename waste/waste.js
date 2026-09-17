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

db.menus =
    db.menus || [];

db.production =
    db.production || [];

db.transactions =
    db.transactions || [];

db.waste =
    db.waste || [];

db.auditLogs =
    db.auditLogs || [];


/* ================================
   BASIC FUNCTIONS
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


function formatPortion(value) {

    const number =
        Number(value || 0);

    if (
        Number.isInteger(number)
    ) {
        return number;
    }

    return number.toFixed(1);

}


function getUser(userId) {

    return db.users.find(
        user =>
            Number(user.id) ===
            Number(userId)
    );

}


function getMenu(menuId) {

    return db.menus.find(
        menu =>
            Number(menu.id) ===
            Number(menuId)
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
   STOCK
================================ */

function initialStockToday() {

    return db.production

        .filter(
            item =>
                item.date ===
                todayISO()
        )

        .reduce(
            (total, item) =>

                total +
                Number(
                    item.estimatedPortion ||
                    0
                ),

            0
        );

}


function soldPortionsToday() {

    return db.transactions

        .filter(
            transaction =>

                transaction.date ===
                todayISO()

                &&

                transaction.status !==
                "VOID"
        )

        .reduce(
            (total, transaction) => {

                return total +

                    (
                        transaction.items ||
                        []
                    )
                    .reduce(
                        (
                            subtotal,
                            item
                        ) => {

                            const menu =
                                getMenu(
                                    item.menuId
                                );


                            const usage =
                                Number(

                                    item
                                        .portionUsageAtSale
                                    ??
                                    menu
                                        ?.portionUsage
                                    ??
                                    0

                                );


                            return (
                                subtotal
                                +
                                Number(
                                    item.quantity ||
                                    0
                                )
                                *
                                usage
                            );

                        },

                        0
                    );

            },

            0
        );

}


function todayWaste() {

    return db.waste.filter(
        item =>
            item.date ===
            todayISO()
    );

}


function wastePortionsToday() {

    return todayWaste().reduce(
        (total, item) =>

            total
            +
            (
                Number(
                    item.quantity || 0
                )
                *
                Number(
                    item.portionUsage ??
                    1
                )
            ),

        0
    );

}


function stockBeforeWaste() {

    return (
        initialStockToday()
        -
        soldPortionsToday()
    );

}


function expectedStockToday() {

    return (
        stockBeforeWaste()
        -
        wastePortionsToday()
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
   MENU SELECT
================================ */

function renderMenuOptions() {

    const select =
        document.getElementById(
            "wasteItem"
        );


    db.menus

        .filter(
            menu =>
                menu.status ===
                "TERSEDIA"
        )

        .forEach(
            menu => {

                const option =
                    document
                        .createElement(
                            "option"
                        );


                option.value =
                    menu.id;


                option.textContent =
                    `${menu.name} — ${formatPortion(
                        menu.portionUsage
                    )} porsi/unit`;


                select.appendChild(
                    option
                );

            }
        );

}


/* ================================
   STOCK IMPACT
================================ */

function selectedPortionUsage() {

    const selected =
        document
            .getElementById(
                "wasteItem"
            )
            .value;


    if (
        selected ===
        "GENERAL_STOCK"
    ) {

        return 1;

    }


    const menu =
        getMenu(selected);


    return Number(
        menu?.portionUsage || 0
    );

}


function updateStockImpact() {

    const quantity =
        Number(
            document
                .getElementById(
                    "quantity"
                )
                .value || 0
        );


    const impact =
        quantity
        *
        selectedPortionUsage();


    document
        .getElementById(
            "stockImpact"
        )
        .textContent =
        `${formatPortion(
            impact
        )} Porsi`;

}


/* ================================
   SUMMARY
================================ */

function renderSummary() {

    document
        .getElementById(
            "wasteHariIni"
        )
        .textContent =
        `${formatPortion(
            wastePortionsToday()
        )} Porsi`;


    document
        .getElementById(
            "jumlahWaste"
        )
        .textContent =
        todayWaste().length;


    document
        .getElementById(
            "stokSebelumWaste"
        )
        .textContent =
        `${formatPortion(
            stockBeforeWaste()
        )} Porsi`;


    document
        .getElementById(
            "stokTersisa"
        )
        .textContent =
        `${formatPortion(
            expectedStockToday()
        )} Porsi`;


    document
        .getElementById(
            "stokSistem"
        )
        .textContent =
        `${formatPortion(
            expectedStockToday()
        )} Porsi`;

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

    } else {

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
   SAVE WASTE
================================ */

function saveWaste(event) {

    event.preventDefault();


    const itemValue =
        document
            .getElementById(
                "wasteItem"
            )
            .value;


    const quantity =
        Number(
            document
                .getElementById(
                    "quantity"
                )
                .value
        );


    let reason =
        document
            .getElementById(
                "reason"
            )
            .value;


    const notes =
        document
            .getElementById(
                "notes"
            )
            .value
            .trim();


    if (
        !itemValue ||
        !quantity ||
        quantity <= 0 ||
        !reason
    ) {

        showMessage(
            "Data waste belum lengkap.",
            "error"
        );

        return;

    }


    if (
        reason === "Lainnya"
    ) {

        const customReason =
            document
                .getElementById(
                    "customReason"
                )
                .value
                .trim();


        if (!customReason) {

            showMessage(
                "Alasan lainnya wajib diisi.",
                "error"
            );

            return;

        }


        reason =
            customReason;

    }


    const portionUsage =
        selectedPortionUsage();


    const stockImpact =
        quantity *
        portionUsage;


    if (
        stockImpact >
        expectedStockToday()
    ) {

        showMessage(
            `Waste melebihi stok tersedia. Stok saat ini ${formatPortion(
                expectedStockToday()
            )} porsi.`,
            "error"
        );

        return;

    }


    let menuId = null;

    let itemName =
        "Stok Daging / Porsi Umum";


    if (
        itemValue !==
        "GENERAL_STOCK"
    ) {

        const menu =
            getMenu(
                itemValue
            );


        menuId =
            menu.id;


        itemName =
            menu.name;

    }


    const wasteRecord = {

        id:
            Date.now(),

        date:
            todayISO(),

        createdAt:
            new Date()
                .toISOString(),

        userId:
            currentUser.id,

        menuId:
            menuId,

        itemName:
            itemName,

        quantity:
            quantity,

        portionUsage:
            portionUsage,

        reason:
            reason,

        notes:
            notes

    };


    db.waste.push(
        wasteRecord
    );


    saveDB();


    addAudit(
        "CREATE_WASTE",
        `${itemName} - ${formatPortion(
            stockImpact
        )} porsi - ${reason}`
    );


    showMessage(
        "Waste berhasil dicatat.",
        "success"
    );


    document
        .getElementById(
            "wasteForm"
        )
        .reset();


    document
        .getElementById(
            "customReasonGroup"
        )
        .style.display =
        "none";


    updateStockImpact();

    renderSummary();

    renderWasteTable();

}


/* ================================
   TABLE
================================ */

function renderWasteTable() {

    const table =
        document.getElementById(
            "wasteTable"
        );


    table.innerHTML = "";


    const records =
        [...todayWaste()]
        .sort(
            (a, b) =>

                new Date(
                    b.createdAt
                )
                -
                new Date(
                    a.createdAt
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

                    Belum ada waste hari ini.

                </td>

            </tr>

        `;

        return;

    }


    records.forEach(
        record => {

            const user =
                getUser(
                    record.userId
                );


            const time =
                new Date(
                    record.createdAt
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


            const impact =
                Number(
                    record.quantity
                )
                *
                Number(
                    record.portionUsage ??
                    1
                );


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
                    ${record.itemName || "-"}
                </td>

                <td>
                    ${formatPortion(
                        record.quantity
                    )}
                </td>

                <td>
                    ${formatPortion(
                        impact
                    )} Porsi
                </td>

                <td>
                    ${record.reason || "-"}
                </td>

                <td>
                    ${record.notes || "-"}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* ================================
   REASON
================================ */

document
    .getElementById(
        "reason"
    )
    .addEventListener(
        "change",
        function () {

            document
                .getElementById(
                    "customReasonGroup"
                )
                .style.display =

                this.value ===
                "Lainnya"

                    ? "flex"

                    : "none";

        }
    );


/* ================================
   STOCK IMPACT EVENTS
================================ */

document
    .getElementById(
        "wasteItem"
    )
    .addEventListener(
        "change",
        updateStockImpact
    );


document
    .getElementById(
        "quantity"
    )
    .addEventListener(
        "input",
        updateStockImpact
    );


/* ================================
   SUBMIT
================================ */

document
    .getElementById(
        "wasteForm"
    )
    .addEventListener(
        "submit",
        saveWaste
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

renderMenuOptions();

renderSummary();

renderWasteTable();

updateStockImpact();