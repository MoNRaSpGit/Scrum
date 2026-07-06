import { BuildMetaCard } from "../../shared/components/BuildMetaCard";

const backlogItems = [
  { id: "SC-101", title: "Definir backlog inicial", status: "Listo para refinar" },
  { id: "SC-102", title: "Mapear flujo de tablero", status: "En discovery" },
  { id: "SC-103", title: "Preparar estructura de auth", status: "Pendiente" }
];

const sprintItems = [
  { id: "SP-12", title: "Scaffold del frontend", owner: "Sistema" },
  { id: "SP-13", title: "Build meta y update notice", owner: "Sistema" },
  { id: "SP-14", title: "Preparar base para deploy", owner: "Sistema" }
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

      <section style={boardStyle}>
        <article style={columnStyle}>
          <header style={columnHeaderStyle}>
            <strong>Backlog</strong>
            <span style={counterStyle}>{backlogItems.length}</span>
          </header>
          {backlogItems.map((item) => (
            <div key={item.id} style={ticketStyle}>
              <span style={ticketKeyStyle}>{item.id}</span>
              <strong style={ticketTitleStyle}>{item.title}</strong>
              <span style={ticketMetaStyle}>{item.status}</span>
            </div>
          ))}
        </article>

        <article style={columnStyle}>
          <header style={columnHeaderStyle}>
            <strong>Sprint actual</strong>
            <span style={counterStyle}>{sprintItems.length}</span>
          </header>
          {sprintItems.map((item) => (
            <div key={item.id} style={ticketStyle}>
              <span style={ticketKeyStyle}>{item.id}</span>
              <strong style={ticketTitleStyle}>{item.title}</strong>
              <span style={ticketMetaStyle}>Responsable: {item.owner}</span>
            </div>
          ))}
        </article>

        <article style={columnStyle}>
          <header style={columnHeaderStyle}>
            <strong>Siguientes pasos</strong>
          </header>
          <div style={ticketStyle}>
            <strong style={ticketTitleStyle}>Conectar repo y primer deploy</strong>
            <span style={ticketMetaStyle}>Una vez creado el repo, ya queda lista para push, build y deploy.</span>
          </div>
          <div style={ticketStyle}>
            <strong style={ticketTitleStyle}>Definir módulos</strong>
            <span style={ticketMetaStyle}>Tablero, backlog, sprints, reportes, equipo.</span>
          </div>
        </article>
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

const boardStyle: React.CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16
};

const columnStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 12,
  alignContent: "start",
  minHeight: 320
};

const columnHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
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

const ticketStyle: React.CSSProperties = {
  padding: 14,
  border: "1px solid #e5ebf5",
  borderRadius: 8,
  display: "grid",
  gap: 6,
  background: "#fbfcff"
};

const ticketKeyStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#62708a"
};

const ticketTitleStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.4
};

const ticketMetaStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "#60708a"
};
