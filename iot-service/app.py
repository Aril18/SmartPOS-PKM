from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import requests


app = FastAPI(
    title="SmartPOS IoT Prototype Simulator",
    version="2.0.0"
)


NODE_API = "http://localhost:3000"


# =========================================================
# REQUEST MODEL
# =========================================================

class SimulationRequest(BaseModel):

    validation_id: int = Field(gt=0)

    detected_count: int = Field(ge=0)

    confidence: float = Field(
        default=0.95,
        ge=0,
        le=1
    )


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup_message():

    print()

    print(
        "========================================="
    )

    print(
        " SMARTPOS IOT PROTOTYPE SIMULATOR"
    )

    print(
        "========================================="
    )

    print(
        f"Node API : {NODE_API}"
    )

    print(
        "Demo     : http://127.0.0.1:8000/demo"
    )

    print(
        "Mode     : MANUAL SIMULATION - 2 STATIONS"
    )

    print(
        "========================================="
    )

    print()


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {

        "success": True,

        "service":
            "SmartPOS IoT Prototype Simulator",

        "mode":
            "MANUAL SIMULATION",

        "stations": [
            "TAKEAWAY",
            "DINE_IN"
        ]

    }


# =========================================================
# GET PENDING FROM NODE
# =========================================================

def get_pending_jobs():

    try:

        response = requests.get(

            f"{NODE_API}/api/iot-validations/pending",

            timeout=5

        )


        try:

            payload = response.json()

        except ValueError:

            raise HTTPException(

                status_code=502,

                detail=
                    "Respons Node API bukan JSON."

            )


        if (
            not response.ok
            or
            not payload.get("success")
        ):

            raise HTTPException(

                status_code=response.status_code,

                detail=
                    payload.get(
                        "message",
                        "Gagal mengambil antrean validasi."
                    )

            )


        jobs = []


        for item in payload.get(
            "data",
            []
        ):


            station = str(

                item.get(
                    "validationStation"
                )

                or

                item.get(
                    "validation_station"
                )

                or

                "TAKEAWAY"

            ).upper()


            if station not in (
                "TAKEAWAY",
                "DINE_IN"
            ):

                station = "TAKEAWAY"


            jobs.append({

                "id":
                    int(
                        item.get(
                            "id",
                            0
                        )
                    ),

                "transactionId":
                    int(

                        item.get(
                            "transactionId"
                        )

                        or

                        item.get(
                            "transaction_id"
                        )

                        or

                        0

                    ),

                "transactionCode":

                    item.get(
                        "transactionCode"
                    )

                    or

                    item.get(
                        "transaction_code"
                    )

                    or

                    "-",

                "validationStation":
                    station,

                "expectedCount":
                    int(

                        item.get(
                            "expectedCount"
                        )

                        or

                        item.get(
                            "expected_count"
                        )

                        or

                        0

                    ),

                "detectedCount":

                    None

                    if (

                        item.get(
                            "detectedCount"
                        )
                        is None

                        and

                        item.get(
                            "detected_count"
                        )
                        is None

                    )

                    else

                    int(

                        item.get(
                            "detectedCount"
                        )

                        if

                        item.get(
                            "detectedCount"
                        )
                        is not None

                        else

                        item.get(
                            "detected_count"
                        )

                    ),

                "averageConfidence":

                    None

                    if (

                        item.get(
                            "averageConfidence"
                        )
                        is None

                        and

                        item.get(
                            "average_confidence"
                        )
                        is None

                    )

                    else

                    float(

                        item.get(
                            "averageConfidence"
                        )

                        if

                        item.get(
                            "averageConfidence"
                        )
                        is not None

                        else

                        item.get(
                            "average_confidence"
                        )

                    ),

                "status":
                    str(
                        item.get(
                            "status"
                        )
                        or
                        "PENDING"
                    ).upper()

            })


        return jobs


    except requests.RequestException as error:

        raise HTTPException(

            status_code=502,

            detail=
                f"Tidak dapat menghubungi Node API: {error}"

        )


# =========================================================
# API PENDING
# =========================================================

@app.get("/api/pending")
def pending():

    jobs = get_pending_jobs()


    takeaway_count = sum(

        1

        for job in jobs

        if job[
            "validationStation"
        ] == "TAKEAWAY"

    )


    dine_in_count = sum(

        1

        for job in jobs

        if job[
            "validationStation"
        ] == "DINE_IN"

    )


    return {

        "success":
            True,

        "data":
            jobs,

        "summary": {

            "total":
                len(jobs),

            "takeaway":
                takeaway_count,

            "dineIn":
                dine_in_count

        }

    }


# =========================================================
# API SIMULATE
# =========================================================

@app.post("/api/simulate")
def simulate(
    body: SimulationRequest
):

    jobs =get_pending_jobs()


    selected =next(

            (

                job

                for job in jobs

                if job["id"]
                ==
                body.validation_id

            ),

            None

        )


    if not selected:

        raise HTTPException(

            status_code=404,

            detail=
                "Validasi tidak ditemukan atau sudah selesai."

        )


    station =selected[
            "validationStation"
        ]


    unit = (

        "sajian"

        if station ==
        "DINE_IN"

        else

        "kemasan"

    )


    notes = (

        f"Prototype simulation - {station}. "

        f"Expected "
        f"{selected['expectedCount']} "
        f"{unit}, "

        f"detected "
        f"{body.detected_count} "
        f"{unit}."

    )


    try:

        response = requests.post(

            (
                f"{NODE_API}"
                f"/api/iot-validations/"
                f"{body.validation_id}"
                f"/result"
            ),

            json={

                "detectedCount":
                    body.detected_count,

                "averageConfidence":
                    body.confidence,

                "imagePath":
                    (
                        f"simulasi/"
                        f"{station.lower()}/"
                        f"validation-"
                        f"{body.validation_id}.jpg"
                    ),

                "notes":
                    notes

            },

            timeout=5

        )


        try:

            payload =response.json()

        except ValueError:

            raise HTTPException(

                status_code=502,

                detail=
                    "Respons Node API bukan JSON."

            )


        if (
            not response.ok
            or
            not payload.get(
                "success"
            )
        ):

            raise HTTPException(

                status_code=
                    response.status_code,

                detail=
                    payload.get(
                        "message",
                        "Gagal mengirim hasil simulasi."
                    )

            )


        return {

            "success":
                True,

            "message":
                payload.get(
                    "message",
                    "Simulasi berhasil."
                ),

            "station":
                station,

            "unit":
                unit,

            "data":
                payload.get(
                    "data"
                )

        }


    except requests.RequestException as error:

        raise HTTPException(

            status_code=502,

            detail=
                f"Tidak dapat menghubungi Node API: {error}"

        )


# =========================================================
# DEMO PAGE
# =========================================================

@app.get(
    "/demo",
    response_class=HTMLResponse
)
def demo():

    return HTMLResponse(
        DEMO_HTML
    )


# =========================================================
# HTML
# =========================================================

DEMO_HTML = """
<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    SmartPOS IoT Simulator
</title>


<style>

* {
    box-sizing: border-box;
}


body {

    margin: 0;

    font-family:
        Arial,
        sans-serif;

    background:
        #f4f7fb;

    color:
        #111827;

}


.container {

    width:
        min(
            1280px,
            calc(
                100% - 32px
            )
        );

    margin:
        25px auto 50px;

}


/* ================================
   HEADER
================================ */

.hero {

    background:
        #111827;

    color:
        white;

    padding:
        26px 30px;

    border-radius:
        20px;

    margin-bottom:
        18px;

}


.hero-top {

    display:
        flex;

    justify-content:
        space-between;

    align-items:
        center;

    gap:
        20px;

}


.hero h1 {

    margin:
        0 0 7px;

    font-size:
        28px;

}


.hero p {

    margin: 0;

    color:
        #cbd5e1;

    font-size:
        13px;

}


.prototype {

    padding:
        9px 14px;

    background:
        #fef3c7;

    color:
        #92400e;

    border-radius:
        999px;

    font-weight:
        bold;

    font-size:
        11px;

}


/* ================================
   INFO
================================ */

.notice {

    padding:
        14px 16px;

    margin-bottom:
        18px;

    background:
        #eff6ff;

    border:
        1px solid
        #bfdbfe;

    border-radius:
        14px;

    color:
        #1e40af;

    font-size:
        12px;

    line-height:
        1.6;

}


/* ================================
   SUMMARY
================================ */

.summary {

    display:
        grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:
        12px;

    margin-bottom:
        18px;

}


.summary-card {

    background:
        white;

    border:
        1px solid
        #e5e7eb;

    border-radius:
        14px;

    padding:
        16px;

}


.summary-card span {

    display:
        block;

    color:
        #64748b;

    font-size:
        10px;

    margin-bottom:
        7px;

}


.summary-card strong {

    font-size:
        25px;

}


/* ================================
   MAIN
================================ */

.main {

    display:
        grid;

    grid-template-columns:
        1.45fr
        0.8fr;

    gap:
        18px;

    align-items:
        start;

}


.panel {

    background:
        white;

    border:
        1px solid
        #e5e7eb;

    border-radius:
        18px;

    padding:
        20px;

}


.panel h2 {

    margin:
        0 0 5px;

    font-size:
        19px;

}


.subtitle {

    color:
        #64748b;

    font-size:
        11px;

    margin-bottom:
        16px;

}


/* ================================
   STATIONS
================================ */

.station-grid {

    display:
        grid;

    grid-template-columns:
        repeat(
            2,
            1fr
        );

    gap:
        14px;

}


.station {

    border:
        1px solid
        #e5e7eb;

    border-radius:
        16px;

    overflow:
        hidden;

    min-height:
        360px;

    background:
        #f8fafc;

}


.station-header {

    background:
        white;

    padding:
        14px;

    border-bottom:
        1px solid
        #e5e7eb;

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

}


.station-title {

    font-size:
        13px;

    font-weight:
        bold;

}


.station-count {

    width:
        28px;

    height:
        28px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    border-radius:
        50%;

    background:
        #e2e8f0;

    font-weight:
        bold;

    font-size:
        10px;

}


.job-list {

    padding:
        12px;

    display:
        flex;

    flex-direction:
        column;

    gap:
        9px;

    max-height:
        440px;

    overflow-y:
        auto;

}


.job {

    width:
        100%;

    padding:
        12px;

    border:
        1px solid
        #dbe3ee;

    border-radius:
        12px;

    background:
        white;

    text-align:
        left;

    cursor:
        pointer;

}


.job:hover {

    border-color:
        #60a5fa;

}


.job.active {

    border-color:
        #2563eb;

    background:
        #eff6ff;

    box-shadow:
        0 0 0 2px
        rgba(
            37,
            99,
            235,
            0.10
        );

}


.job-top {

    display:
        flex;

    justify-content:
        space-between;

    align-items:
        center;

    gap:
        8px;

    margin-bottom:
        8px;

}


.job-code {

    font-size:
        11px;

    font-weight:
        bold;

}


.pending {

    padding:
        4px 7px;

    background:
        #fef3c7;

    color:
        #92400e;

    border-radius:
        999px;

    font-size:
        8px;

    font-weight:
        bold;

}


.job-info {

    color:
        #64748b;

    font-size:
        9px;

    display:
        flex;

    gap:
        12px;

    flex-wrap:
        wrap;

}


.empty {

    color:
        #94a3b8;

    text-align:
        center;

    padding:
        55px 10px;

    font-size:
        11px;

    line-height:
        1.5;

}


/* ================================
   SIMULATOR
================================ */

.station-badge {

    display:
        inline-block;

    padding:
        6px 9px;

    border-radius:
        999px;

    margin-bottom:
        12px;

    font-size:
        9px;

    font-weight:
        bold;

}


.station-badge.takeaway {

    background:
        #dbeafe;

    color:
        #1d4ed8;

}


.station-badge.dinein {

    background:
        #ede9fe;

    color:
        #6d28d9;

}


.transaction-box {

    background:
        #f8fafc;

    border:
        1px solid
        #e2e8f0;

    border-radius:
        12px;

    padding:
        13px;

    margin-bottom:
        12px;

}


.transaction-box span {

    display:
        block;

    font-size:
        9px;

    color:
        #94a3b8;

    margin-bottom:
        4px;

}


.metric-grid {

    display:
        grid;

    grid-template-columns:
        repeat(
            2,
            1fr
        );

    gap:
        10px;

    margin-bottom:
        14px;

}


.metric {

    padding:
        13px;

    background:
        #f8fafc;

    border:
        1px solid
        #e2e8f0;

    border-radius:
        12px;

}


.metric span {

    display:
        block;

    font-size:
        9px;

    color:
        #64748b;

    margin-bottom:
        6px;

}


.metric strong {

    font-size:
        22px;

}


.scenario-grid {

    display:
        grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:
        8px;

    margin-bottom:
        14px;

}


.scenario {

    padding:
        10px 5px;

    border-radius:
        9px;

    cursor:
        pointer;

    font-size:
        9px;

    font-weight:
        bold;

}


.good {

    background:
        #f0fdf4;

    border:
        1px solid
        #86efac;

    color:
        #166534;

}


.less {

    background:
        #fffbeb;

    border:
        1px solid
        #fde68a;

    color:
        #92400e;

}


.more {

    background:
        #fef2f2;

    border:
        1px solid
        #fecaca;

    color:
        #991b1b;

}


.field {

    margin-bottom:
        12px;

}


.field label {

    display:
        block;

    margin-bottom:
        6px;

    font-size:
        10px;

    font-weight:
        bold;

}


.field input {

    width:
        100%;

    padding:
        11px;

    border:
        1px solid
        #cbd5e1;

    border-radius:
        9px;

}


.simulate-btn {

    width:
        100%;

    padding:
        12px;

    border:
        none;

    border-radius:
        10px;

    background:
        #2563eb;

    color:
        white;

    cursor:
        pointer;

    font-weight:
        bold;

}


.simulate-btn:disabled {

    background:
        #94a3b8;

}


.placeholder {

    text-align:
        center;

    padding:
        75px 15px;

    color:
        #94a3b8;

    font-size:
        11px;

    line-height:
        1.6;

}


.result {

    display:
        none;

    margin-top:
        12px;

    padding:
        11px;

    border-radius:
        9px;

    font-size:
        10px;

}


.result.success {

    display:
        block;

    background:
        #f0fdf4;

    border:
        1px solid
        #86efac;

    color:
        #166534;

}


.result.error {

    display:
        block;

    background:
        #fef2f2;

    border:
        1px solid
        #fecaca;

    color:
        #991b1b;

}


/* ================================
   FLOW
================================ */

.flow {

    margin-top:
        18px;

    background:
        white;

    border:
        1px solid
        #e5e7eb;

    border-radius:
        18px;

    padding:
        20px;

}


.flow h3 {

    margin-top:
        0;

}


.flow-line {

    display:
        flex;

    flex-wrap:
        wrap;

    align-items:
        center;

    justify-content:
        center;

    gap:
        8px;

    color:
        #475569;

    font-size:
        10px;

}


.flow-step {

    background:
        #f8fafc;

    border:
        1px solid
        #e2e8f0;

    border-radius:
        8px;

    padding:
        8px;

}


/* ================================
   RESPONSIVE
================================ */

@media (
    max-width: 950px
) {

    .main,
    .station-grid,
    .summary {

        grid-template-columns:
            1fr;

    }

}

</style>

</head>


<body>


<div class="container">


    <div class="hero">

        <div class="hero-top">

            <div>

                <h1>
                    SmartPOS IoT Validation
                </h1>

                <p>
                    Prototype Camera & Computer Vision Simulator
                </p>

            </div>


            <div class="prototype">

                PROTOTYPE SIMULATION MODE

            </div>

        </div>

    </div>


    <div class="notice">

        <strong>
            Catatan Demonstrasi:
        </strong>

        halaman ini mensimulasikan output kamera
        dan model YOLO.

        Pada implementasi setelah pendanaan,
        nilai <strong>Detected Count</strong>
        akan dihasilkan otomatis oleh kamera
        dan model computer vision.

        Dua meja digunakan agar antrean
        Take Away dan Dine In tidak tercampur.

    </div>


    <div class="summary">


        <div class="summary-card">

            <span>
                TOTAL PENDING
            </span>

            <strong id="summaryTotal">
                0
            </strong>

        </div>


        <div class="summary-card">

            <span>
                🥡 MEJA TAKE AWAY
            </span>

            <strong id="summaryTakeaway">
                0
            </strong>

        </div>


        <div class="summary-card">

            <span>
                🍽️ MEJA DINE IN
            </span>

            <strong id="summaryDineIn">
                0
            </strong>

        </div>


    </div>


    <div class="main">


        <!-- =====================================
             LEFT: TWO STATIONS
        ====================================== -->

        <div class="panel">

            <h2>
                Antrean Validasi per Meja
            </h2>

            <div class="subtitle">

                Pesanan PENDING dari SmartPOS

            </div>


            <div class="station-grid">


                <!-- TAKE AWAY -->

                <div class="station">

                    <div class="station-header">

                        <div class="station-title">
                            🥡 Meja Take Away
                        </div>

                        <div
                            class="station-count"
                            id="takeawayCount"
                        >
                            0
                        </div>

                    </div>


                    <div
                        class="job-list"
                        id="takeawayJobs"
                    >
                    </div>

                </div>


                <!-- DINE IN -->

                <div class="station">

                    <div class="station-header">

                        <div class="station-title">
                            🍽️ Meja Dine In
                        </div>

                        <div
                            class="station-count"
                            id="dineInCount"
                        >
                            0
                        </div>

                    </div>


                    <div
                        class="job-list"
                        id="dineInJobs"
                    >
                    </div>

                </div>


            </div>

        </div>


        <!-- =====================================
             RIGHT: SIMULATOR
        ====================================== -->

        <div class="panel">

            <h2>
                Simulasi Deteksi Kamera
            </h2>

            <div class="subtitle">

                Pilih transaksi yang akan divalidasi

            </div>


            <div
                class="placeholder"
                id="placeholder"
            >

                Pilih transaksi dari
                <br>

                <strong>
                    Meja Take Away
                </strong>

                atau

                <strong>
                    Meja Dine In
                </strong>

            </div>


            <div
                id="simulationForm"
                style="display:none;"
            >


                <div
                    class="station-badge"
                    id="selectedStation"
                >
                    -
                </div>


                <div class="transaction-box">

                    <span>
                        TRANSAKSI
                    </span>

                    <strong id="selectedCode">
                        -
                    </strong>

                </div>


                <div class="metric-grid">


                    <div class="metric">

                        <span id="expectedLabel">
                            Expected
                        </span>

                        <strong id="expectedValue">
                            0
                        </strong>

                    </div>


                    <div class="metric">

                        <span id="detectedLabel">
                            Detected
                        </span>

                        <strong id="detectedPreview">
                            0
                        </strong>

                    </div>


                </div>


                <div
                    style="
                        font-size:10px;
                        font-weight:bold;
                        margin-bottom:7px;
                    "
                >
                    Skenario Demo Cepat
                </div>


                <div class="scenario-grid">


                    <button
                        type="button"
                        class="scenario good"
                        onclick="setScenario(0)"
                    >
                        ✓ SESUAI
                    </button>


                    <button
                        type="button"
                        class="scenario less"
                        onclick="setScenario(-1)"
                    >
                        − KURANG 1
                    </button>


                    <button
                        type="button"
                        class="scenario more"
                        onclick="setScenario(1)"
                    >
                        + LEBIH 1
                    </button>


                </div>


                <div class="field">

                    <label>
                        Jumlah Terdeteksi
                    </label>

                    <input
                        type="number"
                        min="0"
                        id="detectedInput"
                        value="0"
                    >

                </div>


                <div class="field">

                    <label>
                        Confidence (0 - 1)
                    </label>

                    <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        id="confidenceInput"
                        value="0.95"
                    >

                </div>


                <button
                    type="button"
                    class="simulate-btn"
                    id="simulateButton"
                    onclick="runSimulation()"
                >
                    Jalankan Simulasi Validasi
                </button>


                <div
                    class="result"
                    id="resultBox"
                >
                </div>


            </div>

        </div>


    </div>


    <div class="flow">

        <h3>
            Alur Prototype
        </h3>

        <div class="flow-line">

            <span class="flow-step">
                Kasir Input
            </span>

            <span>→</span>

            <span class="flow-step">
                Take Away / Dine In
            </span>

            <span>→</span>

            <span class="flow-step">
                Antrean Meja
            </span>

            <span>→</span>

            <span class="flow-step">
                Kamera / YOLO
            </span>

            <span>→</span>

            <span class="flow-step">
                MATCH / MISMATCH
            </span>

            <span>→</span>

            <span class="flow-step">
                Feedback POS
            </span>

        </div>

    </div>


</div>


<script>


let jobs = [];

let selectedId =
    null;


/* =========================================
   UTILITIES
========================================= */

function normalizeStation(
    value
) {

    return (

        String(
            value ||
            "TAKEAWAY"
        )
        .toUpperCase()

        ===

        "DINE_IN"

            ?

        "DINE_IN"

            :

        "TAKEAWAY"

    );

}


function stationName(
    station
) {

    return (

        normalizeStation(
            station
        )
        ===
        "DINE_IN"

            ?

        "Meja Dine In"

            :

        "Meja Take Away"

    );

}


function stationIcon(
    station
) {

    return (

        normalizeStation(
            station
        )
        ===
        "DINE_IN"

            ?

        "🍽️"

            :

        "🥡"

    );

}


function unitName(
    station
) {

    return (

        normalizeStation(
            station
        )
        ===
        "DINE_IN"

            ?

        "sajian"

            :

        "kemasan"

    );

}


/* =========================================
   RENDER
========================================= */

function renderJobs() {


    const takeaway =
        jobs.filter(

            job =>
                normalizeStation(
                    job.validationStation
                )
                ===
                "TAKEAWAY"

        );


    const dineIn =
        jobs.filter(

            job =>
                normalizeStation(
                    job.validationStation
                )
                ===
                "DINE_IN"

        );


    document
        .getElementById(
            "summaryTotal"
        )
        .textContent =
            jobs.length;


    document
        .getElementById(
            "summaryTakeaway"
        )
        .textContent =
            takeaway.length;


    document
        .getElementById(
            "summaryDineIn"
        )
        .textContent =
            dineIn.length;


    document
        .getElementById(
            "takeawayCount"
        )
        .textContent =
            takeaway.length;


    document
        .getElementById(
            "dineInCount"
        )
        .textContent =
            dineIn.length;


    renderStation(

        document.getElementById(
            "takeawayJobs"
        ),

        takeaway,

        "TAKEAWAY"

    );


    renderStation(

        document.getElementById(
            "dineInJobs"
        ),

        dineIn,

        "DINE_IN"

    );


    if (

        selectedId !==
        null

        &&

        !jobs.some(

            job =>
                job.id ===
                selectedId

        )

    ) {

        selectedId =
            null;


        hideForm();

    }

}


function renderStation(
    container,
    stationJobs,
    station
) {


    if (
        stationJobs.length ===
        0
    ) {

        container.innerHTML = `

            <div class="empty">

                Belum ada pesanan
                <br>

                ${stationName(
                    station
                )}

                yang PENDING.

            </div>

        `;


        return;

    }


    container.innerHTML =

        stationJobs
        .map(

            job => {


                const active =

                    job.id ===
                    selectedId

                        ?

                    "active"

                        :

                    "";


                const unit =
                    unitName(
                        job.validationStation
                    );


                return `

                    <button
                        type="button"
                        class="job ${active}"
                        onclick="selectJob(${job.id})"
                    >

                        <div class="job-top">

                            <span class="job-code">

                                ${job.transactionCode}

                            </span>


                            <span class="pending">

                                PENDING

                            </span>

                        </div>


                        <div class="job-info">

                            <span>

                                Validation #${job.id}

                            </span>


                            <span>

                                Expected:
                                ${job.expectedCount}
                                ${unit}

                            </span>

                        </div>

                    </button>

                `;

            }

        )
        .join("");

}


/* =========================================
   SELECT JOB
========================================= */

function selectJob(
    id
) {


    const job =
        jobs.find(

            item =>
                item.id === id

        );


    if (!job) {

        return;

    }


    selectedId =
        id;


    const station =
        normalizeStation(
            job.validationStation
        );


    const unit =
        unitName(
            station
        );


    document
        .getElementById(
            "placeholder"
        )
        .style.display =
            "none";


    document
        .getElementById(
            "simulationForm"
        )
        .style.display =
            "block";


    const stationBadge =
        document.getElementById(
            "selectedStation"
        );


    stationBadge.className =

        "station-badge "

        +

        (
            station ===
            "DINE_IN"

                ?

            "dinein"

                :

            "takeaway"
        );


    stationBadge.textContent =

        `${stationIcon(
            station
        )} ${stationName(
            station
        )}`;


    document
        .getElementById(
            "selectedCode"
        )
        .textContent =
            job.transactionCode;


    document
        .getElementById(
            "expectedLabel"
        )
        .textContent =

            `Expected (${unit})`;


    document
        .getElementById(
            "detectedLabel"
        )
        .textContent =

            `Detected (${unit})`;


    document
        .getElementById(
            "expectedValue"
        )
        .textContent =
            job.expectedCount;


    document
        .getElementById(
            "detectedInput"
        )
        .value =
            job.expectedCount;


    document
        .getElementById(
            "detectedPreview"
        )
        .textContent =
            job.expectedCount;


    document
        .getElementById(
            "confidenceInput"
        )
        .value =
            "0.95";


    clearResult();


    renderJobs();

}


/* =========================================
   SCENARIO
========================================= */

function setScenario(
    difference
) {


    const job =
        jobs.find(

            item =>
                item.id ===
                selectedId

        );


    if (!job) {

        return;

    }


    const value =
        Math.max(

            0,

            Number(
                job.expectedCount
            )

            +

            Number(
                difference
            )

        );


    document
        .getElementById(
            "detectedInput"
        )
        .value =
            value;


    document
        .getElementById(
            "detectedPreview"
        )
        .textContent =
            value;

}


/* =========================================
   RESULT MESSAGE
========================================= */

function clearResult() {

    const box =
        document.getElementById(
            "resultBox"
        );


    box.className =
        "result";


    box.textContent =
        "";

}


function showResult(
    message,
    type
) {

    const box =
        document.getElementById(
            "resultBox"
        );


    box.className =
        `result ${type}`;


    box.textContent =
        message;

}


function hideForm() {

    document
        .getElementById(
            "placeholder"
        )
        .style.display =
            "block";


    document
        .getElementById(
            "simulationForm"
        )
        .style.display =
            "none";

}


/* =========================================
   LOAD PENDING
========================================= */

async function loadPending() {

    try {


        const response =
            await fetch(
                "/api/pending"
            );


        const data =
            await response.json();


        if (
            !response.ok
            ||
            !data.success
        ) {

            throw new Error(

                data.detail

                ||

                data.message

                ||

                "Gagal mengambil antrean."

            );

        }


        jobs =
            data.data || [];


        renderJobs();


    }

    catch (error) {

        console.error(

            "Pending error:",

            error

        );

    }

}


/* =========================================
   SIMULATE
========================================= */

async function runSimulation() {


    const job =
        jobs.find(

            item =>
                item.id ===
                selectedId

        );


    if (!job) {

        showResult(

            "Pilih transaksi terlebih dahulu.",

            "error"

        );


        return;

    }


    const detected =

        Number(

            document
                .getElementById(
                    "detectedInput"
                )
                .value

        );


    const confidence =

        Number(

            document
                .getElementById(
                    "confidenceInput"
                )
                .value

        );


    if (

        !Number.isInteger(
            detected
        )

        ||

        detected < 0

    ) {

        showResult(

            "Jumlah terdeteksi harus angka bulat 0 atau lebih.",

            "error"

        );


        return;

    }


    if (

        Number.isNaN(
            confidence
        )

        ||

        confidence < 0

        ||

        confidence > 1

    ) {

        showResult(

            "Confidence harus antara 0 sampai 1.",

            "error"

        );


        return;

    }


    const button =
        document.getElementById(
            "simulateButton"
        );


    button.disabled =
        true;


    button.textContent =
        "Mengirim hasil...";


    try {


        const response =
            await fetch(

                "/api/simulate",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            validation_id:
                                job.id,

                            detected_count:
                                detected,

                            confidence:
                                confidence

                        })

                }

            );


        const data =
            await response.json();


        if (
            !response.ok
            ||
            !data.success
        ) {

            throw new Error(

                data.detail

                ||

                data.message

                ||

                "Simulasi gagal."

            );

        }


        const unit =
            unitName(
                job.validationStation
            );


        const isMatch =

            detected ===
            Number(
                job.expectedCount
            );


        showResult(

            (
                `${job.transactionCode} - `

                +

                `${stationName(
                    job.validationStation
                )}: `

                +

                (
                    isMatch
                        ?
                    "SESUAI"
                        :
                    "TIDAK SESUAI"
                )

                +

                `. Expected `
                +

                `${job.expectedCount} ${unit}, `

                +

                `detected ${detected} ${unit}.`
            ),

            isMatch
                ?
            "success"
                :
            "error"

        );


        selectedId =
            null;


        await loadPending();


    }

    catch (error) {


        showResult(

            error.message

            ||

            "Simulasi gagal.",

            "error"

        );


    }

    finally {


        button.disabled =
            false;


        button.textContent =
            "Jalankan Simulasi Validasi";

    }

}


/* =========================================
   DETECTED INPUT PREVIEW
========================================= */

document
    .getElementById(
        "detectedInput"
    )
    .addEventListener(

        "input",

        function () {

            document
                .getElementById(
                    "detectedPreview"
                )
                .textContent =

                    this.value

                    ||

                    "0";

        }

    );


/* =========================================
   START
========================================= */

loadPending();


setInterval(

    loadPending,

    1500

);


</script>


</body>

</html>
"""