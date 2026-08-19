"use client";

import dynamic from "next/dynamic";

const AttendanceChartInner = dynamic(() => import("./AttendanceChartInner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function AttendanceChart(props) {
  return <AttendanceChartInner {...props} />;
}