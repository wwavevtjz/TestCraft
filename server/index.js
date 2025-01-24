const express = require('express');
const bodyParser = require("body-parser");
const multer = require('multer');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const router = express.Router();


// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/files', express.static(path.join(__dirname, 'uploads')));

// ตั้งค่า multer เพื่อใช้ memoryStorage (เก็บไฟล์ใน memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database Connection
const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "",
    database: "testcraft"
});

// Test Database Connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database as ID', db.threadId);
});


// ------------------------- PROJECT ROUTES -------------------------
// Get all projects
app.get('/project', (req, res) => {
    db.query("SELECT * FROM project", (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching projects');
        } else {
            res.send(result);
        }
    });
});

app.get('/projectmember', (req, res) => {
    const { username } = req.query; // รับชื่อผู้ใช้งานจาก query

    // Query เพื่อดึงข้อมูลจากฐานข้อมูล project พร้อมกับ project_member
    db.query("SELECT * FROM project", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching projects');
        }

        // กรอง project โดยตรวจสอบว่า roles ของผู้ใช้งานเป็น "Product Owner"
        const filteredProjects = result.filter((project) => {
            const projectMembers = JSON.parse(project.project_member); // สมมติว่า project_member เป็น JSON
            if (projectMembers.some(member => member.name === username && member.roles.includes("Product Owner"))) {
                return true;
            }
            // ถ้าไม่ใช่ "Product Owner" ให้กรองโดยชื่อผู้ใช้และตรวจสอบ role
            return projectMembers.some(member => member.name === username);
        });

        // ส่งกลับข้อมูลโครงการที่กรองแล้ว
        res.send(filteredProjects);
    });
});



app.get('/projectname', (req, res) => {
    const projectId = req.query.project_id;

    // ถ้ามีการระบุ project_id
    const query = projectId
        ? "SELECT project_member FROM project WHERE project_id = ?" // ตาม project_id
        : "SELECT project_member FROM project"; // ดึงทุก project_member 

    db.query(query, projectId ? [projectId] : [], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching project members');
        } else {
            res.send(result);
        }
    });
});

// เเสดง requirement ในหน้า reqverification
app.get('/requirements', (req, res) => {
    const { requirement_ids } = req.query;


    if (!requirement_ids || !Array.isArray(requirement_ids)) {
        return res.status(400).json({ message: "Invalid requirement_ids" });
    }

    // SQL query เพื่อดึงข้อมูล requirements ที่ตรงกับ requirement_ids
    const sql = `SELECT requirement_id, requirement_name, requirement_type FROM requirement WHERE requirement_id IN (?)`;

    db.query(sql, [requirement_ids], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching requirements" });
        }
        res.status(200).json(data);
    });
});


// Get a project by ID

app.get('/project/data', async (req, res) => {
    const projectName = req.query.name;
    const projectData = await db.findProjectByName(projectName); // ค้นหาโปรเจคในฐานข้อมูล
    if (projectData) {
        res.json(projectData);
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

app.get('/project/:id', (req, res) => {
    const sql = "SELECT * FROM project WHERE project_id = ?";
    const id = req.params.id;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching project:', err);
            res.status(500).send("Error fetching the project");
        } else if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).send("Project not found");
        }
    });
});

// Add a new project
app.post('/project', (req, res) => {
    console.log('Request Body:', req.body); // ดูข้อมูลที่ส่งมา
    const sql = `
            INSERT INTO project 
            (project_name, project_description, project_member, start_date, end_date, project_status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    const values = [
        req.body.project_name,
        req.body.project_description,
        req.body.project_member,
        req.body.start_date,
        req.body.end_date,
        req.body.project_status
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error('Database Error:', err); // แสดง Error ใน Console
            return res.status(500).json({ message: "Error adding project" });
        }
        return res.status(200).json({ message: "Project added successfully", data });
    });
});

// Update a project
app.put('/project/:id', (req, res) => {
    const sql = `
        UPDATE project 
        SET 
            project_name = ?, 
            project_description = ?, 
            project_member = ?, 
            start_date = ?, 
            end_date = ?,
            project_status = ?
        WHERE 
            project_id = ?
    `;
    const values = [
        req.body.project_name,
        req.body.project_description,
        req.body.project_member,
        req.body.start_date,
        req.body.end_date,
        req.body.project_status,
        req.params.id
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error('Error updating project:', err);
            return res.status(500).json({ message: "Error updating project" });
        }
        return res.status(200).json({ message: "Project updated successfully", data });
    });
});


// Delete a project
app.delete('/project/:id', (req, res) => {
    const sql = "DELETE FROM project WHERE project_id = ?";
    const id = req.params.id;

    db.query(sql, [id], (err, data) => {
        if (err) {
            console.error('Error deleting project:', err);
            return res.status(500).json({ message: "Error deleting project" });
        }
        return res.status(200).json({ message: "Project deleted successfully" });
    });
});

// ------------------------- MEMBER ROUTES -------------------------
// Get all members
app.get('/member', (req, res) => {
    const sql = 'SELECT member_name, member_role FROM member';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching members');
        } else {
            res.json(results);
        }
    });
});

// ------------------------- REQUIREMENT ROUTES -------------------------
// API ดึงข้อมูล requirements ของ project
app.get('/project/:project_id/requirement', (req, res) => {
    const { project_id } = req.params;

    const sql = "SELECT * FROM requirement WHERE project_id = ?";
    const values = [project_id];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching requirements" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No requirements found for this project" });
        }
        return res.status(200).json(data);
    });
});

// ดึงข้อมูลจาก requirement มา update
app.get('/requirement/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            r.requirement_id,
            r.requirement_name,
            r.requirement_type,
            r.requirement_description,
            r.requirement_status,
            r.filereq_id
        FROM requirement r
        LEFT JOIN file_requirement f ON r.filereq_id = f.filereq_id
        WHERE r.requirement_id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching requirement:', err);
            return res.status(500).json({ message: 'Error fetching requirement' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Requirement not found' });
        }
        return res.status(200).json(results[0]); // ส่งข้อมูล requirement ที่รวม filereq_name มา
    });
});


// API สำหรับการอัปเดต requirement
app.put("/requirement/:id", (req, res) => {
    const { id } = req.params;
    const { requirement_name, requirement_description, requirement_type, filereq_id } = req.body;

    // ตรวจสอบว่าข้อมูลที่จำเป็นทั้งหมดมีหรือไม่
    if (!requirement_name || !requirement_description || !requirement_type || !filereq_id) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // สร้าง SQL สำหรับการอัปเดตข้อมูล requirement
    const sql =
        "UPDATE requirement SET requirement_name = ?, requirement_description = ?, requirement_type = ?, filereq_id = ? WHERE requirement_id = ?";

    db.query(sql, [requirement_name, requirement_description, requirement_type, filereq_id, id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating requirement" });
        }
        // ตรวจสอบว่ามีการอัปเดตหรือไม่
        if (data.affectedRows === 0) {
            return res.status(404).json({ message: "Requirement not found or no changes made" });
        }
        return res.status(200).json({ message: "Requirement updated successfully" });
    });
});



// Add a new requirement for a specific project
app.post('/requirement', (req, res) => {
    const {
        requirement_name,
        requirement_type,
        requirement_description,
        requirement_status,
        project_id,
        filereq_ids // array ของ filereq_id
    } = req.body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นทั้งหมดหรือไม่
    if (!requirement_name || !requirement_type || !requirement_description || !requirement_status || !project_id || !filereq_ids || !Array.isArray(filereq_ids)) {
        return res.status(400).json({ message: "Missing required fields or filereq_ids is not an array" });
    }

    // แปลง filereq_ids เป็น JSON string
    const filereqIdsJson = JSON.stringify(filereq_ids);

    // สร้าง SQL query สำหรับการแทรกข้อมูล
    const sql = "INSERT INTO requirement (requirement_name, requirement_type, requirement_description, requirement_status, project_id, filereq_id) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [requirement_name, requirement_type, requirement_description, requirement_status, project_id, filereqIdsJson];

    // เรียกใช้ SQL query
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error adding requirement" });
        }
        return res.status(201).json({ message: "Requirement added successfully", data });
    });
});

// PUT /requirement/:id - Update requirement status
app.put("/statusrequirement/:id", (req, res) => {
    const { id } = req.params;
    const { requirement_status } = req.body;  // Only update the status
    const sql = "UPDATE requirement SET requirement_status = ? WHERE requirement_id = ?";

    db.query(sql, [requirement_status, id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating requirement status" });
        }
        return res.status(200).json({ message: "Requirement status updated successfully" });
    });
});


// Delete a requirement
app.delete('/requirement/:id', (req, res) => {
    const id = req.params.id;

    const deleteReviewerSQL = "DELETE FROM reviewer WHERE requirement_id = ?";
    const deleteRequirementSQL = "DELETE FROM requirement WHERE requirement_id = ?";

    db.query(deleteReviewerSQL, [id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error deleting reviewers" });
        }

        db.query(deleteRequirementSQL, [id], (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Error deleting requirement" });
            }
            return res.status(200).json({ message: "Requirement deleted successfully" });
        });
    });
});


// Get requirements by project ID
app.get('/project/:id/requirement', (req, res) => {
    const sql = `
        SELECT 
            r.requirement_id,
            r.requirement_name,
            r.requirement_type,
            r.requirement_description,
            p.project_id
        FROM requirement r
        INNER JOIN project p ON r.project_id = p.project_id
        WHERE r.project_id = ? AND r.requirement_status = 'WORKING'
    `;
    const projectId = req.params.id;

    db.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching requirements');
        } else {
            res.status(200).json(results);
        }
    });
});

app.put('/requirement/:requirementId/status', (req, res) => {
    const { requirementId } = req.params;
    const { status } = req.body; // รับสถานะใหม่จากฟรอนต์เอนด์

    // Query สำหรับอัปเดตในฐานข้อมูล
    db.query(
        'UPDATE requirements SET requirement_status = ? WHERE requirement_id = ?',
        [status, requirementId],
        (err, result) => {
            if (err) {
                console.error('Error updating status:', err);
                res.status(500).send('Failed to update status.');
            } else {
                res.send({ message: 'Status updated successfully.' });
            }
        }
    );
});

// ------------------------- Requirement Verification -------------------------
// Fetch all criteria
app.get('/reqcriteria', (req, res) => {
    const sql = "SELECT * FROM requirementcriteria";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching Requirement Criteria:', err);
            return res.status(500).send('Error fetching Requirement Criteria');
        }
        res.json(result);
    });
});

// Add new criteria
app.post('/reqcriteria', (req, res) => {
    const { reqcri_name } = req.body;

    if (!reqcri_name || reqcri_name.trim() === "") {
        return res.status(400).json({ message: "Criteria name is required" });
    }

    const sql = "INSERT INTO requirementcriteria (reqcri_name) VALUES (?)";
    db.query(sql, [reqcri_name], (err, result) => {
        if (err) {
            console.error('Error creating criteria:', err);
            return res.status(500).json({ message: "Error creating criteria" });
        }
        res.status(201).json({ message: "Criteria created successfully", data: result });
    });
});

// Update criteria
app.put('/reqcriteria/:id', (req, res) => {
    const { reqcri_name } = req.body;
    const { id } = req.params;

    if (!reqcri_name || reqcri_name.trim() === "") {
        return res.status(400).json({ message: "Criteria name is required" });
    }

    const sql = "UPDATE requirementcriteria SET reqcri_name = ? WHERE reqcri_id = ?";
    db.query(sql, [reqcri_name, id], (err, result) => {
        if (err) {
            console.error('Error updating criteria:', err);
            return res.status(500).json({ message: "Error updating criteria" });
        }
        res.status(200).json({ message: "Criteria updated successfully", data: result });
    });
});

// Delete criteria
app.delete('/reqcriteria/:id', (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT * FROM requirementcriteria WHERE reqcri_id = ?";
    const deleteSql = "DELETE FROM requirementcriteria WHERE reqcri_id = ?";

    db.query(checkSql, [id], (err, result) => {
        if (err) {
            console.error('Error checking criteria:', err);
            return res.status(500).json({ message: "Error checking criteria" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Criteria not found" });
        }

        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting criteria:', err);
                return res.status(500).json({ message: "Error deleting criteria" });
            }
            res.status(200).json({ message: "Criteria deleted successfully" });
        });
    });
});

// ------------------------- Requirement Verified -------------------------
app.get('/project/:project_id/reqverified', (req, res) => {
    const { project_id } = req.params;

    const sql = "SELECT * FROM reqverified WHERE project_id = ?";
    const values = [project_id];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching requirements" });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "No requirements found for this project" });
        }
        return res.status(200).json(data);
    });
});

app.get('/project/:id/reqverified', (req, res) => {
    const sql = `
        SELECT 
            r.reqver_id,
            r.reqver_name,
            p.project_id
        FROM reqverified r
        INNER JOIN project p ON r.project_id = p.project_id
        WHERE r.project_id = ?
    `;
    const projectId = req.params.id;

    db.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching requirements');
        } else {
            res.status(200).json(results);
        }
    });
});

app.put('/project/:id/reqverified', (req, res) => {
    const { id } = req.params; // รับ project_id จาก URL
    const { reqver_id, reqver_name, status } = req.body; // รับค่าที่ต้องการอัปเดตจาก body

    // คำสั่ง SQL สำหรับอัปเดตข้อมูล
    const sql = `
        UPDATE reqverified
        SET reqver_name = ?, status = ?
        WHERE reqver_id = ? AND project_id = ?
    `;

    // ส่งค่าไปยังฐานข้อมูล
    db.query(sql, [reqver_name, status, reqver_id, id], (err, result) => {
        if (err) {
            console.error("Error updating requirement:", err);
            return res.status(500).json({ message: "Error updating requirement" });
        }

        // ถ้าไม่มีแถวไหนถูกอัปเดต
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Requirement not found or no changes made" });
        }

        // ส่งข้อความว่าอัปเดตสำเร็จ
        res.status(200).json({ message: "Requirement updated successfully" });
    });
});

app.post('/reqverified', (req, res) => {
    const { reqver_name } = req.body;

    const sql = "INSERT INTO requirementverified (reqver_name) VALUES (?)";
    db.query(sql, [reqver_name], (err, result) => {
        if (err) {
            console.error('Error Requirement Verified:', err);
            return res.status(500).json({ message: "Error Requirement Verified" });
        }
        res.status(201).json({ message: "Requirement Verified created successfully", data: result });
    });
});

//-------------------------- VERIFICATION ------------------
// Create Verification
app.post('/createveri', (req, res) => {
    const { requirements, reviewers, project_id, create_by } = req.body;

    if (!requirements || !reviewers || !project_id || !create_by) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const reviewersString = JSON.stringify(reviewers);
    const requirementsString = JSON.stringify(requirements); // รวม requirements เป็น JSON

    const createVerificationQuery =
        "INSERT INTO verification (project_id, create_by, requirement_id, verification_at, verification_by) VALUES (?, ?, ?, ?, ?)";

    const verificationValues = [
        project_id,
        create_by,
        requirementsString, // เก็บ requirements เป็น JSON
        new Date(), // เวลาปัจจุบัน
        reviewersString, // เก็บ reviewers เป็น JSON
    ];

    db.query(createVerificationQuery, verificationValues, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error creating verification records." });
        }

        res.status(201).json({ message: "Verification created successfully!" });
    });
});







app.get('/verifications', (req, res) => {
    const { project_id, status } = req.query;

    let sql = `
      SELECT DISTINCT
        v.verification_id AS id,
        v.create_by,
        v.verification_at AS created_at,
        v.verification_by, -- ดึง column verification_by
        v.requirement_id,
        req.requirement_status AS requirement_status -- เพิ่มการดึง requirement_status จากตาราง requirement
      FROM verification v
      LEFT JOIN requirement req 
        ON JSON_CONTAINS(v.requirement_id, CAST(req.requirement_id AS JSON)) -- เชื่อมโยง requirement_id
      WHERE v.project_id = ?
    `;

    const params = [project_id];

    if (status) {
        sql += ` AND req.requirement_status = ?`; // ตรวจสอบสถานะ requirement
        params.push(status);
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error fetching verifications.", error: err });
        }

        const verifications = result.map((row) => ({
            id: row.id,
            create_by: row.create_by,
            created_at: row.created_at,
            requirement_status: row.requirement_status || "UNKNOWN", // กำหนดค่าเริ่มต้น
            verification_by: row.verification_by ? JSON.parse(row.verification_by) : [], // แปลง verification_by จาก string เป็น array
            requirements: row.requirement_id ? JSON.parse(row.requirement_id) : [], // แปลง requirement_id จาก JSON string เป็น array
        }));

        return res.status(200).json(verifications);
    });
});


// Update verification status and requirements status
app.put('/update-status-verifications', (req, res) => {
    const { verification_ids, requirement_status } = req.body;

    if (!verification_ids || verification_ids.length === 0) {
        return res.status(400).json({ message: "No verification IDs provided." });
    }

    const sql = `UPDATE verification SET requirement_status = ? WHERE verification_id IN (?)`;

    db.query(sql, [requirement_status, verification_ids], (err, data) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error updating verification statuses" });
        }
        return res.status(200).json({ message: "Verification statuses updated successfully" });
    });
});

app.put('/update-requirements-status-waitingfor-ver/:id', (req, res) => {
    const { id } = req.params;
    const { requirement_status } = req.body;

    if (!requirement_status) {
        return res.status(400).json({ message: "Missing requirement_status field." });
    }

    const query = `
      UPDATE requirement
      SET requirement_status = ?
      WHERE requirement_id = ?
    `;

    db.query(query, [requirement_status, id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Requirement not found." });
        }

        res.status(200).json({ message: "Requirement status updated successfully." });
    });
});

// Update multiple requirements status
app.put('/update-requirements-status-verified', (req, res) => {
    const { requirement_ids, requirement_status } = req.body;

    if (!requirement_ids || requirement_ids.length === 0) {
        return res.status(400).json({ message: "No requirement IDs provided." });
    }
    if (!requirement_status) {
        return res.status(400).json({ message: "Missing requirement_status field." });
    }

    const sql = `
        UPDATE requirement
        SET requirement_status = ?
        WHERE requirement_id IN (?)
    `;

    db.query(sql, [requirement_status, requirement_ids], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No requirements found to update." });
        }

        res.status(200).json({ message: "Requirement statuses updated successfully." });
    });
});

app.put('/update-verification-true', (req, res) => {
    const { verification_id, verification_by } = req.body;

    if (!verification_id || !Array.isArray(verification_by)) {
        return res.status(400).json({ message: "Invalid input data." });
    }

    // ตรวจสอบรูปแบบของ verification_by ให้มี ":"
    const isValidFormat = verification_by.every((entry) => {
        return typeof entry === "string" && entry.includes(":");
    });

    if (!isValidFormat) {
        return res.status(400).json({ message: "Invalid verification_by format." });
    }

    const sql = `
      UPDATE verification
      SET verification_by = ?
      WHERE verification_id = ?
    `;

    db.query(sql, [JSON.stringify(verification_by), verification_id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Failed to update verification_by." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Verification not found." });
        }

        res.status(200).json({ message: "Verification updated successfully." });
    });
});


//-------------------------- VALIDATION ------------------
// Create Validation
app.post('/createvalidation', async (req, res) => {
    const { requirements, create_by } = req.body;

    if (!requirements || !create_by) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const createValidationQuery =
        "INSERT INTO validation (requirement_id, create_by, validation_at, requirement_status) VALUES (?, ?, ?, ?)";
    const updateRequirementStatusQuery =
        "UPDATE requirement SET requirement_status = ? WHERE requirement_id IN (?)";

    try {
        // Begin a transaction
        await db.beginTransaction();

        // Insert validation record with JSON array of requirements
        await db.query(createValidationQuery, [
            JSON.stringify(requirements), // Convert requirements array to JSON
            create_by,
            new Date(),
            "VALIDATION INPROGRESS",
        ]);

        // Update requirement statuses for all selected requirements
        await db.query(updateRequirementStatusQuery, [
            "VALIDATION INPROGRESS",
            requirements,
        ]);

        // Commit transaction
        await db.commit();

        res.status(201).json({ message: "Validation created and statuses updated successfully!" });
    } catch (err) {
        console.error("Error during validation creation:", err);

        // Rollback transaction if any error occurs
        await db.rollback();

        res.status(500).json({ message: "Error creating validation or updating statuses." });
    }
});



app.get('/validations', (req, res) => {
    const { project_id, status } = req.query;

    let sql = `
      SELECT 
        v.validation_id AS id,
        v.create_by,
        v.validation_at AS created_at,
        v.requirement_id,
        GROUP_CONCAT(DISTINCT req.requirement_status) AS requirement_status -- รวม requirement_status เป็นหนึ่งเดียว
      FROM validation v
      LEFT JOIN requirement req ON JSON_CONTAINS(v.requirement_id, CAST(req.requirement_id AS JSON), '$')
      WHERE 1 = 1
    `;

    const params = [];

    // Filter by status if provided
    if (status) {
        sql += ` AND req.requirement_status = ?`;
        params.push(status);
    }

    sql += ` GROUP BY v.validation_id`; // รวมผลลัพธ์ตาม validation_id

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error fetching validations.", error: err });
        }

        const validations = result.map((row) => ({
            id: row.id,
            create_by: row.create_by,
            created_at: row.created_at,
            requirement_status: row.requirement_status,
            requirements: row.requirement_id ? JSON.parse(row.requirement_id) : [],
        }));
        console.log("Result from database:", validations); // ตรวจสอบข้อมูลก่อนส่ง
        return res.status(200).json(validations);
    });
});


// Update multiple requirements status
app.put('/update-requirements-status-validated', (req, res) => {
    const { requirement_ids, requirement_status } = req.body;

    if (!requirement_ids || requirement_ids.length === 0) {
        return res.status(400).json({ message: "No requirement IDs provided." });
    }
    if (!requirement_status) {
        return res.status(400).json({ message: "Missing requirement_status field." });
    }

    const sql = `
        UPDATE requirement
        SET requirement_status = ?
        WHERE requirement_id IN (?)
    `;

    db.query(sql, [requirement_status, requirement_ids], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No requirements found to update." });
        }

        res.status(200).json({ message: "Requirement statuses updated successfully." });
    });
});

// ------------------------- Login -------------------------
app.get('/login', (req, res) => {
    const sql = "SELECT * FROM login";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching:', err);
            return res.status(500).send('Error fetching');
        }
        res.json(result);  // Send the result as JSON
    });
});

app.post('/signup', (req, res) => {
    console.log('Request Body:', req.body); // ดูข้อมูลที่ส่งมา
    const sql = `
            INSERT INTO login 
            (user_name, user_password) 
            VALUES (?, ?)
        `;
    const values = [
        req.body.user_name,
        req.body.user_password
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error('Database Error:', err); // แสดง Error ใน Console
            return res.status(500).json({ message: "Error adding project" });
        }
        return res.status(200).json({ message: "Project added successfully", data });
    });
});

app.post('/login', (req, res) => {
    const { user_name, user_password } = req.body;

    if (!user_name || !user_password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const sql = "SELECT * FROM login WHERE user_name = ? AND user_password = ?";
    db.query(sql, [user_name, user_password], (err, result) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (result.length > 0) {
            return res.status(200).json({ message: "Login successful", user: result[0] });
        } else {
            return res.status(401).json({ message: "Invalid username or password" });
        }
    });
});


// ------------------------- File Upload -------------------------
// Upload file
app.post("/upload", upload.single("file"), (req, res) => {
    const { title } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: "Please upload a file." });
    }

    if (!title) {
        return res.status(400).json({ message: "Title is required." });
    }

    if (file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed." });
    }

    if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 10MB." });
    }

    const sql = "INSERT INTO file_requirement (filereq_name, filereq_data) VALUES (?, ?)";
    const values = [title, file.buffer];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting file:", err);
            return res.status(500).json({ message: "Failed to save file." });
        }

        res.status(200).json({ message: "File uploaded successfully.", fileId: result.insertId });
    });
});



app.get('/files', (req, res) => {
    const { project_id } = req.query; // ดึง project_id จาก query parameters

    if (!project_id) {
        return res.status(400).send('project_id is required');
    }

    const sql = "SELECT * FROM file_requirement WHERE project_id = ?";
    db.query(sql, [project_id], (err, result) => {
        if (err) {
            console.error('Error fetching files:', err);
            return res.status(500).send('Error fetching files');
        }

        // เพิ่มการจัดการ requirement_id หากเป็น JSON string
        const formattedResult = result.map(file => ({
            ...file,
            requirement_id: file.requirement_id
                ? (() => {
                    try {
                        // แปลง JSON string เป็น Array
                        return JSON.parse(file.requirement_id);
                    } catch (e) {
                        console.error('Invalid JSON format for requirement_id:', file.requirement_id);
                        return []; // หาก JSON ไม่ถูกต้อง คืนค่าเป็น Array ว่าง
                    }
                })()
                : [] // หาก requirement_id เป็น null หรือ undefined ให้คืน Array ว่าง
        }));

        res.json(formattedResult);
    });
});



app.get('/filename', (req, res) => {
    const sql = "SELECT filereq_id, filereq_name FROM file_requirement"; // เลือก filereq_id และ filereq_name
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching Requirement Criteria:', err);
            return res.status(500).send('Error fetching Requirement Criteria');
        }
        res.json(result); // ส่งผลลัพธ์ให้ client
    });
});




// เส้นทางดาวน์โหลดไฟล์
app.get("/files/:id", (req, res) => {
    const fileId = req.params.id;

    const sql = "SELECT filereq_name, filereq_data FROM file_requirement WHERE filereq_id = ?";
    db.query(sql, [fileId], (err, results) => {
        if (err) {
            console.error("Error fetching file:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (results.length === 0) {
            return res.status(404).send("File not found");
        }

        const file = results[0];
        const fileName = encodeURIComponent(file.filereq_name || "download.pdf"); // กำหนดชื่อไฟล์ที่ปลอดภัย

        // ตั้งค่า Content-Type และ Content-Disposition
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        // ส่งข้อมูลไฟล์กลับ
        res.send(file.filereq_data);
    });
});


// ลบไฟล์
app.delete('/files/:fileId', (req, res) => {
    const fileId = req.params.fileId; // รับ fileId จาก URL
    const sql = "DELETE FROM file_requirement WHERE filereq_id = ?";

    db.query(sql, [fileId], (err, result) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).send('Error deleting file');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('File not found');
        }

        res.status(200).send('File deleted successfully');
    });
});

// ----------------------- File Validation ----------------------- 

// อัปโหลดไฟล์
app.post("/uploadfile-var", upload.single("file"), (req, res) => {
    try {
        const { project_id, requirement_id } = req.body;
        const file = req.file;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!project_id || !requirement_id) {
            throw new Error("Missing required fields: project_id or requirement_id.");
        }

        if (!file) {
            throw new Error("No file uploaded.");
        }

        // ตรวจสอบประเภทไฟล์
        if (file.mimetype !== "application/pdf") {
            throw new Error("Invalid file type. Only PDF files are allowed.");
        }

        // ตรวจสอบขนาดไฟล์
        if (file.size > 10 * 1024 * 1024) {
            throw new Error("File too large. Maximum size is 10MB.");
        }

        // แปลง requirement_id ให้รองรับ JSON array
        let formattedRequirementId;
        try {
            if (typeof requirement_id === "string" && requirement_id.startsWith("[")) {
                const parsedArray = JSON.parse(requirement_id);
                if (Array.isArray(parsedArray)) {
                    formattedRequirementId = JSON.stringify(parsedArray); // เก็บเป็น JSON array
                } else {
                    throw new Error("Invalid requirement_id format. Expected an array.");
                }
            } else {
                formattedRequirementId = JSON.stringify([requirement_id]); // เปลี่ยนเป็น array ก่อน
            }
        } catch (err) {
            throw new Error("Failed to parse requirement_id.");
        }

        // แปลงข้อมูลสำหรับ `filereq_data`
        const fileData = {
            filename: file.originalname,
        };

        // SQL query to insert data
        const sql = `
            INSERT INTO file_validation (
                requirement_id,
                filereq_data,
                upload_at
            ) VALUES (?, ?, NOW())
        `;
        const values = [
            formattedRequirementId, // requirement_id ในรูป JSON array
            JSON.stringify(fileData), // filereq_data ในรูป JSON object
        ];

        // Execute query to insert file data into the database
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("SQL Error:", err.message);
                return res.status(500).json({ message: "Database error: " + err.message });
            }

            console.log("File uploaded and saved successfully. File Validation ID:", result.insertId);
            res.status(200).json({
                message: "File uploaded successfully.",
                file_validation_id: result.insertId,
            });
        });
    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ดาวน์โหลดไฟล์
app.get("/download-file-var/:id", (req, res) => {
    const fileId = req.params.id;

    const sql = "SELECT requirement_name, filereq_data FROM file_validation WHERE file_validation_id = ?";
    db.query(sql, [fileId], (err, results) => {
        if (err) {
            console.error("Error fetching file:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "File not found." });
        }

        const file = results[0];
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${file.requirement_name}"`
        );
        res.send(Buffer.from(file.filereq_data, "base64"));
    });
});

// ลบไฟล์
app.delete("/delete-files-var/:fileId", (req, res) => {
    const fileId = req.params.fileId;

    const sql = "DELETE FROM file_validation WHERE file_validation_id = ?";
    db.query(sql, [fileId], (err, result) => {
        if (err) {
            console.error("Error deleting file:", err);
            return res.status(500).json({ message: "Error deleting file." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "File not found." });
        }

        res.status(200).json({ message: "File deleted successfully." });
    });
});

// ------------------------- COMMENT -------------------------

// ดึง Comment ทั้งหมดตาม Verification ID และ Requirement ID
app.get('/api/comments', (req, res) => {
    const { verificationId, requirementId } = req.query;

    if (!verificationId || !requirementId) {
        return res.status(400).json({ message: 'Missing required parameters' });
    }

    const sql = `
        SELECT * FROM comment 
        WHERE verification_id = ? AND requirement_id = ?
    `;
    db.query(sql, [verificationId, requirementId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ message: 'Failed to fetch comments' });
        }
        res.status(200).json(results);
    });
});

// เพิ่ม Comment ใหม่
app.post('/api/comments', (req, res) => {
    const { reviewer_id, reviewer_name, content, verification_id, requirement_id } = req.body;

    // ตรวจสอบว่าค่าที่จำเป็นครบถ้วน
    if (!reviewer_id || !reviewer_name || !content || !verification_id || !requirement_id) {
        console.error('Missing required fields:', { reviewer_id, reviewer_name, content, verification_id, requirement_id });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = `
        INSERT INTO comment (reviewer_id, reviewer_name, content, verification_id, requirement_id, comment_time)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const values = [reviewer_id, reviewer_name, content, verification_id, requirement_id];

    console.log('Executing SQL:', sql, values);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ message: 'Failed to add comment' });
        }

        const newComment = {
            id: result.insertId,
            reviewer_id,
            reviewer_name,
            content,
            verification_id,
            requirement_id,
            comment_time: new Date(),
        };

        console.log('Added comment:', newComment);
        res.status(201).json(newComment);
    });
});


// ลบ Comment ตาม ID
app.delete('/api/comments/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM comment WHERE comment_id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting comment:', err);
            return res.status(500).json({ message: 'Failed to delete comment' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'Comment deleted successfully' });
    });
});

// อัปเดต Comment ตาม ID
app.put('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    const sql = `
        UPDATE comment 
        SET content = ?, comment_time = NOW()
        WHERE comment_id = ?
    `;
    db.query(sql, [content, id], (err, result) => {
        if (err) {
            console.error('Error updating comment:', err);
            return res.status(500).json({ message: 'Failed to update comment' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json({ message: 'Comment updated successfully' });
    });
});

app.post('/api/comments', (req, res) => {
    console.log('Request body received:', req.body); // เพิ่ม Log ดู Request
    const { reviewer_id, reviewer_name, content, verification_id, requirement_id } = req.body;

    if (!reviewer_id || !reviewer_name || !content || !verification_id || !requirement_id) {
        console.error('Missing required fields:', { reviewer_id, reviewer_name, content, verification_id, requirement_id });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const sql = `INSERT INTO comment (reviewer_id, reviewer_name, content, verification_id, requirement_id, comment_time)
                 VALUES (?, ?, ?, ?, ?, NOW())`;

    const values = [reviewer_id, reviewer_name, content, verification_id, requirement_id];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing SQL:', err);
            return res.status(500).json({ message: 'Failed to add comment' });
        }

        console.log('Comment added successfully:', result);
        res.status(201).json({ id: result.insertId, ...req.body, comment_time: new Date() });
    });
});


// ------------------------- VERSION CONTROL -------------------------
// Endpoint to fetch history for a specific criteria
app.post("/reqcriteria/log", (req, res) => {
    const { reqcri_id, action, modified_by } = req.body;
    const query = `
        INSERT INTO history (reqcri_id, action, modified_by, modified_at)
        VALUES (?, ?, ?, NOW());
    `;
    db.query(query, [reqcri_id, action, modified_by], (err, result) => {
        if (err) {
            console.error("Error logging action:", err);
            return res.status(500).json({ error: "Failed to log action." });
        }
        res.json({ message: "Action logged successfully." });
    });
});


//-------------------------- VERIFICATION COMMENT ------------------------------------
// Get all comments
app.get('/allcomment', (req, res) => {
    const verificationId = req.query.verification_id; // ดึง verification_id จาก query string
    console.log('Received verification_id:', verificationId); // ตรวจสอบค่าที่รับมา

    // SQL Query ดึงคอมเมนต์และการตอบกลับที่เกี่ยวข้อง
    const sql = `
        SELECT 
            c.comment_id, 
            c.member_name AS comment_member_name, 
            c.comment_text, 
            c.comment_at,
            r.ver_replies_id, 
            r.ver_replies_text, 
            r.member_name AS reply_member_name, 
            r.ver_replies_at
        FROM 
            comme_member c
        LEFT JOIN 
            ver_comment_replies r 
        ON 
            c.comment_id = r.comment_id
        WHERE 
            c.verification_id = ?
    `;

    db.query(sql, [verificationId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).send('Error fetching comments');
        }

        // จัดกลุ่มข้อมูลคอมเมนต์และการตอบกลับ
        const groupedResults = results.reduce((acc, row) => {
            const commentId = row.comment_id;

            if (!acc[commentId]) {
                acc[commentId] = {
                    comment_id: row.comment_id,
                    member_name: row.comment_member_name,
                    comment_text: row.comment_text,
                    comment_at: row.comment_at,
                    replies: []
                };
            }

            if (row.ver_replies_id) {
                acc[commentId].replies.push({
                    ver_replies_id: row.ver_replies_id,
                    ver_replies_text: row.ver_replies_text,
                    member_name: row.reply_member_name,
                    ver_replies_at: row.ver_replies_at
                });
            }

            return acc;
        }, {});

        const comments = Object.values(groupedResults);
        console.log('Fetched comments with replies:', comments); // ตรวจสอบข้อมูลที่ได้
        res.json(comments);
    });
});

app.post('/comments', (req, res) => {
    const { member_id, member_name, comment_text, verification_id } = req.body;  // รับค่า emoji จาก body
    console.log('Received data:', req.body); // ตรวจสอบข้อมูลที่รับมา

    // เพิ่มข้อมูลอีโมจิในคำสั่ง SQL
    const sql = 'INSERT INTO comme_member (member_id, member_name, comment_text, verification_id) VALUES ( ?, ?, ?, ?)';

    db.query(sql, [member_id, member_name, comment_text, verification_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error adding comment');
        } else {
            res.status(201).send('Comment added successfully');
        }
    });
});


// Update comment
app.put('/comments/:comme_member_id', (req, res) => {
    const { comme_member_id } = req.params;
    const { comment_text } = req.body;
    const sql = 'UPDATE comme_member SET comment_text = ? WHERE comme_member_id = ?';
    db.query(sql, [comment_text, comme_member_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating comment');
        } else {
            res.send('Comment updated successfully');
        }
    });
});

app.delete('/deletecomment/:commentId', (req, res) => {
    const { commentId } = req.params;  // ดึง commentId จาก params

    // ลบการตอบกลับที่เกี่ยวข้องจาก ver_comment_replies
    const deleteRepliesSql = 'DELETE FROM ver_comment_replies WHERE comment_id = ?';
    db.query(deleteRepliesSql, [commentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting replies');
        }

        // หลังจากลบการตอบกลับแล้ว ลบคอมเมนต์จาก comme_member
        const deleteCommentSql = 'DELETE FROM comme_member WHERE comment_id = ?';
        db.query(deleteCommentSql, [commentId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error deleting comment');
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Comment not found');
            }
            res.send('Comment deleted successfully');
        });
    });
});



//-------------------------- VALIDATION COMMENT ----------------------
// Get all comments
// ดึงคอมเมนต์จาก validation_id
app.get('/showvalicomment', (req, res) => {
    const validationId = req.query.validation_id; // ดึง validation_id จาก query string
    console.log('Received validation_id:', validationId); // ตรวจสอบ validation_id
    const sql = 'SELECT * FROM comment_var WHERE validation_id = ?';

    db.query(sql, [validationId], (err, results) => {
        if (err) {
            console.error('Error fetching comment:', err);
            return res.status(500).send('Error fetching comment');
        }
        console.log('Fetched comment:', results); // ตรวจสอบข้อมูลที่ได้
        res.json(results);
    });
});


app.post('/createvarcomment', (req, res) => {
    const { member_name, comment_var_text, validation_id } = req.body;
    console.log('Received data:', req.body); // ตรวจสอบข้อมูลที่รับมา

    // คำสั่ง SQL ที่ปรับใหม่
    const sql = 'INSERT INTO comment_var (member_name, comment_var_text, validation_id) VALUES (?, ?, ?)';

    db.query(sql, [member_name, comment_var_text, validation_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error adding comment');
        } else {
            res.status(201).send('Comment added successfully');
        }
    });
});




// Update comment
app.put('/var_comment', (req, res) => {
    const { comment_var_id } = req.params;
    const { comment_var_text } = req.body;
    const sql = 'UPDATE comme_member SET comment_text = ? WHERE comme_member_id = ?';
    db.query(sql, [comment_var_text, comment_var_id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating comment');
        } else {
            res.send('Comment updated successfully');
        }
    });
});

app.delete('/deletecomment/:commentId', (req, res) => {
    const { commentId } = req.params;  // ดึง commentId จาก params

    const sql = 'DELETE FROM comme_member WHERE comment_id = ?';  // ใช้ comment_id ในการลบ
    db.query(sql, [commentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting comment');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Comment not found');
        }
        res.send('Comment deleted successfully');
    });
});



app.post('/comments', (req, res) => {
    const { member_name, comment_var_text } = req.body;

    // ตรวจสอบข้อมูลก่อนทำการ INSERT
    console.log("Received data:", { member_name, comment_var_text });

    const sql = 'INSERT INTO comme_member (member_name, comment_text) VALUES (?, ?, ?)';
    db.query(sql, [member_name, comment_var_text], (err, results) => {
        if (err) {
            console.error("Error inserting comment:", err);
            res.status(500).send('Failed to insert comment.');
        } else {
            res.status(201).json({ comment_var_id: results.insertId });
        }
    });
});

// ------------------------- REPLY VERIFICATION COMMENT -------------------------
app.post('/replyvercomment', (req, res) => {
    const { member_name, ver_replies_text, verification_id, comment_id } = req.body;

    // ตรวจสอบว่ามี comment_id หรือไม่
    if (!comment_id) {
        return res.status(400).send('comment_id is required');
    }

    // สร้าง SQL Query สำหรับเพิ่มการตอบกลับ
    const sql = `
        INSERT INTO ver_comment_replies (ver_replies_text, member_name, verification_id, comment_id) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [ver_replies_text, member_name, verification_id, comment_id], (err, result) => {
        if (err) {
            console.error('Error adding reply:', err);
            return res.status(500).send('Error adding reply');
        }
        res.status(201).send('Reply added successfully');
    });
});


// ------------------------- Baseline -------------------------
// API สำหรับสร้าง Baseline

app.post('/createbaseline', (req, res) => {
    const { requirement_id, baseline_at } = req.body;

    if (!requirement_id || !requirement_id.length) {
        return res.status(400).send({ error: "Requirement ID is required" });
    }

    const formattedDate = new Date(baseline_at)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' '); // "YYYY-MM-DD HH:mm:ss"

    // SQL เพื่อหา baseline_round ล่าสุดในระบบทั้งหมด
    const findLatestBaselineRoundQuery = `
        SELECT MAX(baseline_round) AS latest_baseline_round
        FROM baseline
    `;

    db.query(findLatestBaselineRoundQuery, (err, result) => {
        if (err) {
            console.error("Database error during baseline round check:", err);
            return res.status(500).send({
                error: "Failed to fetch the latest baseline round",
                details: err.sqlMessage || err.message,
            });
        }

        // baseline_round ใหม่ = ล่าสุด + 1 (ถ้าไม่มี baseline เลย ให้เริ่มต้นที่ 1)
        const newBaselineRound = (result[0]?.latest_baseline_round || 0) + 1;

        // เตรียมข้อมูลสำหรับ insert
        const insertBaselineQuery = `
            INSERT INTO baseline (requirement_id, baseline_round, baseline_at)
            VALUES ?
        `;
        const baselineValues = requirement_id.map((id) => [
            id,
            newBaselineRound,
            formattedDate,
        ]);

        // Insert baselines
        db.query(insertBaselineQuery, [baselineValues], (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Database error during baseline insert:", insertErr);
                return res.status(500).send({
                    error: "Failed to create baseline",
                    details: insertErr.sqlMessage || insertErr.message,
                });
            }

            // อัปเดต requirement_status สำหรับ requirement_id ที่เกี่ยวข้อง
            const updateRequirementQuery = `
                UPDATE requirement
                SET requirement_status = ?
                WHERE requirement_id IN (?)
            `;
            const requirementStatus = `BASELINE`;

            db.query(updateRequirementQuery, [requirementStatus, requirement_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Database error during requirement update:", updateErr);
                    return res.status(500).send({
                        error: "Failed to update requirements",
                        details: updateErr.sqlMessage || updateErr.message,
                    });
                }

                // สร้างข้อมูล response
                const insertedBaselines = baselineValues.map(([requirementId, baseline_round]) => ({
                    baseline_id: insertResult.insertId++, // เริ่มจาก insertId แล้วเพิ่มทีละ 1
                    requirement_id: requirementId,
                    baseline_round: baseline_round,
                    baseline_at: formattedDate,
                }));

                console.log("Inserted Baselines:", insertedBaselines);

                res.status(201).send({
                    message: "Baseline created successfully",
                    updatedRequirements: updateResult.affectedRows,
                    insertedRows: insertResult.affectedRows,
                    baselines: insertedBaselines,
                });
            });
        });
    });
});

app.get("/baselines", (req, res) => {
    const { project_id } = req.query;
  
    if (!project_id) {
      return res.status(400).send({ error: "Project ID is required" });
    }
  
    const query = `
      SELECT 
        b.baseline_round, b.baseline_at, 
        JSON_ARRAYAGG(r.requirement_id) AS requirements 
      FROM baseline b
      JOIN requirement r ON b.requirement_id = r.requirement_id
      WHERE r.project_id = ?
      GROUP BY b.baseline_round, b.baseline_at
      ORDER BY b.baseline_round ASC;
    `;
  
    db.query(query, [project_id], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).send({
          error: "Failed to fetch baselines",
          details: err.message,
        });
      }
  
      const baselines = results.map((row) => ({
        baseline_round: row.baseline_round,
        baseline_at: row.baseline_at,
        requirements: JSON.parse(row.requirements),
      }));
  
      res.status(200).send(baselines);
    });
  });


app.post('/updaterequirements', (req, res) => {
    const { requirement_id, requirement_status } = req.body;
  
    if (!requirement_id || !requirement_status) {
      return res.status(400).send({ error: "Requirement ID and status are required." });
    }
  
    const updateQuery = `
      UPDATE requirement
      SET requirement_status = ?
      WHERE requirement_id IN (?)
    `;
  
    db.query(updateQuery, [requirement_status, requirement_id], (err, result) => {
      if (err) {
        console.error("Database error during requirement status update:", err);
        return res.status(500).send({
          error: "Failed to update requirements.",
          details: err.sqlMessage || err.message,
        });
      }
  
      res.status(200).send({
        message: "Requirement statuses updated successfully.",
        updatedRows: result.affectedRows,
      });
    });
  });
  

// ------------------------- SERVER LISTENER -------------------------
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
