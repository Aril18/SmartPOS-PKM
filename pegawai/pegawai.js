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
// TAMPILKAN USER
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

    const totalPegawai =
        db.users.length;


    const pegawaiAktif =
        db.users.filter(
            user =>
                user.status === "AKTIF"
        ).length;


    const totalKasir =
        db.users.filter(
            user =>
                user.role === "KASIR"
        ).length;


    const totalOwner =
        db.users.filter(
            user =>
                user.role === "OWNER"
        ).length;


    document
        .getElementById("totalPegawai")
        .textContent =
        totalPegawai;


    document
        .getElementById("pegawaiAktif")
        .textContent =
        pegawaiAktif;


    document
        .getElementById("totalKasir")
        .textContent =
        totalKasir;


    document
        .getElementById("totalOwner")
        .textContent =
        totalOwner;
}


// ==========================================
// TAMPILKAN TABEL PEGAWAI
// ==========================================

function renderEmployeeTable(keyword = "") {

    const employeeTable =
        document.getElementById("employeeTable");


    employeeTable.innerHTML =
        "";


    const search =
        keyword
            .toLowerCase()
            .trim();


    const users =
        db.users.filter(
            user => {

                return (
                    String(user.id)
                        .includes(search)
                    ||
                    user.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    user.username
                        .toLowerCase()
                        .includes(search)
                    ||
                    user.role
                        .toLowerCase()
                        .includes(search)
                );
            }
        );


    if (users.length === 0) {

        employeeTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Data pegawai tidak ditemukan.
                </td>
            </tr>
        `;

        return;
    }


    users.forEach(user => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${user.id}
            </td>

            <td>
                ${user.name}
            </td>

            <td>
                ${user.username}
            </td>

            <td>
                <span class="role-badge">
                    ${user.role}
                </span>
            </td>

            <td>
                <span
                    class="status ${
                        user.status === "AKTIF"
                            ? "active"
                            : "inactive"
                    }"
                >
                    ${user.status}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="edit-button"
                    onclick="editEmployee(${user.id})"
                >
                    Edit
                </button>

            </td>
        `;


        employeeTable.appendChild(
            row
        );
    });
}


// ==========================================
// GENERATE ID
// ==========================================

function generateEmployeeId() {

    if (db.users.length === 0) {
        return 1;
    }


    const ids =
        db.users.map(
            user =>
                Number(user.id || 0)
        );


    return (
        Math.max(...ids) + 1
    );
}


// ==========================================
// SIMPAN PEGAWAI
// ==========================================

function saveEmployee(event) {

    event.preventDefault();


    const employeeId =
        document
            .getElementById("employeeId")
            .value;


    const employeeName =
        document
            .getElementById("employeeName")
            .value
            .trim();


    const employeeUsername =
        document
            .getElementById("employeeUsername")
            .value
            .trim();


    const employeePassword =
        document
            .getElementById("employeePassword")
            .value;


    const employeeRole =
        document
            .getElementById("employeeRole")
            .value;


    const employeeStatus =
        document
            .getElementById("employeeStatus")
            .value;


    if (
        !employeeName ||
        !employeeUsername ||
        !employeeRole ||
        !employeeStatus
    ) {

        alert(
            "Lengkapi data pegawai terlebih dahulu."
        );

        return;
    }


    const duplicateUsername =
        db.users.find(
            user =>
                user.username.toLowerCase() ===
                    employeeUsername.toLowerCase()
                &&
                Number(user.id) !==
                    Number(employeeId)
        );


    if (duplicateUsername) {

        alert(
            "Username sudah digunakan."
        );

        return;
    }


    // ======================================
    // EDIT PEGAWAI
    // ======================================

    if (employeeId) {

        const user =
            db.users.find(
                item =>
                    Number(item.id) ===
                    Number(employeeId)
            );


        if (!user) {
            return;
        }


        if (
            Number(user.id) ===
                Number(currentUser.id)
            &&
            employeeStatus === "NONAKTIF"
        ) {

            alert(
                "Akun yang sedang digunakan tidak dapat dinonaktifkan."
            );

            return;
        }


        user.name =
            employeeName;

        user.username =
            employeeUsername;

        user.role =
            employeeRole;

        user.status =
            employeeStatus;


        if (employeePassword) {

            user.password =
                employeePassword;
        }


        addAudit(
            "UPDATE PEGAWAI",
            `Mengubah data pegawai ${employeeName}`,
            currentUser.id
        );


        if (
            Number(user.id) ===
            Number(currentUser.id)
        ) {

            currentUser = user;


            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(user)
            );
        }


        alert(
            "Data pegawai berhasil diperbarui."
        );

    }


    // ======================================
    // TAMBAH PEGAWAI
    // ======================================

    else {

        if (!employeePassword) {

            alert(
                "Password pegawai baru harus diisi."
            );

            return;
        }


        const user = {

            id:
                generateEmployeeId(),

            name:
                employeeName,

            username:
                employeeUsername,

            password:
                employeePassword,

            role:
                employeeRole,

            status:
                employeeStatus

        };


        db.users.push(
            user
        );


        addAudit(
            "TAMBAH PEGAWAI",
            `Menambahkan pegawai ${employeeName}`,
            currentUser.id
        );


        alert(
            "Pegawai berhasil ditambahkan."
        );
    }


    saveDB();

    resetForm();

    renderUser();

    renderSummary();

    renderEmployeeTable();
}


// ==========================================
// EDIT PEGAWAI
// ==========================================

function editEmployee(employeeId) {

    const user =
        db.users.find(
            item =>
                Number(item.id) ===
                Number(employeeId)
        );


    if (!user) {
        return;
    }


    document
        .getElementById("employeeId")
        .value =
        user.id;


    document
        .getElementById("employeeName")
        .value =
        user.name;


    document
        .getElementById("employeeUsername")
        .value =
        user.username;


    document
        .getElementById("employeePassword")
        .value =
        "";


    document
        .getElementById("employeeRole")
        .value =
        user.role;


    document
        .getElementById("employeeStatus")
        .value =
        user.status;


    document
        .getElementById("formTitle")
        .textContent =
        "Edit Pegawai";


    document
        .getElementById("passwordHelp")
        .textContent =
        "Kosongkan password jika tidak ingin mengubahnya.";


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
        .getElementById("employeeForm")
        .reset();


    document
        .getElementById("employeeId")
        .value =
        "";


    document
        .getElementById("formTitle")
        .textContent =
        "Tambah Pegawai";


    document
        .getElementById("employeeRole")
        .value =
        "KASIR";


    document
        .getElementById("employeeStatus")
        .value =
        "AKTIF";


    document
        .getElementById("passwordHelp")
        .textContent =
        "Password wajib untuk pegawai baru.";


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

const searchEmployee =
    document.getElementById("searchEmployee");


searchEmployee.addEventListener(
    "input",
    function () {

        renderEmployeeTable(
            this.value
        );
    }
);


// ==========================================
// FORM
// ==========================================

const employeeForm =
    document.getElementById("employeeForm");


employeeForm.addEventListener(
    "submit",
    saveEmployee
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

renderEmployeeTable();