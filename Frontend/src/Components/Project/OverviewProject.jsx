import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Overview.css";

const OverviewProject = () => {
  const [totalRequirements, setTotalRequirements] = useState(0);
  const [totalBaselineRequirements, setTotalBaselineRequirements] = useState(0);
  const [totalDesign, setTotalDesign] = useState(0);
  const [totalDeadlines] = useState(2); // Placeholder for deadlines data
  
  // Get the project ID from the query params
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  // Fetch the data when the component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      axios
        .get(`http://localhost:3001/overviewcount?project_id=${projectId}`)
        .then((response) => {
          const data = response.data || {};
          setTotalRequirements(data.total_requirements || 0);
          setTotalBaselineRequirements(data.total_baseline_requirements || 0);
          setTotalDesign(data.total_design || 0);
        })
        .catch((error) => {
          console.error("Error fetching overview data:", error);
        });
    }
  }, [projectId]);

  // Data for the chart
  const chartData = [
    { category: "Requirements", totalRequirements, totalBaselineRequirements },
    { category: "Design", totalDesign },
  ];

  return (
    <div className="dashboard-overview-container">
      <header className="overview-header">
        <h1>Project Overview</h1>
        <div className="overview-profile">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="overview-profile-img"
          />
          <span>Welcome, User</span>
        </div>
      </header>

      <div className="overview-chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="totalRequirements"
              name="Requirements"
              fill="#8884d8"
              barSize={50}
            />
            <Bar
              dataKey="totalBaselineRequirements"
              name="Baseline Requirements"
              fill="#82ca9d"
              barSize={50}
            />
            <Bar dataKey="totalDesign" name="Design" fill="#ffc658" barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewProject;
