interface ChartData {
  label: string;
  value: number;
}

export function PerformanceChart({ data, max = 100 }: { data: ChartData[]; max?: number }) {
  if (data.length === 0) {
    return <div className="empty-state" style={{ padding: 24 }}>No data to chart yet</div>;
  }

  return (
    <div className="chart">
      {data.map((d, i) => {
        const height = Math.max(4, (d.value / max) * 100);
        return (
          <div key={i} className="chart-bar-wrap">
            <div className="chart-bar-value">{d.value}%</div>
            <div className="chart-bar" style={{ height: `${height}%` }} />
            <div className="chart-bar-label">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
