import { useEffect, useState, useMemo, useDeferredValue, useRef } from "react";
import ProductoCard from "./components/ProductoCard";
import ModalImagen from "./components/ModalImagen";
import { obtenerProductos } from "./services/productosService";
import { filtrarProductos } from "./utils/filtrarProductos";
import "./App.css";

const PRODUCTOS_POR_PAGINA = 36;

function App() {
  const [productos, setProductos] = useState([]);
  const [errores, setErrores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const busquedaDiferida = useDeferredValue(busqueda);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("TODOS");
  const [limiteVisibles, setLimiteVisibles] = useState(PRODUCTOS_POR_PAGINA);
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState(null);
  const [productoModal, setProductoModal] = useState(null);

  const observadorRef = useRef(null);
  const categoriasScrollRef = useRef(null);
  const [mostrarFlechaIzq, setMostrarFlechaIzq] = useState(false);
  const [mostrarFlechaDer, setMostrarFlechaDer] = useState(false);

  // Arrastre con el mouse en PC (Drag-to-scroll)
  const arrastrandoRef = useRef(false);
  const inicioXRef = useRef(0);
  const scrollInicioRef = useRef(0);
  const huboArrastreRef = useRef(false);

  const actualizarFlechasCategorias = () => {
    const el = categoriasScrollRef.current;
    if (!el) return;
    const tieneOverflow = el.scrollWidth > el.clientWidth + 2;
    setMostrarFlechaIzq(tieneOverflow && el.scrollLeft > 6);
    setMostrarFlechaDer(tieneOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  };

  const onMouseDownCategorias = (e) => {
    const el = categoriasScrollRef.current;
    if (!el) return;
    arrastrandoRef.current = true;
    inicioXRef.current = e.pageX - el.offsetLeft;
    scrollInicioRef.current = el.scrollLeft;
    huboArrastreRef.current = false;
  };

  const onMouseMoveCategorias = (e) => {
    if (!arrastrandoRef.current) return;
    const el = categoriasScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const distancia = x - inicioXRef.current;
    if (Math.abs(distancia) > 4) {
      huboArrastreRef.current = true;
      el.scrollLeft = scrollInicioRef.current - distancia;
      actualizarFlechasCategorias();
    }
  };

  const onMouseUpCategorias = () => {
    arrastrandoRef.current = false;
  };

  const desplazarCategorias = (direccion) => {
    const el = categoriasScrollRef.current;
    if (!el) return;
    const cantidad = direccion === "izq" ? -240 : 240;
    el.scrollBy({ left: cantidad, behavior: "smooth" });
    setTimeout(actualizarFlechasCategorias, 280);
  };

  const refrescarCatalogo = (forzar = true) => {
    if (productos.length > 0) {
      setRecargando(true);
    } else {
      setCargando(true);
    }
    setError(null);

    obtenerProductos({ forzarRecarga: forzar })
      .then((datos) => {
        setProductos(datos.productos);
        setErrores(datos.errores);
      })
      .catch(() => {
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        setCargando(false);
        setRecargando(false);
      });
  };

  useEffect(() => {
    obtenerProductos({ forzarRecarga: false })
      .then((datos) => {
        setProductos(datos.productos);
        setErrores(datos.errores);
      })
      .catch(() => {
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  // Extraer categorías únicas disponibles
  const categorias = useMemo(() => {
    const list = productos
      .map((p) => p.categoria?.trim())
      .filter((cat) => Boolean(cat));
    return ["TODOS", ...Array.from(new Set(list))];
  }, [productos]);

  // Listener para rueda del mouse (scroll horizontal en PC) y cálculo de flechas
  useEffect(() => {
    const el = categoriasScrollRef.current;
    if (!el) return;

    actualizarFlechasCategorias();
    const timer = setTimeout(actualizarFlechasCategorias, 120);

    const onScroll = () => actualizarFlechasCategorias();
    const onResize = () => actualizarFlechasCategorias();

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        actualizarFlechasCategorias();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, [categorias]);

  // Centrar suavemente la categoría activa al ser seleccionada
  useEffect(() => {
    const el = categoriasScrollRef.current;
    if (!el) return;
    const activa = el.querySelector(".categoria-pill.activa");
    if (activa) {
      activa.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [categoriaSeleccionada]);

  // Total de productos disponibles en la categoría activa
  const totalEnCategoria = useMemo(() => {
    if (!categoriaSeleccionada || categoriaSeleccionada.toUpperCase() === "TODOS") {
      return productos.length;
    }
    const catFiltro = categoriaSeleccionada.trim().toLowerCase();
    return productos.filter((p) => {
      if (!p.activo) return false;
      const cat = p.categoriaLower ?? (p.categoria ? p.categoria.trim().toLowerCase() : "");
      return cat === catFiltro;
    }).length;
  }, [productos, categoriaSeleccionada]);

  // Filtrado optimizado con valor diferido para que el input no se trabe
  const productosFiltrados = useMemo(() => {
    return filtrarProductos(productos, busquedaDiferida, categoriaSeleccionada);
  }, [productos, busquedaDiferida, categoriaSeleccionada]);

  // Lista recortada para renderizado instantáneo en el DOM (36 en 36)
  const productosVisibles = useMemo(() => {
    return productosFiltrados.slice(0, limiteVisibles);
  }, [productosFiltrados, limiteVisibles]);

  const hayMasProductos = productosVisibles.length < productosFiltrados.length;

  // Carga automática al hacer scroll cerca del final
  useEffect(() => {
    if (!hayMasProductos) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimiteVisibles((prev) => prev + PRODUCTOS_POR_PAGINA);
        }
      },
      { rootMargin: "350px" }
    );

    const elemento = observadorRef.current;
    if (elemento) {
      observer.observe(elemento);
    }

    return () => observer.disconnect();
  }, [hayMasProductos, productosVisibles.length]);

  if (cargando) {
    return (
      <div className="estado-contenedor">
        <div className="spinner"></div>
        <p className="estado-texto">Cargando catálogo de Paula Shop's...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estado-contenedor">
        <div className="error-icono">⚠️</div>
        <p className="estado-texto">{error}</p>
        <button
          className="btn-reintentar"
          onClick={() => refrescarCatalogo(true)}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="catalogo-app">
      {/* Header móvil */}
      <header className="catalogo-header">
        <div className="header-badge">Paula Shop's</div>
        <h1 className="header-titulo">Catálogo de Productos</h1>
        <p className="header-subtitulo">Polos, gorros, buzos y más...</p>
      </header>

      {/* Barra de búsqueda móvil */}
      <div className="busqueda-wrapper">
        <div className="busqueda-caja">
          <svg
            className="busqueda-icono"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            className="busqueda-input"
            type="text"
            placeholder="Buscar polos, gorros, buzos y más..."
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setLimiteVisibles(PRODUCTOS_POR_PAGINA);
            }}
          />

          {busqueda && (
            <button
              className="busqueda-limpiar"
              onClick={() => {
                setBusqueda("");
                setLimiteVisibles(PRODUCTOS_POR_PAGINA);
              }}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categorías deslizables con soporte completo para PC y Móvil */}
      {categorias.length > 1 && (
        <div className="categorias-scroll-container">
          <div className="categorias-wrapper">
            <button
              type="button"
              className="btn-scroll-flecha flecha-izq"
              onClick={() => desplazarCategorias("izq")}
              aria-label="Desplazar categorías hacia la izquierda"
              disabled={!mostrarFlechaIzq}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div
              className="categorias-scroll"
              ref={categoriasScrollRef}
              onMouseDown={onMouseDownCategorias}
              onMouseMove={onMouseMoveCategorias}
              onMouseUp={onMouseUpCategorias}
              onMouseLeave={onMouseUpCategorias}
            >
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`categoria-pill ${categoriaSeleccionada === cat ? "activa" : ""
                    }`}
                  onClick={() => {
                    if (huboArrastreRef.current) return;
                    setCategoriaSeleccionada(cat);
                    setLimiteVisibles(PRODUCTOS_POR_PAGINA);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-scroll-flecha flecha-der"
              onClick={() => desplazarCategorias("der")}
              aria-label="Desplazar categorías hacia la derecha"
              disabled={!mostrarFlechaDer}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Banner de Observaciones de datos (si existen) */}
      {errores.length > 0 && (
        <div className="observaciones-banner">
          <div className="observaciones-header">
            <span className="observaciones-alerta">
              ⚠️ <strong>{errores.length}</strong> {errores.length === 1 ? "observación" : "observaciones"} en datos del catálogo
            </span>
            <button
              className="observaciones-toggle"
              onClick={() => setMostrarObservaciones(!mostrarObservaciones)}
            >
              {mostrarObservaciones ? "Ocultar" : "Ver detalles"}
            </button>
          </div>

          {mostrarObservaciones && (
            <ul className="observaciones-lista">
              {errores.map((err, index) => (
                <li key={index} className="observacion-item">
                  <strong>{err.nombre || "Fila sin nombre"}:</strong> {err.mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      <div className="catalogo-info-bar">
        <span className="conteo-texto">
          Mostrando <strong>{productosFiltrados.length}</strong> de {totalEnCategoria} productos
          {categoriaSeleccionada !== "TODOS" && (
            <span className="conteo-total-filtro"> ({productos.length} totales)</span>
          )}
        </span>
        <div className="info-bar-acciones">
          <button
            className="btn-actualizar-catalogo"
            onClick={() => refrescarCatalogo(true)}
            title="Sincronizar cambios recientes de la hoja de cálculo"
            disabled={recargando}
          >
            <span className={recargando ? "icono-girando" : ""}>🔄</span>
            {recargando ? "Sincronizando..." : "Actualizar"}
          </button>
          {(busqueda || categoriaSeleccionada !== "TODOS") && (
            <button
              className="btn-limpiar-filtros"
              onClick={() => {
                setBusqueda("");
                setCategoriaSeleccionada("TODOS");
                setLimiteVisibles(PRODUCTOS_POR_PAGINA);
              }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de productos */}
      {productosVisibles.length > 0 ? (
        <>
          <main className="productos-grid">
            {productosVisibles.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                onVerImagen={setProductoModal}
              />
            ))}
          </main>

          {hayMasProductos && (
            <div ref={observadorRef} className="cargar-mas-contenedor">
              <button
                className="btn-cargar-mas"
                onClick={() => setLimiteVisibles((prev) => prev + PRODUCTOS_POR_PAGINA)}
              >
                Cargar más productos ({productosFiltrados.length - productosVisibles.length} restantes)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="sin-resultados">
          <div className="sin-resultados-icono">🔍</div>
          <h3>No se encontraron productos</h3>
          <p>
            No hay resultados para "{busqueda}". Intenta con otra búsqueda o categoría.
          </p>
          <button
            className="btn-limpiar-filtros"
            onClick={() => {
              setBusqueda("");
              setCategoriaSeleccionada("TODOS");
              setLimiteVisibles(PRODUCTOS_POR_PAGINA);
            }}
          >
            Ver todos los productos
          </button>
        </div>
      )}

      <footer className="catalogo-pie">
        <p>© 2026 Paula Shop's - Todos los derechos reservados</p>
      </footer>

      {/* Modal para ver fotos grandes sin deformación en celular y PC */}
      <ModalImagen
        producto={productoModal}
        alCerrar={() => setProductoModal(null)}
      />
    </div>
  );
}

export default App;