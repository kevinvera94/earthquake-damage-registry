// Franja permanente de datos ficticios en todas las páginas (RF-06-02, RN-12).
export default function DemoBanner() {
  return (
    <div className="franja" role="note">
      <div className="wrap franja__in">
        <strong>Datos ficticios con fines académicos — no es una fuente oficial.</strong>
        <span>No está afiliado a la Alcaldía de Santiago de Cali, la UNGRD ni el IDIGER.</span>
      </div>
    </div>
  );
}
