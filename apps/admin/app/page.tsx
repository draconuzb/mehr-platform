const SECTIONS = [
  "Verifikatsiya",
  "Moderatsiya",
  "Shikoyatlar",
  "SOS",
  "Xavf signallari",
  "Foydalanuvchilar",
  "Juftliklar",
  "Uchrashuvlar",
  "Kelishuvlar",
  "Check-in",
  "Sozlamalar",
  "Audit",
  "Analitika",
];

export default function Dashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, borderRight: "1px solid #ddd", padding: 16 }}>
        <b>Mehr Admin</b>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {SECTIONS.map((s) => (
            <li key={s} style={{ padding: "6px 0" }}>{s}</li>
          ))}
        </ul>
      </aside>
      <main style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Karkas. Bo'limlar MVP sprintlarida qo'shiladi (TZ.md, 9-bo'lim).</p>
      </main>
    </div>
  );
}
