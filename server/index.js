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
            r.project_id,
            r.requirement_id,
            r.requirement_name,
            r.requirement_type,
            r.requirement_description,
            r.requirement_status,
            COALESCE(GROUP_CONCAT(frr.filereq_id), '[]') AS filereq_ids
        FROM requirement r
        LEFT JOIN file_requirement_relation frr ON r.requirement_id = frr.requirement_id
        WHERE r.requirement_id = ?
        GROUP BY r.requirement_id, r.requirement_name, r.requirement_type, 
                 r.requirement_description, r.requirement_status;
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching requirement:', err);
            return res.status(500).json({ message: 'Error fetching requirement' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Requirement not found' });
        }

        // แปลง filereq_ids จาก String เป็น Array
        const formattedResult = {
            ...results[0],
            filereq_ids: results[0].filereq_ids ? results[0].filereq_ids.split(',').map(id => Number(id)) : []
        };

        return res.status(200).json(formattedResult);
    });
});



// API สำหรับการอัปเดต requirement
app.put("/requirement/:id", (req, res) => {
    const { id } = req.params;
    const { requirement_name, requirement_description, requirement_type, filereq_ids } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!requirement_name || !requirement_description || !requirement_type || !Array.isArray(filereq_ids)) {
        return res.status(400).json({ message: "Missing required fields or filereq_ids is not an array" });
    }

    // อัปเดตข้อมูล requirement
    const updateRequirementSql = `
        UPDATE requirement 
        SET requirement_name = ?, requirement_description = ?, requirement_type = ? 
        WHERE requirement_id = ?
    `;

    db.query(updateRequirementSql, [requirement_name, requirement_description, requirement_type, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating requirement" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Requirement not found or no changes made" });
        }

        // ลบความสัมพันธ์เก่ากับไฟล์
        const deleteRelationSql = "DELETE FROM file_requirement_relation WHERE requirement_id = ?";
        db.query(deleteRelationSql, [id], (deleteErr) => {
            if (deleteErr) {
                console.error(deleteErr);
                return res.status(500).json({ message: "Error deleting old file relationships" });
            }

            // เพิ่มความสัมพันธ์ใหม่ถ้ามี filereq_ids
            if (filereq_ids.length > 0) {
                const insertRelationSql = "INSERT INTO file_requirement_relation (filereq_id, requirement_id) VALUES ?";
                const relationValues = filereq_ids.map(filereq_id => [filereq_id, id]);

                db.query(insertRelationSql, [relationValues], (relationErr) => {
                    if (relationErr) {
                        console.error(relationErr);
                        return res.status(500).json({ message: "Error inserting new file relationships" });
                    }

                    return res.status(200).json({
                        message: "Requirement and file relationships updated successfully"
                    });
                });
            } else {
                return res.status(200).json({
                    message: "Requirement updated successfully, no file relationships changed"
                });
            }
        });
    });
});





app.post('/requirement', (req, res) => {
    const { requirement_name, requirement_type, requirement_description, requirement_status, project_id, filereq_ids } = req.body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นทั้งหมดหรือไม่
    if (!requirement_name || !requirement_type || !requirement_description || !requirement_status || !project_id || !filereq_ids || !Array.isArray(filereq_ids)) {
        return res.status(400).json({ message: "Missing required fields or filereq_ids is not an array" });
    }

    // สร้าง SQL query สำหรับการแทรกข้อมูลในตาราง requirement
    const sql = "INSERT INTO requirement (requirement_name, requirement_type, requirement_description, requirement_status, project_id) VALUES (?, ?, ?, ?, ?)";
    const values = [requirement_name, requirement_type, requirement_description, requirement_status, project_id];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error adding requirement" });
        }

        const requirementId = data.insertId; // ดึงค่า requirement_id ที่เพิ่งสร้างขึ้นมา

        // ถ้าไม่มี filereq_ids ให้ส่ง response ทันที
        if (filereq_ids.length === 0) {
            return res.status(201).json({
                message: "Requirement added successfully",
                requirement_id: requirementId
            });
        }

        // เตรียม SQL สำหรับการแทรกข้อมูลลงในตาราง file_requirement_relation
        const insertRelationSql = "INSERT INTO file_requirement_relation (filereq_id, requirement_id) VALUES ?";
        const relationValues = filereq_ids.map(filereq_id => [filereq_id, requirementId]);

        db.query(insertRelationSql, [relationValues], (relationErr, relationData) => {
            if (relationErr) {
                console.error(relationErr);
                return res.status(500).json({ message: "Error inserting into file_requirement_relation" });
            }

            return res.status(201).json({
                message: "Requirement and file relationships added successfully",
                requirement_id: requirementId
            });
        });
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

    console.log("Deleting requirement with ID:", id);

    // ตรวจสอบว่ามี requirement_id อยู่จริงใน file_requirement
    const checkRequirementSQL = "SELECT * FROM file_requirement WHERE requirement_id = ?";

    db.query(checkRequirementSQL, [id], (err, results) => {
        if (err) {
            console.error("Error checking requirement:", err);
            return res.status(500).json({ message: "Error checking requirement" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Requirement ID not found in file_requirement" });
        }

        const deleteHistorySQL = "DELETE FROM historyreq WHERE requirement_id = ?";
        const deleteReviewerSQL = "DELETE FROM reviewer WHERE requirement_id = ?";
        const deleteRequirementSQL = "DELETE FROM requirement WHERE requirement_id = ?";
        const deleteRequrementFromRelationSQL = "DELETE FROM file_requirement_relation WHERE requirement_id = ?";
        const deleteBaselineSQL = "DELETE FROM baseline WHERE requirement_id = ?";
        const updateFileRequirementSQL = "UPDATE file_requirement SET requirement_id = NULL WHERE requirement_id = ?";
        const deleteDesignSQL = "DELETE FROM design WHERE design_id = ?";

        // อัปเดต file_requirement ก่อน
        db.query(updateFileRequirementSQL, [id], (err, data) => {
            if (err) {
                console.error("Error updating file_requirement:", err);
                return res.status(500).json({ message: "Error updating file_requirement" });
            }

            // ลบ baseline
            db.query(deleteBaselineSQL, [id], (err, data) => {
                if (err) {
                    console.error("Error deleting baseline:", err);
                    return res.status(500).json({ message: "Error deleting baseline" });
                }

                // ลบ history
                db.query(deleteHistorySQL, [id], (err, data) => {
                    if (err) {
                        console.error("Error deleting history:", err);
                        return res.status(500).json({ message: "Error deleting history" });
                    }

                    // ลบ reviewer
                    db.query(deleteReviewerSQL, [id], (err, data) => {
                        if (err) {
                            console.error("Error deleting reviewers:", err);
                            return res.status(500).json({ message: "Error deleting reviewers" });
                        }

                        // ลบ file_requirement_relation
                        db.query(deleteRequrementFromRelationSQL, [id], (err, data) => {
                            if (err) {
                                console.error("Error deleting file_requirement_relation:", err);
                                return res.status(500).json({ message: "Error deleting file_requirement_relation" });
                            }

                            // ลบ requirement
                            db.query(deleteRequirementSQL, [id], (err, data) => {
                                if (err) {
                                    console.error("Error deleting requirement:", err);
                                    return res.status(500).json({ message: "Error deleting requirement" });
                                }

                                // ลบ design (กรณีเชื่อมโยงกับ requirement)
                                db.query(deleteDesignSQL, [id], (err, data) => {
                                    if (err) {
                                        console.error("Error deleting design:", err);
                                        return res.status(500).json({ message: "Error deleting design" });
                                    }

                                    return res.status(200).json({ message: "Requirement and related data deleted successfully" });
                                });
                            });
                        });
                    });
                });
            });
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

// filter status VERIFIED AND VALIDATED
app.get("/api/requirements", (req, res) => {
    const query =
        "SELECT * FROM requirement WHERE requirement_status IN ('VERIFIED', 'VALIDATED')";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching data:", err);
            res.status(500).send("Error fetching data");
        } else {
            res.json(results);
        }
    });
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
            "WAITING FOR VALIDATION",
        ]);

        // Update requirement statuses for all selected requirements
        await db.query(updateRequirementStatusQuery, [
            "WAITING FOR VALIDATION",
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
    const { title, project_id } = req.body;  // รับค่าจาก form data
    const file = req.file;

    // ตรวจสอบว่าไฟล์ถูกส่งมา
    if (!file) {
        return res.status(400).json({ message: "Please upload a file." });
    }

    // ตรวจสอบว่า title ถูกกรอกหรือไม่
    if (!title) {
        return res.status(400).json({ message: "Title is required." });
    }

    // ตรวจสอบว่าไฟล์เป็น PDF
    if (file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed." });
    }

    // ตรวจสอบขนาดไฟล์
    if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 10MB." });
    }

    // ตรวจสอบว่า project_id มีค่า
    if (!project_id) {
        return res.status(400).json({ message: "Project ID is required." });
    }

    const sql = "INSERT INTO file_requirement (filereq_name, filereq_data, project_id) VALUES (?, ?, ?)";
    const values = [title, file.buffer, project_id];  // ส่งค่า project_id

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting file:", err);
            return res.status(500).json({ message: "Failed to save file." });
        }
        res.status(200).json({ message: "File uploaded successfully.", fileId: result.insertId });
    });
});


app.get('/files', (req, res) => {
    const { project_id } = req.query; // รับค่า project_id จาก query parameters

    if (!project_id) {
        return res.status(400).json({ message: "project_id is required" });
    }

    // SQL สำหรับการ JOIN file_requirement และ file_requirement_relation
    const sql = `
        SELECT 
            fr.filereq_id, 
            fr.filereq_name, 
            COALESCE(GROUP_CONCAT(frr.requirement_id), '[]') AS requirement_ids
        FROM file_requirement fr
        LEFT JOIN file_requirement_relation frr ON fr.filereq_id = frr.filereq_id
        WHERE fr.project_id = ?
        GROUP BY fr.filereq_id, fr.filereq_name;
    `;

    db.query(sql, [project_id], (err, result) => {
        if (err) {
            console.error('Error fetching files:', err);
            return res.status(500).json({ message: "Error fetching files" });
        }

        // แปลง requirement_ids จาก String เป็น Array
        const formattedResult = result.map(file => ({
            ...file,
            requirement_ids: file.requirement_ids ? file.requirement_ids.split(',').map(id => Number(id)) : []
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

app.post("/uploadfile-var", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    let { requirement_id, project_id } = req.body;

    // ✅ แปลงค่าให้เป็นตัวเลขและตรวจสอบให้แน่ใจว่าไม่ใช่ NaN
    requirement_id = parseInt(requirement_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(requirement_id) || isNaN(project_id)) {
        return res.status(400).json({ message: "Invalid project_id or requirement_id." });
    }

    const fileBuffer = fs.readFileSync(req.file.path);

    const sql = `INSERT INTO file_validation (requirement_id, project_id, filereq_data, upload_at) VALUES (?, ?, ?, NOW())`;

    db.query(sql, [requirement_id, project_id, fileBuffer], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error: " + err.message });
        }

        fs.unlinkSync(req.file.path);
        res.status(201).json({ message: "File uploaded successfully", insertId: result.insertId });
    });
});


// 📌 API ดาวน์โหลดไฟล์
app.get("/getfile/:fileId", (req, res) => {
    const fileId = parseInt(req.params.fileId, 10);

    if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
    }

    const sql = "SELECT filereq_data FROM file_validation WHERE id = ?";
    db.query(sql, [fileId], (err, result) => {
        if (err) {
            console.error("Error fetching file:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "File not found" });
        }

        const fileName = result[0].filereq_data;
        const filePath = path.join(__dirname, "uploads", fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found on server" });
        }

        res.download(filePath, fileName);
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

//------------------------------HISTORY REQUIREMENT----------------------------------
//บันทึกลงตาราง HISTORY REQUIREMENT
app.post('/historyReqWorking', (req, res) => {
    console.log('Request Body:', req.body);

    const sql = `
        INSERT INTO historyreq 
        (requirement_id, requirement_status) 
        VALUES (?, ?)
    `;
    const values = [
        req.body.requirement_id,
        req.body.requirement_status,
    ];

    db.query(sql, values, (err, data) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: "Error adding to historyreq" });
        }
        return res.status(200).json({ message: "History added successfully", data });
    });
});

//เเสดง HISTORY REQUIREMENT จาก REQ-ID นั้นที่กด VIEW
app.get('/getHistoryByRequirementId', (req, res) => {
    const requirementId = req.query.requirement_id;

    if (!requirementId) {
        return res.status(400).json({ message: "Missing requirement_id" });
    }

    const sql = `
        SELECT * FROM historyreq 
        WHERE requirement_id = ? 
        ORDER BY historyreq_at ASC;
    `;

    db.query(sql, [requirementId], (err, data) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: "Error fetching history" });
        }
        console.log('Fetched History:', data);  // ตรวจสอบว่าได้รับข้อมูลจากฐานข้อมูล
        return res.status(200).json({ message: "History fetched successfully", data });
    });

});

// ----------------------------- DESIGN ------------------------------
// Create Design
app.post("/design", (req, res) => {
    console.log("Request body:", req.body);
    const { diagram_name, design_type, diagram_type, design_description, project_id, design_status, requirement_id } = req.body;

    if (!diagram_name || !design_type || !diagram_type || !design_description || !project_id || !design_status || !requirement_id) {
        console.error("Missing fields in request:", req.body);
        return res.status(400).json({ message: "All fields are required." });
    }

    const query = `
        INSERT INTO design (
            project_id, 
            requirement_id, 
            design_type, 
            diagram_name, 
            diagram_type, 
            design_description, 
            design_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        project_id,
        JSON.stringify(requirement_id), // Store as JSON
        design_type,
        diagram_name,
        diagram_type,
        design_description,
        design_status,
    ], (err, results) => {
        if (err) {
            console.error("Error inserting design:", err);
            return res.status(500).json({ message: "Failed to create design." });
        }

        res.status(201).json({ message: "Design created successfully.", design_id: results.insertId });
    });
});

app.post("/uploadDesignFiles", upload.array("files"), (req, res) => {
    const { design_id } = req.body;

    if (!design_id || !req.files) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const insertFilesQuery = `
        INSERT INTO file_design (design_id, file_design_data, create_at, update_at) 
        VALUES (?, ?, NOW(), NOW())
    `;

    req.files.forEach((file) => {
        db.query(insertFilesQuery, [design_id, file.buffer], (err) => {
            if (err) {
                console.error("Error inserting files:", err);
                return res.status(500).json({ message: "Failed to save file references." });
            }
        });
    });

    res.status(200).json({ message: "Files uploaded successfully." });
});

// Get Designs by Project ID
app.get("/design", (req, res) => {
    const { project_id, status } = req.query;
    if (!project_id) return res.status(400).json({ error: "Project ID is required." });

    let query = `SELECT * FROM design WHERE project_id = ?`;
    const params = [project_id];

    if (status) {
        query += " AND design_status = ?";
        params.push(status);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("Error fetching designs:", err);
            res.status(500).json({ error: "Failed to fetch designs" });
        } else {
            res.status(200).json(results);
        }
    });
});

// Update Design Status
app.put("/statusdesign", (req, res) => {
    const { id } = req.params;
    const { design_status } = req.body;
    const sql = "UPDATE design SET design_status = ? WHERE design_id = ?";

    db.query(sql, [design_status, id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating design status" });
        }
        return res.status(200).json({ message: "Design status updated successfully" });
    });
});

//----------------------------------------- DESIGN HISTORY -----------------------------------------------------
// Add History Design
app.post("/addHistoryDesign", (req, res) => {
    const { design_id, design_status } = req.body;

    if (!design_id || !design_status) {
        return res.status(400).json({ message: "กรุณาระบุ 'design_id' และ 'design_status'" });
    }

    const sql = `
        INSERT INTO historydesign (design_id, design_status, design_at)
        VALUES (?, ?, NOW())
    `;

    db.query(sql, [design_id, design_status], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลประวัติการออกแบบได้" });
        }

        console.log(`📜 History added for Design ID: ${design_id} with status: ${design_status}`);
        return res.status(200).json({ message: "บันทึกประวัติการออกแบบสำเร็จ!", insertedId: result.insertId });
    });
});

// Get History by Design ID
app.get('/getHistoryByDesignId', (req, res) => {
    const design_id = req.query.design_id;
    if (!design_id) return res.status(400).json({ message: "กรุณาระบุ 'design_id'" });

    const sql = `
        SELECT * FROM historydesign
        WHERE design_id = ?
        ORDER BY design_at ASC
    `;

    db.query(sql, [design_id], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: "ไม่สามารถดึงข้อมูลประวัติการออกแบบได้" });
        }

        return res.status(200).json({ message: "ดึงข้อมูลสำเร็จ!", data: results });
    });
});


//----------------------------------------- DESIGN CRITERIA -----------------------------------------------------
// Fetch all criteria
app.get('/designcriteria', (req, res) => {
    const sql = "SELECT * FROM designcriteria";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching Design Criteria:', err);
            return res.status(500).send('Error fetching Design Criteria');
        }
        res.json(result);
    });
});

// Add new criteria
app.post('/designcriteria', (req, res) => {
    const { design_cri_name } = req.body;

    if (!design_cri_name || design_cri_name.trim() === "") {
        return res.status(400).json({ message: "Criteria name is required" });
    }

    const sql = "INSERT INTO designcriteria (design_cri_name) VALUES (?)";
    db.query(sql, [design_cri_name], (err, result) => {
        if (err) {
            console.error('Error creating criteria:', err);
            return res.status(500).json({ message: "Error creating criteria" });
        }
        res.status(201).json({ message: "Criteria created successfully", data: result });
    });
});

// Update criteria
app.put('/updatedesigncriteria', (req, res) => {
    const { design_cri_name } = req.body;
    const { id } = req.params;

    if (!design_cri_name || design_cri_name.trim() === "") {
        return res.status(400).json({ message: "Criteria name is required" });
    }

    const sql = "UPDATE designcriteria SET design_cri_name = ? WHERE design_cri_name = ?";
    db.query(sql, [design_cri_name, id], (err, result) => {
        if (err) {
            console.error('Error updating criteria:', err);
            return res.status(500).json({ message: "Error updating criteria" });
        }
        res.status(200).json({ message: "Criteria updated successfully", data: result });
    });
});

// Delete criteria
app.delete('/deletedesigncriteria', (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT * FROM designcriteria WHERE design_cri_name = ?";
    const deleteSql = "DELETE FROM designcriteria WHERE design_cri_name = ?";

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

//----------------------------------------- VERIFICATION DESIGN -----------------------------------------------------
// Create Veridesign
app.post("/createveridesign", (req, res) => {
    const veridesignData = req.body;
    if (!Array.isArray(veridesignData) || veridesignData.length === 0) {
        return res.status(400).json({ message: "Invalid data format or empty array." });
    }

    // ดึงค่า veridesign_round ล่าสุดของ project_id นี้
    const projectId = veridesignData[0].project_id; // สมมติว่าใช้ project_id ตัวแรกเป็นตัวอ้างอิง
    const getLatestRoundQuery = `SELECT MAX(veridesign_round) AS latestRound FROM veridesign WHERE project_id = ?`;

    db.query(getLatestRoundQuery, [projectId], (err, results) => {
        if (err) {
            console.error("Error fetching latest veridesign_round:", err);
            return res.status(500).json({ message: "Failed to fetch latest veridesign_round." });
        }

        // ถ้ายังไม่มีข้อมูล ให้เริ่มต้นจาก 1
        const latestRound = results[0].latestRound || 0;
        let nextRound = latestRound + 1;

        const query =
            `INSERT INTO veridesign (project_id, veridesign_round, create_by, design_id, veridesign_at, veridesign_by) VALUES ?`;

        const formatDateTime = (date) => {
            const d = new Date(date);
            return d.toISOString().slice(0, 19).replace("T", " ");
        };

        const values = veridesignData.map((item) => [
            item.project_id,
            nextRound,  // เพิ่มรอบแบบอัตโนมัติ
            item.create_by,
            item.design_id,
            formatDateTime(item.veridesign_at),
            JSON.stringify(item.veridesign_by),
        ]);

        db.query(query, [values], (err, result) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).json({ message: "Failed to create veridesign records." });
            }

            res.status(201).json({
                message: "Veridesign records created successfully.",
                affectedRows: result.affectedRows,
            });
        });
    });
});

// ดึงข้อมูล req_design ที่มี status working
app.get("/veridesign", (req, res) => {
    const { project_id } = req.query;

    if (!project_id) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    const query = `
      SELECT * 
      FROM design 
      WHERE project_id = ? AND design_status = 'WORKING';
    `;

    db.query(query, [project_id], (err, results) => {
        if (err) {
            console.error("Error fetching designs:", err);
            res.status(500).json({ error: "Failed to fetch designs" });
        } else {
            res.status(200).json(results);
        }
    });
});

// ดึงข้อมูล req_design ที่มี WAITING FOR VERIFICATION
app.get("/verilistdesign", (req, res) => {
    const { project_id } = req.query;

    if (!project_id) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    let query = `
SELECT 
    vd.veridesign_id,  
    vd.veridesign_round,
    vd.create_by,
    vd.veridesign_at,
    GROUP_CONCAT(d.design_id) AS design_ids,
    d.design_status,
    vd.veridesign_by
FROM 
    veridesign vd
LEFT JOIN 
    design d ON vd.design_id = d.design_id
WHERE 
    vd.project_id = ?
GROUP BY 
    vd.veridesign_id, vd.veridesign_round, vd.create_by, vd.veridesign_at, d.design_status, vd.veridesign_by  -- Include veridesign_id in GROUP BY
ORDER BY 
    vd.veridesign_round ASC
LIMIT 25;

    `;

    db.query(query, [project_id], (err, results) => {
        if (err) {
            console.error("❌ Error fetching designs:", err);
            res.status(500).json({ error: "Failed to fetch designs" });
        } else {
            const processedResults = results.map((design) => {
                let veridesignByObject = {};

                try {
                    veridesignByObject = JSON.parse(design.veridesign_by || "{}");

                    // ตรวจสอบว่าถ้าข้อมูลเป็นอาเรย์ ให้นำมาสร้างเป็น object พร้อมสถานะ
                    if (Array.isArray(veridesignByObject)) {
                        veridesignByObject = veridesignByObject.reduce((acc, reviewer) => {
                            acc[reviewer] = false; // ตั้งสถานะ default เป็น false
                            return acc;
                        }, {});
                    }
                } catch (error) {
                    console.error("Error parsing veridesign_by:", error);
                    veridesignByObject = {}; // หากเกิดข้อผิดพลาดให้เป็น object ว่าง
                }

                return {
                    ...design,
                    veridesign_by: veridesignByObject
                };
            });

            console.log("🎨 VeriDesign Response:", processedResults);
            res.status(200).json(processedResults);
        }
    });
});

app.put('/update-veridesign-by', (req, res) => {
    const { veridesign_id, veridesign_by } = req.body;

    if (!veridesign_id || !veridesign_by || typeof veridesign_by !== 'object') {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า veridesign_id มีอยู่ในฐานข้อมูลหรือไม่
    const checkSql = 'SELECT * FROM veridesign WHERE veridesign_id = ?';
    db.query(checkSql, [veridesign_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking veridesign ID:", checkErr);
            return res.status(500).json({ message: "ข้อผิดพลาดในการตรวจสอบข้อมูล" });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูล veridesign นี้ในฐานข้อมูล" });
        }

        // ดึงข้อมูล veridesign_by ที่มีอยู่แล้ว
        let currentVeridesignBy = checkResult[0].veridesign_by ? JSON.parse(checkResult[0].veridesign_by) : {};

        // รวมข้อมูลใหม่กับข้อมูลเดิม โดยไม่ลบข้อมูลที่มีอยู่แล้ว
        const updatedVeridesignBy = { ...currentVeridesignBy, ...veridesign_by };

        // อัปเดต veridesign_by ในฐานข้อมูล
        const sql = `
          UPDATE veridesign
          SET veridesign_by = ?
          WHERE veridesign_id = ?
        `;

        db.query(sql, [JSON.stringify(updatedVeridesignBy), veridesign_id], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "ไม่สามารถอัปเดตข้อมูล veridesign_by ได้" });
            }

            res.status(200).json({ message: "อัปเดตข้อมูล veridesign_by สำเร็จ" });
        });
    });
});


// get ข้อมูลเฉพาะเมื่อกดที่ verify ในหน้า View Verification
app.get("/verifydesign", (req, res) => {
    const { design_id } = req.query;
    const designIdsArray = design_id.split(",");
    let query = `SELECT * FROM design WHERE design_id IN (?)`;

    db.query(query, [designIdsArray], (err, results) => {
        if (err) {
            console.error("Error fetching designs:", err);
            res.status(500).json({ error: "Failed to fetch designs" });
        } else {
            res.status(200).json(results);
        }
    });
});

app.get('/designveri', (req, res) => {
    const { project_id, veridesign_id, design_id } = req.query;

    let sql = `
      SELECT DISTINCT
        vd.veridesign_id AS id,
        vd.create_by,
        vd.veridesign_at,
        vd.veridesign_by,
        d.design_id,
        d.design_type,
        d.diagram_name,
        d.diagram_type,
        d.design_description,
        d.design_status,
        d.requirement_id
      FROM veridesign vd
      LEFT JOIN design d 
        ON vd.design_id = d.design_id
      WHERE vd.project_id = ?
    `;

    const params = [project_id];

    if (veridesign_id) {
        sql += ` AND vd.veridesign_id = ?`;
        params.push(veridesign_id);
    }

    if (design_id) {
        // แยก string "90,91" เป็น Array ["90", "91"]
        const designIds = design_id.split(',').map(item => item.trim());
        if (designIds.length > 0) {
            sql += ` AND d.design_id IN (${designIds.map(() => '?').join(',')})`;
            params.push(...designIds);
        }
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error fetching design verification data.", error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No design verification data found." });
        }

        // Grouping ผลลัพธ์ตาม veridesign_id (ที่เรา alias เป็น id)
        const grouped = {};

        result.forEach((row) => {
            const veridesignId = row.id; // ใช้เป็น key ในการ grouping
            if (!grouped[veridesignId]) {
                grouped[veridesignId] = {
                    id: veridesignId,
                    create_by: row.create_by,
                    veridesign_at: row.veridesign_at,
                    veridesign_by: row.veridesign_by ? JSON.parse(row.veridesign_by) : [],
                    design_ids: [], // จะเก็บลิสต์ของ design_id ที่เกี่ยวข้อง
                    design_type: row.design_type,
                    diagram_name: row.diagram_name,
                    diagram_type: row.diagram_type,
                    design_description: row.design_description,
                    design_status: row.design_status,
                    requirements: row.requirement_id ? JSON.parse(row.requirement_id) : [],
                };
            }
            // เพิ่ม design_id ลงใน array ถ้ายังไม่มีและมีค่า
            if (row.design_id && !grouped[veridesignId].design_ids.includes(row.design_id)) {
                grouped[veridesignId].design_ids.push(row.design_id);
            }
        });

        // แปลง object ที่ grouped เป็น array
        const designVerifications = Object.values(grouped);

        return res.status(200).json(designVerifications);
    });
});


// Update status waitingforveri ของ design
app.put('/update-design-status-waitingfor-ver/:id', (req, res) => {
    const { id } = req.params;
    const { design_status } = req.body;

    if (!design_status) {
        return res.status(400).json({ message: "Missing design_status field." });
    }

    const query = `
      UPDATE design
      SET design_status = ?
      WHERE design_id = ?
    `;

    db.query(query, [design_status, id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Design not found." });
        }

        res.status(200).json({ message: "Design status updated successfully." });
    });
});

app.put('/update-design-status-verified', (req, res) => {
    const { design_ids, design_status } = req.body; // design_ids ควรเป็น Array
    if (!Array.isArray(design_ids) || design_ids.length === 0) {
        return res.status(400).json({ message: "design_ids is required and should be a non-empty array." });
    }

    // สร้าง placeholders สำหรับ Array
    const placeholders = design_ids.map(() => '?').join(',');
    const sql = `
      UPDATE design
      SET design_status = ?
      WHERE design_id IN (${placeholders})
    `;

    // พารามิเตอร์จะเป็น design_status ตามด้วย design_ids ทั้งหมด
    const params = [design_status, ...design_ids];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No design found with the provided design_ids." });
        }
        res.status(200).json({ message: "Design status updated to VERIFIED successfully." });
    });
});

app.put('/update-veridesign-by', (req, res) => {
    const { veridesign_id, veridesign_by } = req.body;

    if (!veridesign_id || typeof veridesign_by !== 'object') {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า veridesign_id มีอยู่ในฐานข้อมูลหรือไม่
    const checkSql = 'SELECT veridesign_id FROM veridesign WHERE veridesign_id = ?';
    db.query(checkSql, [veridesign_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking veridesign_id:", checkErr);
            return res.status(500).json({ message: "ข้อผิดพลาดในการตรวจสอบข้อมูล" });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูล veridesign นี้ในฐานข้อมูล" });
        }

        // อัปเดตข้อมูล veridesign_by
        const sql = `
          UPDATE veridesign
          SET veridesign_by = ?
          WHERE veridesign_id = ?`;

        db.query(sql, [JSON.stringify(veridesign_by), veridesign_id], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "ไม่สามารถอัปเดตข้อมูล veridesign_by ได้" });
            }

            res.status(200).json({
                message: "อัปเดตข้อมูล veridesign_by สำเร็จ",
                veridesign_id: veridesign_id
            });
        });
    });
});


// ------------------------- Comment VeriDesign --------------------------------

// Fetch comments for a specific veriDesign
app.get('/get-commentveridesign', (req, res) => {
    const { veridesign_id } = req.query;

    // Check if veridesign_id is provided
    if (!veridesign_id) {
        return res.status(400).json({ error: "veridesign_id is required" });
    }

    console.log('Fetching comments for veridesign_id:', veridesign_id);

    // SQL query to fetch comments based on veridesign_id
    const sql = `
        SELECT 
            comverdesign_id,
            member_name,
            comverdesign_text,
            comverdesign_at
        FROM 
            comment_veridesign
        WHERE 
            veridesign_id = ?
        ORDER BY 
            comverdesign_at DESC
    `;

    db.query(sql, [veridesign_id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Error fetching comments", details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "No comments found" });
        }

        // Return comments in the response
        res.status(200).json(results);
    });
});

// Add a comment to a specific veriDesign
app.post('/commentveridesign', (req, res) => {
    const { member_name, comverdesign_text, veridesign_id } = req.body;
    console.log('Received data:', req.body);

    // SQL query to insert a new comment
    const sql = 'INSERT INTO comment_veridesign (member_name, comverdesign_text, veridesign_id) VALUES (?, ?, ?)';

    db.query(sql, [member_name, comverdesign_text, veridesign_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error adding comment');
        }

        res.status(201).send('Comment added successfully');
    });
});

// Delete a specific comment by comverdesign_id
app.delete("/delete-commentveridesign/:comverdesign_id", (req, res) => {
    const { comverdesign_id } = req.params;

    // Check if comverdesign_id is provided
    if (!comverdesign_id) {
        return res.status(400).json({ error: "comverdesign_id is required" });
    }

    console.log(`Deleting comment with ID: ${comverdesign_id}`);

    // SQL query to delete the comment
    const sql = "DELETE FROM comment_veridesign WHERE comverdesign_id = ?";

    db.query(sql, [comverdesign_id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Error deleting comment", details: err.message });
        }

        // Check if the comment was found and deleted
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Return success message
        res.status(200).json({ message: "Comment deleted successfully" });
    });
});




// ------------------------- Design Baseline -------------------------
// API สำหรับสร้าง Design Baseline
app.post('/createdesignbaseline', (req, res) => {
    const { design_id } = req.body;

    if (!Array.isArray(design_id) || design_id.length === 0) {
        return res.status(400).json({ message: "Design ID is required and should be a non-empty array" });
    }

    // ดึงค่า baselinedesign_round ล่าสุดของทุก design_id ที่มีอยู่ในระบบ
    const findLatestBaselineRoundQuery = `
        SELECT COALESCE(MAX(baselinedesign_round), 0) AS latest_baselinedesign_round FROM baselinedesign
    `;

    db.query(findLatestBaselineRoundQuery, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Failed to fetch latest baseline round", details: err.message });
        }

        // ใช้ค่า baselinedesign_round ล่าสุด +1 (ใช้เลขเดียวกันทั้งหมด)
        const nextRound = (results[0].latest_baselinedesign_round || 0) + 1;
        console.log("Next baseline round:", nextRound);

        const formattedDate = new Date().toISOString().slice(0, 19).replace("T", " ");

        // ใช้ round เดียวกันทั้งหมด
        const baselineValues = design_id.map(id => [
            id,
            nextRound, // ใช้เลขเดียวกันหมด
            formattedDate
        ]);

        console.log("Baseline values to insert:", baselineValues); // Debugging

        const insertBaselineQuery = `
            INSERT INTO baselinedesign (design_id, baselinedesign_round, baselinedesign_at) VALUES ?
        `;

        db.query(insertBaselineQuery, [baselineValues], (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Insert error:", insertErr);
                return res.status(500).json({ message: "Failed to insert baseline", details: insertErr.message });
            }

            // อัปเดตสถานะ design เป็น 'BASELINE'
            const updateDesignQuery = `UPDATE design SET design_status = 'BASELINE' WHERE design_id IN (?)`;

            db.query(updateDesignQuery, [design_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Update error:", updateErr);
                    return res.status(500).json({ message: "Failed to update design status", details: updateErr.message });
                }

                res.status(201).json({
                    message: "Baseline created successfully",
                    insertedRows: insertResult.affectedRows,
                    updatedDesigns: updateResult.affectedRows,
                    baselinedesign: baselineValues
                });
            });
        });
    });
});



// ดึง Design ที่มีสถานะ VERIFIED สำหรับ Project ID
app.get("/designverified/:projectId", (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

    const sql = `SELECT * FROM design WHERE project_id = ? AND design_status = 'VERIFIED'`;

    db.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error("Error fetching designs:", err);
            return res.status(500).json({ message: "Failed to fetch designs." });
        }
        res.json(results);
    });
});

// ดึงข้อมูล Design Baseline ตาม Project ID
app.get("/designbaseline", (req, res) => {
    const { project_id } = req.query;
    console.log("Received project_id:", project_id);

    if (!project_id) {
        return res.status(400).json({ error: "Project ID is required" });
    }
    const sql = `
        SELECT 
            b.baselinedesign_id, 
            b.design_id, 
            b.baselinedesign_round, 
            b.baselinedesign_at
        FROM baselinedesign b
        JOIN design d ON b.design_id = d.design_id
        WHERE d.project_id = ?
        GROUP BY b.baselinedesign_id
    `;

    db.query(sql, [project_id], (err, results) => {
        if (err) {
            console.error("Error fetching baselines:", err);
            return res.status(500).json({ error: "Failed to fetch baselines" });
        }

        console.log("Fetched baselines:", results);

        const formattedResults = results.map((row) => ({
            baselinedesign_id: row.baselinedesign_id,
            design_id: row.design_id,
            baselinedesign_round: row.baselinedesign_round,
            baselinedesign_at: row.baselinedesign_at
        }));

        res.json(formattedResults);
    });
});

//--------------------------IMPLEMENT----------------------------------
app.post('/implementrelation', (req, res) => {
    const { data } = req.body; // รับข้อมูลเป็น array

    console.log('Request body:', JSON.stringify(data, null, 2));

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    const query = `INSERT INTO implementation (implement_filename, design_id) VALUES (?, ?)`;

    const promises = data.flatMap(({ implement_filename, design_ids }) => {
        if (!implement_filename || !Array.isArray(design_ids) || design_ids.length === 0) {
            console.error('Invalid input:', implement_filename, design_ids);
            return [];
        }

        return design_ids.map(design_id => {
            const parsedId = Number(design_id); // 🔹 แปลงเป็นตัวเลข
            if (!Number.isInteger(parsedId)) {
                console.error(`Invalid design_id: ${design_id}`);
                return Promise.reject(new Error('Invalid design_id'));
            }

            return new Promise((resolve, reject) => {
                db.query(query, [implement_filename, parsedId], (err, result) => {
                    if (err) {
                        console.error('Error inserting data:', err.sqlMessage || err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    });

    Promise.all(promises)
        .then(() => {
            res.status(201).json({ message: 'Implementations added successfully' });
        })
        .catch((err) => {
            console.error('Error with database operation:', err);
            res.status(500).json({ error: 'Database error' });
        });
});


// ------------------------- TEST CASE -------------------------------
app.get("/project/:projectId/attachments", (req, res) => {
    const { projectId } = req.params;

    const queryRequirements = `
        SELECT requirement_id, requirement_name, requirement_status 
        FROM requirement 
        WHERE project_id = ? AND requirement_status = 'BASELINE'
        LIMIT 25;
    `;

    const queryDesigns = `
        SELECT design_id, diagram_name, design_status 
        FROM design 
        WHERE project_id = ? AND design_status = 'BASELINE'
        LIMIT 25;
    `;

    db.query(queryRequirements, [projectId], (err, reqResults) => {
        if (err) {
            console.error("Error fetching requirements:", err);
            return res.status(500).json({ message: "Failed to fetch requirements." });
        }

        db.query(queryDesigns, [projectId], (err, designResults) => {
            if (err) {
                console.error("Error fetching designs:", err);
                return res.status(500).json({ message: "Failed to fetch designs." });
            }

            res.json({
                requirements: reqResults,
                designs: designResults
            });
        });
    });
});

app.post("/testcases", (req, res) => {
    const { testcase_name, testcase_des, testcase_type, testcase_priority, testcase_by, testcase_at, testcase_attach } = req.body;
    let { testcase_status } = req.body;

    if (!testcase_status) {
        testcase_status = "WORKING"; // ✅ กำหนดค่าเริ่มต้นถ้าไม่มีค่า
    }

    const sql = `
        INSERT INTO testcase (testcase_name, testcase_des, testcase_type, testcase_priority, testcase_by, testcase_at, testcase_attach, testcase_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [testcase_name, testcase_des, testcase_type, testcase_priority, testcase_by, testcase_at, testcase_attach, testcase_status], (err, result) => {
        if (err) {
            console.error("❌ Error inserting test case:", err);
            return res.status(500).json({ error: "Failed to insert test case" });
        }

        const testcase_id = result.insertId; // ✅ ดึง ID ของ Test Case ที่เพิ่มไป

        // ✅ เพิ่มข้อมูลลง table test_execution
        const executionSql = `
            INSERT INTO test_execution (testcase_id, test_execution_status) 
            VALUES (?, 'IN PROGRESS')`;

        db.query(executionSql, [testcase_id], (execErr, execResult) => {
            if (execErr) {
                console.error("❌ Error inserting test execution:", execErr);
                return res.status(500).json({ error: "Failed to insert test execution" });
            }

            console.log("✅ Test Execution Inserted:", execResult);
            res.status(201).json({ 
                message: "Test Case and Execution created successfully", 
                testcase_id, 
                test_execution_id: execResult.insertId 
            });
        });
    });
});


app.get("/testcases", (req, res) => {
    const sql = "SELECT * FROM testcase";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        res.json(results);
    });
});



//---------------------------- TEST EXECUTION ------------------------------
// อัปเดต API ให้ดึง testcase_name
app.get("/api/testcase_executions", (req, res) => {
    const query = `
      SELECT 
        t.testcase_id, 
        te.test_execution_status, 
        t.testcase_name, 
        t.testcase_at
      FROM testcase t
      LEFT JOIN test_execution te ON t.testcase_id = te.testcase_id;
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Database Query Error:", err);
        return res.status(500).json({ error: "Database query failed" });
      }
      res.json(results);
    });
  });

  // API สำหรับดึงข้อมูล Test Execution
  app.get("/api/test_procedures/:testcase_id", (req, res) => {
    const { testcase_id } = req.params;
    const query = `
      SELECT 
          tp.test_procedures_id,
          tp.testcase_id,
          tc.testcase_at,  -- ดึงข้อมูลจากตาราง testcase
          tp.required_action,
          tp.expected_result,
          tp.prerequisite,
          tp.test_status,
          tp.actual_result, 
          te.test_execution_status
      FROM test_procedures tp
      INNER JOIN test_execution te ON tp.testcase_id = te.testcase_id
      INNER JOIN testcase tc ON tp.testcase_id = tc.testcase_id
      WHERE tp.testcase_id = ?
      LIMIT 0, 25;
    `;
  
    db.query(query, [testcase_id], (err, results) => {
      if (err) {
        console.error("Error fetching test procedures:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    });
  });

  app.post("/api/update_test_execution", (req, res) => {
    const { testSteps } = req.body;
  
    if (!testSteps || testSteps.length === 0) {
      return res.status(400).json({ error: "No test steps provided" });
    }
  
    const query = `
      UPDATE test_procedures 
      SET test_status = ?, actual_result = ? 
      WHERE test_procedures_id = ?
    `;
  
    testSteps.forEach((step) => {
      db.query(query, [step.test_status, step.actual_result, step.test_procedures_id], (err) => {
        if (err) {
          console.error("Error updating test execution:", err);
          return res.status(500).json({ error: "Database update error" });
        }
      });
    });
  
    res.json({ message: "Test execution updated successfully!" });
  });

// --------------------------- TestProcedures -------------------------------

// ✅ ดึง test_procedures ตาม testcase_id 
app.get("/api/test-procedures", (req, res) => {
    const { testcase_id } = req.query;
    const sql = `SELECT * FROM test_procedures WHERE testcase_id = ?`;

    db.query(sql, [testcase_id], (err, result) => {
        if (err) {
            console.error("Error fetching test procedures:", err);
            res.status(500).json({ error: "Failed to fetch test procedures" });
        } else {
            console.log("Fetched Test Procedures:", result);
            res.status(200).json(result);
        }
    });
});

// ✅ เพิ่ม test_procedure ใหม่
app.post("/api/test-procedures", (req, res) => {
    const { testcase_id, required_action, expected_result, prerequisite } = req.body;
    
    // กำหนดค่าเริ่มต้นให้ test_status และ actual_result ถ้ายังไม่มี
    const test_status = req.body.test_status || ""; 
    const actual_result = req.body.actual_result || ""; 

    const insertSql = `
    INSERT INTO test_procedures (testcase_id, required_action, expected_result, prerequisite, test_status, actual_result) 
    VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(insertSql, [testcase_id, required_action, expected_result, prerequisite, test_status, actual_result], (err, result) => {
        if (err) {
            console.error("Insert Error:", err);
            return res.status(500).json({ error: "Insert failed" });
        }

        // ดึงข้อมูลที่เพิ่งเพิ่มมาแสดงกลับไป
        const newId = result.insertId;
        const selectSql = "SELECT * FROM test_procedures WHERE test_procedures_id = ?";

        db.query(selectSql, [newId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch new data" });
            }
            res.status(201).json(rows[0]); // ส่งข้อมูลที่เพิ่มกลับไป
        });
    });
});


// ✅ อัปเดต test_procedure
app.put("/api/test-procedures/:id", (req, res) => {
    const { id } = req.params;
    const { required_action, test_objective, expected_result, prerequisite } = req.body;

    const sql = `
        UPDATE test_procedures 
        SET required_action = ?, test_objective = ?, expected_result = ?, prerequisite = ? 
        WHERE test_procedures_id = ?`;

    db.query(sql, [required_action, test_objective, expected_result, prerequisite, id], (err, result) => {
        if (err) {
            console.error("Error updating test procedure:", err);
            res.status(500).json({ error: "Failed to update test procedure" });
        } else {
            res.status(200).json({ message: "Test procedure updated successfully" });
        }
    });
});

// ✅ ลบ test_procedure
app.delete("/api/test-procedures/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM test_procedures WHERE test_procedures_id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Delete Error:", err);
            return res.status(500).json({ error: "Delete failed" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Test procedure not found" });
        }
        res.json({ message: "Test procedure deleted successfully!" });
    });
});

//----------------------------------------- TESTCASE HISTORY -----------------------------------------------------
// Add History Testcase
app.post("/addHistoryTestcase", (req, res) => {
    const { testcase_id, testcase_status } = req.body;

    if (!testcase_id || !testcase_status) {
        return res.status(400).json({ message: "กรุณาระบุ 'testcase_id' และ 'testcase_status'" });
    }

    const sql = `
        INSERT INTO historytestcase (testcase_id, testcase_status, testcase_at)
        VALUES (?, ?, NOW())
    `;

    db.query(sql, [testcase_id, testcase_status], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลประวัติการออกแบบได้", error: err });
        }

        console.log(`📜 History added for testcase ID: ${testcase_id} with status: ${testcase_status}`);
        return res.status(201).json({ message: "บันทึกประวัติการออกแบบสำเร็จ!", insertedId: result.insertId });
    });
});

// Get History by Testcase ID
app.get('/getHistoryByTestcaseId', (req, res) => {
    const testcase_id = req.query.testcase_id;
    if (!testcase_id) return res.status(400).json({ message: "กรุณาระบุ 'testcase_id'" });

    const sql = `
        SELECT * FROM historytestcase
        WHERE testcase_id = ?
        ORDER BY testcase_at ASC
    `;

    db.query(sql, [testcase_id], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: "ไม่สามารถดึงข้อมูลประวัติการออกแบบได้" });
        }

        return res.status(200).json({ message: "ดึงข้อมูลสำเร็จ!", data: results });
    });
});


// ------------------------- VERITESTCASE -------------------------
app.post("/createveritestcase", (req, res) => {
    const veritestcaseData = req.body;
    if (!Array.isArray(veritestcaseData) || veritestcaseData.length === 0) {
        return res.status(400).json({ message: "Invalid data format or empty array." });
    }

    const projectId = veritestcaseData[0].project_id;
    const getLatestRoundQuery = `SELECT MAX(veritestcase_round) AS latestRound FROM veritestcase WHERE project_id = ?`;

    db.query(getLatestRoundQuery, [projectId], (err, results) => {
        if (err) {
            console.error("Error fetching latest veritestcase_round:", err);
            return res.status(500).json({ message: "Failed to fetch latest veritestcase_round." });
        }

        const latestRound = results[0].latestRound || 0;
        let nextRound = latestRound + 1;

        const query =
            `INSERT INTO veritestcase (project_id, veritestcase_round, create_by, testcase_id, veritestcase_at, veritestcase_by) VALUES ?`;

        const formatDateTime = (date) => {
            const d = new Date(date);
            return d.toISOString().slice(0, 19).replace("T", " ");
        };

        const values = veritestcaseData.map((item) => [
            item.project_id,
            nextRound,
            item.create_by,
            item.testcase_id,
            formatDateTime(item.veritestcase_at),
            JSON.stringify(item.veritestcase_by),
        ]);

        db.query(query, [values], (err, result) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).json({ message: "Failed to create veritestcase records." });
            }

            res.status(201).json({
                message: "Veritestcase records created successfully.",
                affectedRows: result.affectedRows,
            });
        });
    });
});

// ดึงข้อมูล req_testcase ที่มี status working
app.get("/veritestcase", (req, res) => {
    const { project_id } = req.query;

    if (!project_id) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    const query = `
      SELECT * 
      FROM testcase 
      WHERE project_id = ? AND BINARY testcase_status = 'WORKING';
    `;

    db.query(query, [Number(project_id)], (err, results) => {
        if (err) {
            console.error("Error fetching testcase:", err);
            return res.status(500).json({ error: "Failed to fetch testcase" });
        }
        console.log("Fetched TestCases:", results);
        res.status(200).json(results);
    });
});

app.get("/verilisttestcase", (req, res) => {
    const { project_id } = req.query;

    if (!project_id) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    let query = `
      SELECT 
          vt.veritestcase_id,  
          vt.veritestcase_round,
          vt.create_by,
          vt.veritestcase_at,
          vt.testcase_id,
          vt.veritestcase_by,
          tc.testcase_status
      FROM 
          veritestcase vt
      LEFT JOIN 
          testcase tc ON vt.testcase_id = tc.testcase_id
      WHERE 
          vt.project_id = ? AND tc.testcase_status = "WAITING FOR VERIFICATION"
      ORDER BY 
          vt.veritestcase_round ASC
      LIMIT 25;
    `;

    db.query(query, [project_id], (err, results) => {
        if (err) {
            console.error("❌ Error fetching testcases:", err);
            res.status(500).json({ error: "Failed to fetch testcases" });
        } else {
            const processedResults = results.map((testcase) => {
                let veritestcaseByObject = {};

                try {
                    veritestcaseByObject = JSON.parse(testcase.veritestcase_by || "{}");
                } catch (error) {
                    console.error("Error parsing veritestcase_by:", error);
                    veritestcaseByObject = {};
                }

                return {
                    ...testcase,
                    veritestcase_by: veritestcaseByObject
                };
            });

            console.log("✅ VeriTestcase Response:", processedResults);
            res.status(200).json(processedResults);
        }
    });
});

app.get('/testcaseveri', (req, res) => {
    const { project_id, veritestcaseId, testcase_id } = req.query;

    let sql = `
      SELECT DISTINCT
        vd.veritestcase_id AS id,
        vd.create_by,
        vd.veritestcase_at,
        vd.veritestcase_by,
        d.testcase_id,
        d.testcase_type,
        d.testcase_name,
        d.testcase_des,
        d.testcase_status,
        d.requirement_id
      FROM veritestcase vd
      LEFT JOIN testcase d 
        ON vd.testcase_id = d.testcase_id
      WHERE vd.project_id = ?
    `;

    const params = [project_id];

    if (veritestcase_id) {
        sql += ` AND vd.veritestcase_id = ?`;
        params.push(veritestcase_id);
    }

    if (testcase_id) {
        // แยก string "90,91" เป็น Array ["90", "91"]
        const testcaseIds = testcase_id.split(',').map(item => item.trim());
        if (testcaseIds.length > 0) {
            sql += ` AND d.testcase_id IN (${testcaseIds.map(() => '?').join(',')})`;
            params.push(...testcaseIds);
        }
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error fetching testcase verification data.", error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No testcase verification data found." });
        }

        // Grouping ผลลัพธ์ตาม veritestcase_id (ที่เรา alias เป็น id)
        const grouped = {};

        result.forEach((row) => {
            const veritestcase_Id = row.id; // ใช้เป็น key ในการ grouping
            if (!grouped[veritestcaseId]) {
                grouped[veritestcaseId] = {
                    id: veritestcaseId,
                    create_by: row.create_by,
                    veritestcase_at: row.veritestcase_at,
                    veritestcase_by: row.veritestcase_by ? JSON.parse(row.veritestcase_by) : [],
                    testcase_ids: [], // จะเก็บลิสต์ของ testcase_id ที่เกี่ยวข้อง
                    testcase_type: row.testcase_type,
                    testcase_name: row.testcase_name,
                    testcase_type: row.testcase_type,
                    testcase_description: row.testcase_description,
                    testcase_status: row.testcase_status,
                    requirements: row.requirement_id ? JSON.parse(row.requirement_id) : [],
                };
            }
            // เพิ่ม testcase_id ลงใน array ถ้ายังไม่มีและมีค่า
            if (row.testcase_id && !grouped[veritestcase_Id].testcase_ids.includes(row.testcase_id)) {
                grouped[veritestcase_Id].testcase_ids.push(row.testcase_id);
            }
        });

        // แปลง object ที่ grouped เป็น array
        const testcaseVerifications = Object.values(grouped);

        return res.status(200).json(testcaseVerifications);
    });
});

// Update status waitingforveri ของ testcase
app.put('/update-testcase-status-waitingfor-ver/:id', (req, res) => {
    const { id } = req.params;
    const { testcase_status } = req.body;

    if (!testcase_status) {
        return res.status(400).json({ message: "Missing testcase_status field." });
    }

    const query = `
      UPDATE testcase
      SET testcase_status = ?
      WHERE testcase_id = ?
    `;

    db.query(query, [testcase_status, id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Testcase not found." });
        }

        res.status(200).json({ message: "Testcase status updated successfully." });
    });
});

app.put('/update-testcase-status-verified', (req, res) => {
    const { testcase_ids, testcase_status } = req.body; // testcase_ids ควรเป็น Array
    if (!Array.isArray(testcase_ids) || testcase_ids.length === 0) {
        return res.status(400).json({ message: "testcase_ids is required and should be a non-empty array." });
    }

    // สร้าง placeholders สำหรับ Array
    const placeholders = testcase_ids.map(() => '?').join(',');
    const sql = `
      UPDATE testcase
      SET testcase_status = ?
      WHERE testcase_id IN (${placeholders})
    `;

    // พารามิเตอร์จะเป็น testcase_status ตามด้วย testcase_ids ทั้งหมด
    const params = [testcase_status, ...testcase_ids];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No testcase found with the provided testcase_ids." });
        }
        res.status(200).json({ message: "testcase status updated to VERIFIED successfully." });
    });
});

app.put('/update-veritestcase-by', (req, res) => {
    const { veritestcase_id, veritestcase_by } = req.body;

    if (!veritestcase_id || typeof veritestcase_by !== 'object') {
        return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า veritestcase_id มีอยู่ในฐานข้อมูลหรือไม่
    const checkSql = 'SELECT veritestcase_id FROM veritestcase_id WHERE veritestcase_id = ?';
    db.query(checkSql, [veritestcase_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking veritestcase_id:", checkErr);
            return res.status(500).json({ message: "ข้อผิดพลาดในการตรวจสอบข้อมูล" });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูล veritestcase นี้ในฐานข้อมูล" });
        }

        // อัปเดตข้อมูล veritestcase_by
        const sql = `
          UPDATE veritestcase
          SET veritestcase_by = ?
          WHERE veritestcase_id = ?`;

        db.query(sql, [JSON.stringify(veritestcase_by), veritestcase_id], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "ไม่สามารถอัปเดตข้อมูล veritestcase_by ได้" });
            }

            res.status(200).json({
                message: "อัปเดตข้อมูล veritestcase_id สำเร็จ",
                veritestcase_id: veritestcase_id
            });
        });
    });
});

// get ข้อมูลเฉพาะเมื่อกดที่ verify ในหน้า View Verification
app.get("/verifytestcase", (req, res) => {
    const { testcase_id } = req.query;
    const testcaseIdsArray = testcase_id.split(",");
    let query = `SELECT * FROM testcase WHERE testcase_id IN (?)`;

    db.query(query, [testcaseIdsArray], (err, results) => {
        if (err) {
            console.error("Error fetching testcase:", err);
            res.status(500).json({ error: "Failed to fetch testcase" });
        } else {
            res.status(200).json(results);
        }
    });
});

// ------------------------- OVERVIEW --------------------------------
// API รวม Requirements, Baseline Requirements และ Design
app.get("/overviewcount", (req, res) => {
    const projectId = req.query.project_id;

    if (!projectId) {
        return res.status(400).json({ error: "Missing project_id" });
    }

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM requirement WHERE project_id = ?) AS total_requirements,
            (SELECT COUNT(*) FROM requirement WHERE project_id = ? AND requirement_status = 'BASELINE') AS total_baseline_requirements,
            (SELECT COUNT(*) FROM design WHERE project_id = ?) AS total_design,
            (SELECT COUNT(*) FROM design WHERE project_id = ? AND design_status = 'BASELINE') AS total_baseline_design
    `;

    db.query(sql, [projectId, projectId, projectId, projectId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error" });
        }

        res.json({
            total_requirements: result[0]?.total_requirements || 0,
            total_baseline_requirements: result[0]?.total_baseline_requirements || 0,
            total_design: result[0]?.total_design || 0,
            total_baseline_design: result[0]?.total_baseline_design || 0,
        });
    });
});


// ------------------------- Testcase Criteria -------------------------
// Fetch all Testcase Verification Criteria
app.get('/testcasecriteria', (req, res) => {
    const sql = "SELECT * FROM testcasecriteria";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching Testcase Criteria:', err);
            return res.status(500).send('Error fetching Testcase Criteria');
        }
        res.json(result);
    });
});

// Add new Testcase Verification Criteria
app.post('/testcasecriteria', (req, res) => {
    const { testcasecri_name } = req.body;

    if (!testcasecri_name || testcasecri_name.trim() === "") {
        return res.status(400).json({ message: "Criteria name is required" });
    }

    const sql = "INSERT INTO testcasecriteria (testcasecri_name) VALUES (?)";
    db.query(sql, [testcasecri_name], (err, result) => {
        if (err) {
            console.error('Error adding Testcase Criteria:', err);
            return res.status(500).json({ message: "Error adding Testcase Criteria" });
        }
        res.status(201).json({ message: "Testcase Criteria added successfully", data: result });
    });
});

// Update Testcase Verification Criteria
app.put('/testcasecriteria/:id', (req, res) => {
    const { testcasecri_name } = req.body;
    const { id } = req.params;

    if (!testcasecri_name || testcasecri_name.trim() === "") {
        return res.status(400).json({ message: "Criteria name is required" });
    }

    const sql = "UPDATE testcasecriteria SET testcasecri_name = ? WHERE testcasecri_id = ?";
    db.query(sql, [testcasecri_name, id], (err, result) => {
        if (err) {
            console.error('Error updating Testcase Criteria:', err);
            return res.status(500).json({ message: "Error updating Testcase Criteria" });
        }
        res.status(200).json({ message: "Testcase Criteria updated successfully", data: result });
    });
});

// Delete Testcase Verification Criteria
app.delete('/testcasecriteria/:id', (req, res) => {
    const { id } = req.params;

    const checkSql = "SELECT * FROM testcasecriteria WHERE testcasecri_id = ?";
    const deleteSql = "DELETE FROM testcasecriteria WHERE testcasecri_id = ?";

    db.query(checkSql, [id], (err, result) => {
        if (err) {
            console.error('Error checking Testcase Criteria:', err);
            return res.status(500).json({ message: "Error checking Testcase Criteria" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Testcase Criteria not found" });
        }

        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting Testcase Criteria:', err);
                return res.status(500).json({ message: "Error deleting Testcase Criteria" });
            }
            res.status(200).json({ message: "Testcase Criteria deleted successfully" });
        });
    });
});

// ------------------------- SERVER LISTENER -------------------------
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
