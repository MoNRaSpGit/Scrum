import { BuildMetaCard } from "../../shared/components/BuildMetaCard";

const scrumRows = [
  {
    id: 1,
    sprint: "Sprint 1",
    tarea: "Conexion inicial frontend-scrum",
    estado: "En progreso",
    responsable: "MoNRa"
  }
];

export function ScrumHomePage() {
  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <span style={eyebrowStyle}>SaaSPro</span>
          <h1 style={titleStyle}>Scrum</h1>
          <p style={bodyStyle}>Base inicial lista para empezar a construir el producto con el mismo stack que el resto del workspace.</p>
        </div>
        <BuildMetaCard />
      </section>

      <section style={tableSectionStyle}>
        <header style={tableHeaderStyle}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 18 }}>Tabla Scrum</strong>
            <span style={tableCaptionStyle}>Dato inicial de prueba para validar la home y el deploy.</span>
          </div>
          <span style={counterStyle}>{scrumRows.length} registro</span>
        </header>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Sprint</th>
                <th style={thStyle}>Tarea</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {scrumRows.map((row) => (
                <tr key={row.id}>
                  <td style={tdStyle}>{row.id}</td>
                  <td style={tdStyle}>{row.sprint}</td>
                  <td style={tdStyle}>{row.tarea}</td>
                  <td style={tdStyle}>{row.estado}</td>
                  <td style={tdStyle}>{row.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "20px",
  background: "#f3f6fb",
  color: "#162033",
  fontFamily: "Inter, Segoe UI, sans-serif",
  display: "grid",
  gap: 20
};

const heroStyle: React.CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
  gap: 20,
  alignItems: "start"
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  color: "#3056d3"
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 44px)",
  lineHeight: 1.05
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 640,
  lineHeight: 1.6,
  color: "#53627c"
};

const tableSectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  width: "min(1180px, 100%)",
  margin: "0 auto",
  padding: 18,
  display: "grid",
  gap: 16
};

const tableHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
};

const tableCaptionStyle: React.CSSProperties = {
  color: "#60708a",
  fontSize: 14
};

const counterStyle: React.CSSProperties = {
  minWidth: 28,
  minHeight: 28,
  padding: "0 8px",
  borderRadius: 999,
  display: "inline-grid",
  placeItems: "center",
  background: "#e8eefc",
  color: "#2847b8",
  fontSize: 13,
  fontWeight: 800
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #e5ebf5",
  borderRadius: 8,
  background: "#fbfcff"
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 760
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  fontSize: 13,
  color: "#5e6c86",
  borderBottom: "1px solid #e5ebf5",
  background: "#f4f7fc"
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 14,
  lineHeight: 1.5,
  color: "#1c2940",
  borderBottom: "1px solid #e5ebf5"
};
