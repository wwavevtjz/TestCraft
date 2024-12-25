import React from 'react';
import axios from 'axios';

const UploadFile = () => {
    const [title, setTitle] = React.useState(""); // State สำหรับเก็บชื่อไฟล์
    const [file, setFile] = React.useState(null); // State สำหรับเก็บไฟล์ที่เลือก (ใช้ null แทน "")

    // ฟังก์ชันสำหรับการอัพโหลดไฟล์ไปยัง backend
    const handleSubmit = (e) => {
        e.preventDefault(); // ป้องกันการ reload หน้าเว็บเมื่อ submit form

        if (!file) {
            alert("กรุณาเลือกไฟล์");
            return;
        }

        const formData = new FormData(); // สร้าง FormData object
        formData.append("title", title); // เพิ่มชื่อไฟล์ใน FormData
        formData.append("file", file); // เพิ่มไฟล์ใน FormData

        // ส่งคำขอ POST ไปยัง backend
        axios.post('http://localhost:3001/filereq', formData) // ตรวจสอบว่า URL ตรงกับที่กำหนดในเซิร์ฟเวอร์
            .then(response => {
                alert('ไฟล์อัพโหลดสำเร็จ');
            })
            .catch(error => {
                if (error.response) {
                    console.error('Error response:', error.response);
                    alert(`เกิดข้อผิดพลาดในการอัพโหลดไฟล์: ${error.response.data.message}`);
                } else if (error.request) {
                    console.error('Error request:', error.request);
                    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
                } else {
                    console.error('Error message:', error.message);
                    alert('เกิดข้อผิดพลาดทั่วไป');
                }
            });
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h4>Upload File</h4>
                <br />
                {/* ฟอร์มกรอกชื่อไฟล์ */}
                <input
                    type="text"
                    className="form-control"
                    placeholder="Title"
                    required
                    onChange={(e) => setTitle(e.target.value)} // เมื่อมีการพิมพ์จะอัพเดต title
                />
                <br />
                {/* ฟอร์มเลือกไฟล์ */}
                <input
                    type="file"
                    className="form-control"
                    accept="application/pdf" // กำหนดประเภทไฟล์ที่รองรับ
                    required
                    onChange={(e) => setFile(e.target.files[0])} // เมื่อเลือกไฟล์จะอัพเดต file
                />
                <br />
                {/* ปุ่มส่งฟอร์ม */}
                <button type="submit">
                    Submit
                </button>
            </form>
        </div>
    );
};

export default UploadFile;
