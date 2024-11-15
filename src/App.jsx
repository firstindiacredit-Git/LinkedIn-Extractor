import React, { useState } from "react";
import { ConfigProvider, Button, Input, Layout, Table, theme } from "antd";
import axios from "axios";
import { BulbOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const { Header, Content, Footer } = Layout;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: "",
    country: "",
    pages: "1",
  });
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/scrape",
        formData
      );
      setLoading(false);
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "S.no",
      key: "sno",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Profile Link",
      dataIndex: "link",
      key: "link",
      render: (text) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    { title: "Description & Address", dataIndex: "address", key: "Address" },
  ];

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // Function to export data to PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    // Document title and styling
    doc.setFontSize(16);
    doc.setTextColor(0, 128, 255);
    doc.text("LinkedIn Profiles", doc.internal.pageSize.width / 2, 15, {
      align: "center",
    });

    // Reset styling for content
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Add search criteria
    doc.text(`Industry: ${formData.industry || "Not specified"}`, 20, 25);
    doc.text(`Country: ${formData.country || "Not specified"}`, 20, 32);

    // Add horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Profile entries
    let yPosition = 45;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    profiles.forEach((profile, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Profile number and name
      doc.setFont(undefined, "bold");
      doc.text(`${index + 1}. ${profile.name}`, margin, yPosition);
      yPosition += 7;

      // Profile link
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 255);
      const linkLines = doc.splitTextToSize(profile.link, maxWidth);
      doc.text(linkLines, margin, yPosition);
      yPosition += linkLines.length * 7;

      // Description & Address
      doc.setTextColor(0, 0, 0);
      const address = profile.address || "No address found";
      const addressLines = doc.splitTextToSize(address, maxWidth);

      // Check if we need a new page for description
      if (yPosition + addressLines.length * 7 > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(addressLines, margin, yPosition);
      yPosition += addressLines.length * 7 + 10; // Extra spacing after each profile

      // Add a separator line between profiles (except for the last one)
      if (index < profiles.length - 1) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setDrawColor(200, 200, 200); // Light gray color
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
        yPosition += 10; // Space after separator
      }
    });

    // Save with formatted filename including date
    const date = new Date().toLocaleDateString().replace(/\//g, "-");
    doc.save(`LinkedIn_Profiles_${date}.pdf`);
  };

  // Function to export data to Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      profiles.map((profile, index) => ({
        SNo: index + 1,
        Name: profile.name,
        ProfileLink: profile.link,
        Address: profile.address || "No address found",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profiles");
    XLSX.writeFile(workbook, "profiles.xlsx");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        components: {
          Table: {
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
            colorText: isDarkMode ? "#f0f0f0" : "#000",
            borderColor: isDarkMode ? "#222" : "#ddd",
          },
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#121212" : "#fff",
            border: "2px white",
          }}
        >
          <h1
            style={{
              color: isDarkMode ? "#fff" : "#0080ff",
              textAlign: "center",
            }}
          >
            LinkedIn Scraper
          </h1>
          <Button icon={<BulbOutlined />} onClick={handleThemeToggle}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </Button>
        </Header>
        <Content
          style={{
            padding: "2rem",
            backgroundColor: isDarkMode ? "#222222" : "#f2f2f2",
          }}
        >
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              padding: "0rem 1rem 1rem 1rem",
              border: "15px solid #00000020",
              borderRadius: "0.5rem",
            }}
          >
            <div
              style={{
                textAlign: "center",
                margin: "0.5rem 0",
                color: "gray",
                fontSize: "1.5rem",
                fontFamily: "semibold",
                fontStyle: "normal",
              }}
            >
              Search Here
            </div>
            <Input
              placeholder="Industry"
              name="industry"
              onChange={handleInputChange}
              style={{ marginBottom: "1rem" }}
            />
            <Input
              placeholder="Country"
              name="country"
              onChange={handleInputChange}
              style={{ marginBottom: "1rem" }}
            />
            <Button type="dashed" onClick={handleSubmit} block>
              {loading ? "Scraping..." : "Scrape Profiles"}
            </Button>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
                justifyContent: "space-between",
              }}
            >
              <Button onClick={exportPDF} disabled={profiles.length === 0}>
                Export to PDF
              </Button>
              <Button onClick={exportExcel} disabled={profiles.length === 0}>
                Export to Excel
              </Button>
            </div>
          </div>
          <Table
            dataSource={profiles}
            columns={columns}
            rowKey="link"
            style={{
              padding: "2rem",
              marginTop: "2rem",
              borderRadius: "1rem",
              backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff05",
            }}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </Content>
        <Footer
          style={{
            textAlign: "center",
            backgroundColor: isDarkMode ? "#121212" : "#ffffff05",
            color: isDarkMode ? "white" : "black",
          }}
        >
          LinkedIn Scraper ©2024 Created by{" "}
          <a
            href="https://www.pizeonfly.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Pizeonfly.com
          </a>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
