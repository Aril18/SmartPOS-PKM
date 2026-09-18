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
// MENU AWAL
// ==========================================

const DEFAULT_MENUS = [
    {
        id: 1,
        code: "M001",
        name: "Nasi Babi Campur",
        category: "Paket Nasi",
        price: 25000,
        portionUsage: 1,
        status: "TERSEDIA"
    },
    {
        id: 2,
        code: "M002",
        name: "Nasi Babi Spesial",
        category: "Paket Nasi",
        price: 35000,
        portionUsage: 1.5,
        status: "TERSEDIA"
    },
    {
        id: 3,
        code: "M003",
        name: "Paket Babi Guling Komplit",
        category: "Paket Nasi",
        price: 45000,
        portionUsage: 2,
        status: "TERSEDIA"
    },
    {
        id: 4,
        code: "M004",
        name: "Tambahan Daging Babi",
        category: "Daging & Lauk",
        price: 15000,
        portionUsage: 0.5,
        status: "TERSEDIA"
    },
    {
        id: 5,
        code: "M005",
        name: "Babi Kecap",
        category: "Daging & Lauk",
        price: 15000,
        portionUsage: 0.5,
        status: "TERSEDIA"
    },
    {
        id: 6,
        code: "M006",
        name: "Sate Babi",
        category: "Daging & Lauk",
        price: 10000,
        portionUsage: 0.25,
        status: "TERSEDIA"
    },
    {
        id: 7,
        code: "M007",
        name: "Kulit Babi Crispy",
        category: "Gorengan",
        price: 10000,
        portionUsage: 0.25,
        status: "TERSEDIA"
    },
    {
        id: 8,
        code: "M008",
        name: "Gorengan Babi",
        category: "Gorengan",
        price: 8000,
        portionUsage: 0.25,
        status: "TERSEDIA"
    },
    {
        id: 9,
        code: "M009",
        name: "Lawar",
        category: "Sayur & Pendamping",
        price: 7000,
        portionUsage: 0,
        status: "TERSEDIA"
    },
    {
        id: 10,
        code: "M010",
        name: "Sayur Urab",
        category: "Sayur & Pendamping",
        price: 5000,
        portionUsage: 0,
        status: "TERSEDIA"
    }
];


// ==========================================
// ISI MENU JIKA MASIH KOSONG
// ==========================================

if (db.menus.length === 0) {

    db.menus =
        JSON.parse(
            JSON.stringify(DEFAULT_MENUS)
        );

    saveDB();
}


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

    return number.toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
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
// RINGKASAN MENU
// ==========================================

function renderSummary() {

    const totalMenu =
        db.menus.length;

    const available =
        db.menus.filter(
            menu =>
                menu.status === "TERSEDIA"
        ).length;

    const unavailable =
        db.menus.filter(
            menu =>
                menu.status === "TIDAK TERSEDIA"
        ).length;


    document
        .getElementById("totalMenu")
        .textContent =
        totalMenu;


    document
        .getElementById("menuTersedia")
        .textContent =
        available;


    document
        .getElementById("menuTidakTersedia")
        .textContent =
        unavailable;
}


// ==========================================
// TAMPILKAN MENU
// ==========================================

function renderMenuTable(keyword = "") {

    const menuTable =
        document.getElementById("menuTable");


    menuTable.innerHTML = "";


    const search =
        keyword
            .toLowerCase()
            .trim();


    const menus =
        db.menus.filter(
            menu => {

                return (
                    menu.code
                        .toLowerCase()
                        .includes(search)
                    ||
                    menu.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    menu.category
                        .toLowerCase()
                        .includes(search)
                );
            }
        );


    if (menus.length === 0) {

        menuTable.innerHTML = `
            <tr>
                <td colspan="7">
                    Menu tidak ditemukan.
                </td>
            </tr>
        `;

        return;
    }


    menus.forEach(menu => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${menu.code}
            </td>

            <td>
                ${menu.name}
            </td>

            <td>
                ${menu.category}
            </td>

            <td>
                ${formatRupiah(menu.price)}
            </td>

            <td>
                ${formatPortion(menu.portionUsage)} Porsi
            </td>

            <td>
                <span
                    class="status ${
                        menu.status === "TERSEDIA"
                            ? "available"
                            : "unavailable"
                    }"
                >
                    ${menu.status}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="edit-button"
                    onclick="editMenu(${menu.id})"
                >
                    Edit
                </button>
            </td>
        `;


        menuTable.appendChild(
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
// SIMPAN MENU
// ==========================================

function saveMenu(event) {

    event.preventDefault();


    const menuId =
        document
            .getElementById("menuId")
            .value;


    const menuCode =
        document
            .getElementById("menuCode")
            .value
            .trim();


    const menuName =
        document
            .getElementById("menuName")
            .value
            .trim();


    const menuCategory =
        document
            .getElementById("menuCategory")
            .value;


    const menuPrice =
        Number(
            document
                .getElementById("menuPrice")
                .value
        );


    const portionUsage =
        Number(
            document
                .getElementById("portionUsage")
                .value
        );


    const menuStatus =
        document
            .getElementById("menuStatus")
            .value;


    if (
        !menuCode ||
        !menuName ||
        !menuCategory ||
        menuPrice < 0 ||
        portionUsage < 0
    ) {

        alert(
            "Lengkapi data menu dengan benar."
        );

        return;
    }


    const duplicate =
        db.menus.find(
            item =>
                item.code.toLowerCase() ===
                    menuCode.toLowerCase()
                &&
                Number(item.id) !==
                    Number(menuId)
        );


    if (duplicate) {

        alert(
            "Kode menu sudah digunakan."
        );

        return;
    }


    if (menuId) {

        const menu =
            db.menus.find(
                item =>
                    Number(item.id) ===
                    Number(menuId)
            );


        if (!menu) {
            return;
        }


        menu.code =
            menuCode;

        menu.name =
            menuName;

        menu.category =
            menuCategory;

        menu.price =
            menuPrice;

        menu.portionUsage =
            portionUsage;

        menu.status =
            menuStatus;


        addAudit(
            "UPDATE MENU",
            `Mengubah menu ${menuName}`,
            currentUser.id
        );


        alert(
            "Menu berhasil diperbarui."
        );

    } else {

        const menu = {

            id:
                Date.now(),

            code:
                menuCode,

            name:
                menuName,

            category:
                menuCategory,

            price:
                menuPrice,

            portionUsage:
                portionUsage,

            status:
                menuStatus

        };


        db.menus.push(
            menu
        );


        addAudit(
            "TAMBAH MENU",
            `Menambahkan menu ${menuName}`,
            currentUser.id
        );


        alert(
            "Menu berhasil ditambahkan."
        );
    }


    saveDB();

    resetForm();

    renderSummary();

    renderMenuTable();
}


// ==========================================
// EDIT MENU
// ==========================================

function editMenu(menuId) {

    const menu =
        db.menus.find(
            item =>
                Number(item.id) ===
                Number(menuId)
        );


    if (!menu) {
        return;
    }


    document
        .getElementById("menuId")
        .value =
        menu.id;


    document
        .getElementById("menuCode")
        .value =
        menu.code;


    document
        .getElementById("menuName")
        .value =
        menu.name;


    document
        .getElementById("menuCategory")
        .value =
        menu.category;


    document
        .getElementById("menuPrice")
        .value =
        menu.price;


    document
        .getElementById("portionUsage")
        .value =
        menu.portionUsage;


    document
        .getElementById("menuStatus")
        .value =
        menu.status;


    document
        .getElementById("formTitle")
        .textContent =
        "Edit Menu";


    document
        .getElementById("cancelButton")
        .style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    document
        .getElementById("menuForm")
        .reset();


    document
        .getElementById("menuId")
        .value =
        "";


    document
        .getElementById("formTitle")
        .textContent =
        "Tambah Menu";


    document
        .getElementById("menuStatus")
        .value =
        "TERSEDIA";


    document
        .getElementById("cancelButton")
        .style.display =
        "none";
}


// ==========================================
// BATAL EDIT
// ==========================================

function cancelEdit() {

    resetForm();
}


// ==========================================
// SEARCH
// ==========================================

const searchMenu =
    document.getElementById("searchMenu");


searchMenu.addEventListener(
    "input",
    function () {

        renderMenuTable(
            this.value
        );
    }
);


// ==========================================
// FORM
// ==========================================

const menuForm =
    document.getElementById("menuForm");


menuForm.addEventListener(
    "submit",
    saveMenu
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
// JALANKAN HALAMAN
// ==========================================

document
    .getElementById("cancelButton")
    .style.display =
    "none";


renderUser();

renderSummary();

renderMenuTable();