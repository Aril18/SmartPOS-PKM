const SESSION_KEY =
    "umkmControlSessionV1";

const API_URL =
    "http://localhost:3000";


/* =========================================
   SESSION
========================================= */

let currentUser =
    JSON.parse(
        localStorage.getItem(
            SESSION_KEY
        ) || "null"
    );


/* =========================================
   DATA PEGAWAI DARI MYSQL
========================================= */

let users = [];


/* =========================================
   CEK LOGIN
========================================= */

if (!currentUser) {

    window.location.href =
        "../index.html";

}


/* =========================================
   CEK ROLE
========================================= */

if (
    currentUser &&
    currentUser.role !== "OWNER"
) {

    window.location.href =
        "../pos/index.html";

}


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
   LOAD USERS DARI MYSQL
========================================= */

async function loadUsers() {

    try {

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
            "✅ USERS MYSQL:",
            users
        );


        renderSummary();

        renderEmployeeTable(
            document
                .getElementById(
                    "searchEmployee"
                )
                ?.value || ""
        );

    }

    catch (error) {

        console.error(
            "❌ Gagal mengambil users:",
            error
        );


        alert(
            error.message ||
            "Gagal mengambil data pegawai."
        );

    }

}


/* =========================================
   TAMPILKAN USER LOGIN
========================================= */

function renderUser() {

    if (!currentUser) {

        return;

    }


    const namaUser =
        document.getElementById(
            "namaUser"
        );


    const sidebarUser =
        document.getElementById(
            "sidebarUser"
        );


    if (namaUser) {

        namaUser.textContent =
            currentUser.name;

    }


    if (sidebarUser) {

        sidebarUser.textContent =
            currentUser.name;

    }

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const totalPegawai =
        users.length;


    const pegawaiAktif =
        users.filter(

            user =>
                user.status ===
                "AKTIF"

        ).length;


    const totalKasir =
        users.filter(

            user =>
                user.role ===
                "KASIR"

        ).length;


    const totalOwner =
        users.filter(

            user =>
                user.role ===
                "OWNER"

        ).length;


    document
        .getElementById(
            "totalPegawai"
        )
        .textContent =
        totalPegawai;


    document
        .getElementById(
            "pegawaiAktif"
        )
        .textContent =
        pegawaiAktif;


    document
        .getElementById(
            "totalKasir"
        )
        .textContent =
        totalKasir;


    document
        .getElementById(
            "totalOwner"
        )
        .textContent =
        totalOwner;

}


/* =========================================
   TAMPILKAN TABEL PEGAWAI
========================================= */

function renderEmployeeTable(
    keyword = ""
) {

    const employeeTable =
        document.getElementById(
            "employeeTable"
        );


    employeeTable.innerHTML =
        "";


    const search =
        String(
            keyword || ""
        )
            .toLowerCase()
            .trim();


    const filteredUsers =
        users.filter(

            user => {

                return (

                    String(
                        user.id
                    )
                        .includes(
                            search
                        )

                    ||

                    String(
                        user.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    String(
                        user.username || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    String(
                        user.role || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    String(
                        user.status || ""
                    )
                        .toLowerCase()
                        .includes(
                            search
                        )

                );

            }

        );


    if (
        filteredUsers.length ===
        0
    ) {

        employeeTable.innerHTML = `

            <tr>

                <td colspan="6">
                    Data pegawai tidak ditemukan.
                </td>

            </tr>

        `;


        return;

    }


    filteredUsers.forEach(

        user => {

            const row =
                document.createElement(
                    "tr"
                );


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
                            user.status ===
                            "AKTIF"

                                ?

                                "active"

                                :

                                "inactive"
                        }"
                    >
                        ${user.status}
                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="edit-button"
                        onclick="editEmployee(
                            ${user.id}
                        )"
                    >
                        Edit
                    </button>

                </td>

            `;


            employeeTable.appendChild(
                row
            );

        }

    );

}


/* =========================================
   SIMPAN PEGAWAI
========================================= */

async function saveEmployee(
    event
) {

    event.preventDefault();


    const employeeId =
        document
            .getElementById(
                "employeeId"
            )
            .value;


    const employeeName =
        document
            .getElementById(
                "employeeName"
            )
            .value
            .trim();


    const employeeUsername =
        document
            .getElementById(
                "employeeUsername"
            )
            .value
            .trim();


    const employeePassword =
        document
            .getElementById(
                "employeePassword"
            )
            .value;


    const employeeRole =
        document
            .getElementById(
                "employeeRole"
            )
            .value;


    const employeeStatus =
        document
            .getElementById(
                "employeeStatus"
            )
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


    /* =========================================
       JANGAN NONAKTIFKAN AKUN SENDIRI
    ========================================= */

    if (
        employeeId &&
        Number(employeeId) ===
        Number(currentUser.id) &&
        employeeStatus ===
        "NONAKTIF"
    ) {

        alert(
            "Akun yang sedang digunakan tidak dapat dinonaktifkan."
        );


        return;

    }


    const saveButton =
        document.querySelector(
            ".save-button"
        );


    const originalButtonText =
        saveButton.textContent;


    try {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Menyimpan...";


        /* =========================================
           EDIT PEGAWAI
        ========================================= */

        if (employeeId) {

            await apiRequest(
                `/api/users/${employeeId}`,
                {

                    method:
                        "PATCH",

                    body:
                        JSON.stringify({

                            name:
                                employeeName,

                            username:
                                employeeUsername,

                            role:
                                employeeRole,

                            status:
                                employeeStatus

                        })

                }
            );


            /* =========================================
               UPDATE PASSWORD JIKA DIISI
            ========================================= */

            if (
                employeePassword
            ) {

                await apiRequest(
                    `/api/users/${employeeId}/password`,
                    {

                        method:
                            "PATCH",

                        body:
                            JSON.stringify({

                                password:
                                    employeePassword

                            })

                    }
                );

            }


            /* =========================================
               JIKA EDIT AKUN SENDIRI
            ========================================= */

            if (
                Number(employeeId) ===
                Number(currentUser.id)
            ) {

                currentUser = {

                    ...currentUser,

                    name:
                        employeeName,

                    username:
                        employeeUsername,

                    role:
                        employeeRole,

                    status:
                        employeeStatus

                };


                localStorage.setItem(
                    SESSION_KEY,
                    JSON.stringify(
                        currentUser
                    )
                );


                /*
                 * Kalau owner mengubah dirinya
                 * menjadi kasir, hak akses owner
                 * langsung dicabut.
                 */

                if (
                    employeeRole !==
                    "OWNER"
                ) {

                    alert(
                        "Data akun berhasil diperbarui. Role akun Anda sekarang KASIR."
                    );


                    window.location.href =
                        "../pos/index.html";


                    return;

                }

            }


            alert(
                employeePassword

                    ?

                    "Data dan password pegawai berhasil diperbarui."

                    :

                    "Data pegawai berhasil diperbarui."
            );

        }


        /* =========================================
           TAMBAH PEGAWAI
        ========================================= */

        else {

            if (
                !employeePassword
            ) {

                alert(
                    "Password pegawai baru harus diisi."
                );


                return;

            }


            await apiRequest(
                "/api/users",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

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

                        })

                }
            );


            alert(
                "Pegawai berhasil ditambahkan."
            );

        }


        /* =========================================
           REFRESH DARI MYSQL
        ========================================= */

        resetForm();

        renderUser();

        await loadUsers();

    }

    catch (error) {

        console.error(
            "❌ Simpan Pegawai Error:",
            error
        );


        alert(
            error.message ||
            "Gagal menyimpan data pegawai."
        );

    }

    finally {

        saveButton.disabled =
            false;


        saveButton.textContent =
            originalButtonText;

    }

}


/* =========================================
   EDIT PEGAWAI
========================================= */

function editEmployee(
    employeeId
) {

    const user =
        users.find(

            item =>
                Number(
                    item.id
                )
                ===
                Number(
                    employeeId
                )

        );


    if (!user) {

        alert(
            "Data pegawai tidak ditemukan."
        );


        return;

    }


    document
        .getElementById(
            "employeeId"
        )
        .value =
        user.id;


    document
        .getElementById(
            "employeeName"
        )
        .value =
        user.name;


    document
        .getElementById(
            "employeeUsername"
        )
        .value =
        user.username;


    document
        .getElementById(
            "employeePassword"
        )
        .value =
        "";


    document
        .getElementById(
            "employeeRole"
        )
        .value =
        user.role;


    document
        .getElementById(
            "employeeStatus"
        )
        .value =
        user.status;


    document
        .getElementById(
            "formTitle"
        )
        .textContent =
        "Edit Pegawai";


    document
        .getElementById(
            "passwordHelp"
        )
        .textContent =
        "Kosongkan password jika tidak ingin mengubahnya.";


    document
        .getElementById(
            "cancelButton"
        )
        .style.display =
        "inline-block";


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================
   RESET FORM
========================================= */

function resetForm() {

    document
        .getElementById(
            "employeeForm"
        )
        .reset();


    document
        .getElementById(
            "employeeId"
        )
        .value =
        "";


    document
        .getElementById(
            "formTitle"
        )
        .textContent =
        "Tambah Pegawai";


    document
        .getElementById(
            "employeeRole"
        )
        .value =
        "KASIR";


    document
        .getElementById(
            "employeeStatus"
        )
        .value =
        "AKTIF";


    document
        .getElementById(
            "passwordHelp"
        )
        .textContent =
        "Password wajib untuk pegawai baru.";


    document
        .getElementById(
            "cancelButton"
        )
        .style.display =
        "none";

}


/* =========================================
   BATAL EDIT
========================================= */

function cancelEdit() {

    resetForm();

}


/* =========================================
   SEARCH
========================================= */

const searchEmployee =
    document.getElementById(
        "searchEmployee"
    );


searchEmployee.addEventListener(

    "input",

    function () {

        renderEmployeeTable(
            this.value
        );

    }

);


/* =========================================
   FORM
========================================= */

const employeeForm =
    document.getElementById(
        "employeeForm"
    );


employeeForm.addEventListener(
    "submit",
    saveEmployee
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

async function initializeEmployeePage() {

    document
        .getElementById(
            "cancelButton"
        )
        .style.display =
        "none";


    renderUser();


    await loadUsers();

}


initializeEmployeePage();