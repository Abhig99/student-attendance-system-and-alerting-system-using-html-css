let editId = null;

// TOAST
function showNotification(msg) {

    let t = document.getElementById("toast");

    if (!t) return;

    t.innerText = msg;

    t.style.display = "block";

    setTimeout(() => {
        t.style.display = "none";
    }, 2500);
}

// ADD / UPDATE STUDENT
function addOrUpdateStudent() {

    let name =
        document.getElementById("name").value.trim();

    let usn =
        document.getElementById("usn").value.trim();

    let parentEmail =
        document.getElementById("parentEmail").value.trim();

    let parentPhone =
        document.getElementById("parentPhone").value.trim();

    if (!name || !usn || !parentEmail || !parentPhone) {

        return showNotification("Fill all fields");
    }

    let students =
        JSON.parse(localStorage.getItem("students")) || [];

    if (
        students.some(
            s => s.usn === usn && s.id !== editId
        )
    ) {

        return showNotification("USN already exists");
    }

    if (editId) {

        students = students.map(s =>

            s.id === editId

                ? {
                    ...s,
                    name,
                    usn,
                    parentEmail,
                    parentPhone
                }

                : s
        );

        editId = null;

        showNotification("Student Updated");

    } else {

        students.push({

            id: Date.now(),

            name,

            usn,

            parentEmail,

            parentPhone
        });

        showNotification("Student Added");
    }

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    document.getElementById("name").value = "";

    document.getElementById("usn").value = "";

    document.getElementById("parentEmail").value = "";

    document.getElementById("parentPhone").value = "";

    loadStudents();
}

// LOAD STUDENTS
function loadStudents() {

    let students =
        JSON.parse(localStorage.getItem("students")) || [];

    let list =
        document.getElementById("studentList");

    if (!list) return;

    let search =
        document.getElementById("search")
        ?.value.toLowerCase() || "";

    list.innerHTML = "";

    students

        .filter(s =>

            s.name.toLowerCase().includes(search)

            ||

            s.usn.toLowerCase().includes(search)
        )

        .forEach(s => {

            list.innerHTML += `

            <li>

                <div>

                    <strong>${s.name}</strong>

                    (${s.usn})

                    <br>

                    📧 ${s.parentEmail}

                    <br>

                    📞 ${s.parentPhone}

                </div>

                <div>

                    <button onclick="editStudent(${s.id})">

                    ✏️

                    </button>

                    <button onclick="confirmDelete(${s.id})">

                    ❌

                    </button>

                </div>

            </li>
            `;
        });
}

// EDIT STUDENT
function editStudent(id) {

    let s =
        JSON.parse(localStorage.getItem("students"))
        .find(x => x.id === id);

    document.getElementById("name").value =
        s.name;

    document.getElementById("usn").value =
        s.usn;

    document.getElementById("parentEmail").value =
        s.parentEmail;

    document.getElementById("parentPhone").value =
        s.parentPhone;

    editId = id;
}

// DELETE STUDENT
function confirmDelete(id) {

    if (confirm("Delete student?")) {

        deleteStudent(id);
    }
}

function deleteStudent(id) {

    let students =
        JSON.parse(localStorage.getItem("students")) || [];

    let attendance =
        JSON.parse(localStorage.getItem("attendance")) || [];

    students =
        students.filter(s => s.id !== id);

    attendance =
        attendance.filter(a => a.studentId !== id);

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );

    showNotification("Student Deleted");

    loadStudents();
}

// LOAD ATTENDANCE PAGE
function loadAttendancePage() {

    let students =
        JSON.parse(localStorage.getItem("students")) || [];

    let div =
        document.getElementById("attendanceList");

    if (!div) return;

    if (!students.length) {

        div.innerHTML = "<p>No students found</p>";

        return;
    }

    div.innerHTML = students.map(s => `

        <div class="attendance-item">

            ${s.name} (${s.usn})

            <input type="checkbox"
                   value="${s.id}">

        </div>

    `).join("");

    document.getElementById("attendanceDate").value =
        new Date().toISOString().split("T")[0];
}

// SAVE ATTENDANCE
function saveAttendance() {

    let date =
        document.getElementById("attendanceDate").value;

    if (!date)
        return showNotification("Select Date");

    let attendance =
        JSON.parse(localStorage.getItem("attendance")) || [];

    attendance =
        attendance.filter(a => a.date !== date);

    document.querySelectorAll(
        "#attendanceList input[type='checkbox']"
    ).forEach(cb => {

        attendance.push({

            studentId: Number(cb.value),

            date,

            status: cb.checked
                ? "Present"
                : "Absent"
        });
    });

    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );

    showNotification("Attendance Saved");
}

// DASHBOARD
function loadDashboard() {

    let students =
        JSON.parse(localStorage.getItem("students")) || [];

    let attendance =
        JSON.parse(localStorage.getItem("attendance")) || [];

    document.getElementById("totalStudents").innerText =
        students.length;

    let today =
        new Date().toISOString().split("T")[0];

    let todayAttendance =
        attendance.filter(a => a.date === today);

    document.getElementById("presentToday").innerText =
        todayAttendance.filter(a => a.status === "Present").length;

    document.getElementById("absentToday").innerText =
        todayAttendance.filter(a => a.status === "Absent").length;
}

// SEND EMAIL ALERT
function sendLowAttendanceEmail(student, percent) {

    emailjs.send(

        "service_8lnbfde",

        "template_49vuzq7",

        {

            student_name: student.name,

            student_usn: student.usn,

            parent_email: student.parentEmail,

            attendance_percent: percent
        }

    )

    .then(() => {

        console.log(
            "Email sent to " + student.parentEmail
        );

    })

    .catch(error => {

        console.log(error);

    });
}

// LOAD REPORT
function loadReport() {

    let students =
        JSON.parse(localStorage.getItem("students")) || [];

    let attendance =
        JSON.parse(localStorage.getItem("attendance")) || [];

    let table =
        document.getElementById("reportTable");

    if (!table) return;

    let date =
        document.getElementById("filterDate")?.value;

    table.innerHTML = "";

    students.forEach(s => {

        let records = attendance.filter(a =>

            a.studentId === s.id

            &&

            (!date || a.date === date)
        );

        let total = records.length;

        let present =
            records.filter(a =>
                a.status === "Present"
            ).length;

        let percent =

            total > 0

                ? ((present / total) * 100).toFixed(2)

                : 0;

        // EMAIL ALERT
        if (percent < 75 && total > 0) {

            sendLowAttendanceEmail(s, percent);
        }

        table.innerHTML += `

        <tr style="
            background:
            ${percent < 75
                ? '#ffe5e5'
                : '#e6ffe6'}
        ">

            <td>${s.name}</td>

            <td>${s.usn}</td>

            <td>${percent}%</td>

            <td>

                ${percent < 75

                    ? '⚠️ Low'

                    : '✅ Good'}

            </td>

        </tr>
        `;
    });
}

// CLEAR FILTER
function clearFilter() {

    document.getElementById("filterDate").value = "";

    loadReport();
}