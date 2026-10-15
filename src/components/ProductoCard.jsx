import { useState, memo } from "react";
import { generarLinkWhatsApp } from "../utils/whatsapp";
import "./ProductoCard.css";

function ProductoCard({ producto, onVerImagen }) {
  const [imgError, setImgError] = useState(false);
  const tieneImagen = Boolean(producto.imagen && !imgError);
  const whatsappUrl = generarLinkWhatsApp(producto);

  const manejarClickImagen = () => {
    if (tieneImagen && onVerImagen) {
      onVerImagen(producto);
    }
  };

  return (
    <article className="producto-card">
      <div
        className={`producto-imagen-contenedor ${tieneImagen ? "con-zoom" : ""}`}
        onClick={manejarClickImagen}
        role={tieneImagen ? "button" : undefined}
        tabIndex={tieneImagen ? 0 : undefined}
        aria-label={tieneImagen ? `Ver foto grande de ${producto.nombre}` : undefined}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && tieneImagen) {
            e.preventDefault();
            manejarClickImagen();
          }
        }}
      >
        {tieneImagen ? (
          <>
            <img
              className="producto-imagen"
              src={producto.imagen}
              alt={producto.nombre}
              loading="lazy"
              onError={() => setImgError(true)}
            />
            <span className="producto-zoom-hint" title="Toca para ampliar foto">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </span>
          </>
        ) : (
          <div className="producto-imagen-fallback">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span>Sin imagen</span>
          </div>
        )}
      </div>

      <div className="producto-contenido">
        <span className="producto-categoria-badge">
          {producto.categoria || "General"}
        </span>

        <h2 className="producto-nombre" title={producto.nombre}>
          {producto.nombre}
        </h2>

        {producto.descripcion ? (
          <div className="producto-dimension-box">
            <p className="producto-dimension-texto">{producto.descripcion}</p>
          </div>
        ) : null}

        <div className="producto-footer">
          <div className="producto-precio-box">
            <span className="producto-precio-label">Precio</span>
            <p className="producto-precio">
              S/ {producto.precio.toFixed(2)}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp-card"
            title="Consultar por WhatsApp"
            aria-label={`Consultar por WhatsApp sobre ${producto.nombre}`}
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="icono-whatsapp"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.02L7.55 18.84L4.44 19.66L5.27 16.63L5.07 16.31C4.24 15 3.8 13.48 3.8 11.91C3.8 7.37 7.49 3.67 12.05 3.67M9.11 7.44C8.94 7.44 8.68 7.5 8.46 7.74C8.24 7.97 7.62 8.56 7.62 9.76C7.62 10.96 8.5 12.12 8.62 12.28C8.74 12.44 10.33 14.9 12.8 15.96C15.26 17.03 15.26 16.68 15.7 16.64C16.14 16.6 17.11 16.07 17.31 15.51C17.51 14.95 17.51 14.47 17.45 14.37C17.39 14.27 17.22 14.21 16.96 14.08C16.7 13.95 15.44 13.33 15.21 13.25C14.98 13.16 14.81 13.12 14.64 13.38C14.47 13.63 13.99 14.21 13.84 14.37C13.7 14.54 13.55 14.56 13.29 14.43C13.03 14.31 12.2 14.03 11.21 13.16C10.44 12.48 9.92 11.63 9.77 11.37C9.62 11.11 9.75 10.98 9.88 10.85C10 10.74 10.15 10.55 10.28 10.39C10.41 10.23 10.45 10.11 10.54 9.94C10.63 9.78 10.58 9.63 10.52 9.51C10.45 9.39 9.97 8.21 9.77 7.73C9.57 7.24 9.37 7.31 9.22 7.31L9.11 7.44Z" />
            </svg>
            <span className="btn-whatsapp-texto">WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductoCard);