import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Button } from "@mui/material";
import * as constants from "./constants/constants";

const OrganizationDocChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await axios.get(
                    `${constants.devApiBaseUrl}/api/org/doc/counts`
                );
                setData(response.data);
            } catch (error) {
                console.error("Error fetching org doc counts:", error);
            }
        };

        fetchCounts();
    }, []);

    const exportCSV = () => {
        const headers = ["Organization", "Total Documents"];
        const rows = data.map((row) => [row.organization, row.doc_count]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers, ...rows].map((e) => e.join(",")).join("\n");

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `organization_document_report_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div style={{ width: "100%", height: 425, padding: "20px 0" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                }}
            >
                <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: "#2757aa", textTransform: "none" }}
                    onClick={exportCSV}
                >
                    Download Report
                </Button>
            </div>

            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 40, left: 60, bottom: 100 }}
                    barCategoryGap="20%"
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="organization"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={{ fontSize: 12 }}
                        dy={10}
                        label={{
                            value: "Organizations",
                            position: "insideBottom",
                            offset: -15,
                            style: { fontSize: 14, fontWeight: 500 },
                        }}
                    />
                    <YAxis
                        label={{
                            value: "Total Documents",
                            angle: -90,
                            position: "insideLeft",
                            style: { textAnchor: "middle", fontSize: 14 },
                            dx: -20,
                        }}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        wrapperStyle={{ paddingBottom: "10px" }}
                        iconType="rect"
                    />
                    <Bar
                        dataKey="doc_count"
                        name="Total Documents"
                        fill="#2757aa"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default OrganizationDocChart;