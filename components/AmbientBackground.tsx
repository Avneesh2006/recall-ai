export function AmbientBackground() {
  return (
    <>
      <div className="ambient-layer" aria-hidden="true">
        <div className="ambient-blob ambient-blob--a" />
        <div className="ambient-blob ambient-blob--b" />
      </div>
      <div className="grain-overlay" aria-hidden="true" />
    </>
  );
}
