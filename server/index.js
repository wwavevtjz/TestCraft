const express = require('express');
const bodyParser = require("body-parser");
const multer = require('multer');
const mysql = require('mysql');
const cors = require('cors');
const app = express();

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
    // ดึงข้อมูล Requirement พร้อมกับข้อมูลไฟล์ที่เชื่อมโยง
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
        filereq_id // เพิ่ม filereq_id
    } = req.body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นทั้งหมดหรือไม่
    if (!requirement_name || !requirement_type || !requirement_description || !requirement_status || !project_id || !filereq_id) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // สร้าง SQL query สำหรับการแทรกข้อมูล
    const sql = "INSERT INTO requirement (requirement_name, requirement_type, requirement_description, requirement_status, project_id, filereq_id) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [requirement_name, requirement_type, requirement_description, requirement_status, project_id, filereq_id];

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
    const sql = "DELETE FROM requirement WHERE requirement_id = ?";
    const id = req.params.id;

    db.query(sql, [id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error deleting requirement" });
        }
        return res.status(200).json({ message: "Requirement deleted successfully" });
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
    const sql = "SELECT * FROM file_requirement";
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching Requirement Criteria:', err);
            return res.status(500).send('Error fetching Requirement Criteria');
        }
        res.json(result);
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



// ------------------------- SERVER LISTENER -------------------------
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
