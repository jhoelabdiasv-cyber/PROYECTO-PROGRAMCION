"use strict";

// SIMTELE-WEB: datos y umbrales exclusivamente didácticos, NO operativos.
const CLAVE_STORAGE = "simtele_web_datos_v1";
const UMBRAL_DISTANCIA = 50; // Metros simulados.
const UMBRAL_VIENTO_MODERADO = 20; // Unidades simuladas.
const UMBRAL_VIENTO_ALTO = 40; // Unidades simuladas.
const PATRON_SENSOR = /^SEN-\d{3}$/;
const ESTADOS = { normal: "Normal", revision: "Revisión", urgente: "Urgente" };
const TIPOS_SENSOR = ["Temperatura", "Vibración", "Oscilación"];

// Arreglos: uno de objetos para mantenimiento, otro para sensores y otro numérico para viento.
let mantenimientos = [];
let sensores = [];
let medicionesViento = [];
let ultimaDetencion = null;

function porId(id) {
  return document.getElementById(id);
}

function formatear(numero) {
  return new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 }).format(numero);
}

function mostrarMensaje(id, texto, tipo = "error") {
  const elemento = porId(id);
  elemento.textContent = texto;
  elemento.className = "feedback" + (texto ? " feedback-" + tipo : "");
}

// Validación completa: vacío, caracteres ajenos a un número, valor finito y rango.
// Se permite coma o punto decimal; no se aceptan textos como "12abc".
function validarNumero(campo, nombre, minimo, maximo) {
  const original = campo.value.trim();
  if (original === "") {
    return { valido: false, error: "El campo " + nombre + " es obligatorio." };
  }
  const normalizado = original.replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalizado)) {
    return { valido: false, error: "El campo " + nombre + " debe ser numérico (ej.: 12.5)." };
  }
  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) {
    return { valido: false, error: "El campo " + nombre + " no contiene un número válido." };
  }
  if (numero < minimo || numero > maximo) {
    return { valido: false, error: "El campo " + nombre + " debe estar entre " + formatear(minimo) + " y " + formatear(maximo) + "." };
  }
  return { valido: true, valor: numero };
}

function nuevoId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

// Conserva exclusivamente los datos de esta aplicación, nunca los de otros sitios.
function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify({
      mantenimientos: mantenimientos,
      sensores: sensores,
      medicionesViento: medicionesViento,
      ultimaDetencion: ultimaDetencion
    }));
  } catch (error) {
    mostrarMensaje("estado-almacenamiento", "El almacenamiento local no está disponible; los datos funcionan durante esta sesión.", "error");
  }
}

function cargarDatos() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return;
    const datos = JSON.parse(guardado);
    if (!datos || typeof datos !== "object") return;
    if (Array.isArray(datos.mantenimientos)) {
      mantenimientos = datos.mantenimientos.filter(item =>
        item && typeof item.id === "string" && typeof item.componente === "string" &&
        item.componente.trim().length > 0 && item.componente.length <= 60 &&
        typeof item.horas === "number" && Number.isFinite(item.horas) &&
        item.horas >= 0 && item.horas <= 100000 && Object.hasOwn(ESTADOS, item.estado)
      );
    }
    if (Array.isArray(datos.sensores)) {
      sensores = datos.sensores.filter(item =>
        item && typeof item.id === "string" && typeof item.codigo === "string" &&
        PATRON_SENSOR.test(item.codigo) && TIPOS_SENSOR.includes(item.tipo) &&
        typeof item.lectura === "number" && Number.isFinite(item.lectura) &&
        item.lectura >= 0 && item.lectura <= 100
      );
    }
    if (Array.isArray(datos.medicionesViento) && datos.medicionesViento.length === 5 &&
        datos.medicionesViento.every(n => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 120)) {
      medicionesViento = datos.medicionesViento;
    }
    const d = datos.ultimaDetencion;
    if (d && Number.isFinite(d.velocidad) && d.velocidad >= 0 && d.velocidad <= 120 &&
        Number.isFinite(d.tiempo) && d.tiempo >= 0 && d.tiempo <= 60) {
      ultimaDetencion = { velocidad: d.velocidad, tiempo: d.tiempo,
        distancia: (d.velocidad / 3.6) * d.tiempo };
    }
  } catch (error) {
    mostrarMensaje("estado-almacenamiento", "No fue posible recuperar los datos guardados.", "error");
  }
}

function agregarTexto(contenedor, etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  nodo.className = clase;
  nodo.textContent = texto;
  contenedor.appendChild(nodo);
  return nodo;
}

// MÓDULO 1: usa parseFloat, fórmula, if/else y salida en el DOM.
function calcularDetencion(evento) {
  evento.preventDefault();
  const campoVelocidad = porId("velocidad");
  const campoTiempo = porId("tiempo");
  const v = validarNumero(campoVelocidad, "velocidad", 0, 120);
  if (!v.valido) { mostrarMensaje("mensaje-detencion", v.error); return; }
  const t = validarNumero(campoTiempo, "tiempo de reacción", 0, 60);
  if (!t.valido) { mostrarMensaje("mensaje-detencion", t.error); return; }

  const velocidad = parseFloat(campoVelocidad.value.trim().replace(",", "."));
  const tiempo = parseFloat(campoTiempo.value.trim().replace(",", "."));
  const distancia = (velocidad / 3.6) * tiempo;
  ultimaDetencion = { velocidad: velocidad, tiempo: tiempo, distancia: distancia };
  mostrarResultadoDetencion();
  mostrarMensaje("mensaje-detencion", "Cálculo realizado correctamente.", "success");
  guardarDatos();
}

function mostrarResultadoDetencion() {
  const caja = porId("resultado-detencion");
  caja.replaceChildren();
  if (ultimaDetencion === null) {
    caja.textContent = "Completa los datos para mostrar la distancia calculada.";
    return;
  }
  agregarTexto(caja, "span", "result-label", "Distancia de reacción estimada");
  agregarTexto(caja, "strong", "result-number", formatear(ultimaDetencion.distancia) + " m");
  agregarTexto(caja, "p", "result-detail", formatear(ultimaDetencion.velocidad) + " km/h × " + formatear(ultimaDetencion.tiempo) + " s (conversión a m/s incluida).");
  if (ultimaDetencion.distancia <= UMBRAL_DISTANCIA) {
    agregarTexto(caja, "span", "result-status safe", "Dentro de la referencia ficticia de 50 m.");
  } else {
    agregarTexto(caja, "span", "result-status alert", "Supera la referencia ficticia de 50 m.");
  }
}

function celda(fila, texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  fila.appendChild(td);
  return td;
}

function botonEliminar(fila, id) {
  const td = document.createElement("td");
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "button button-danger button-small";
  boton.textContent = "Eliminar";
  boton.dataset.id = id;
  boton.setAttribute("aria-label", "Eliminar registro " + id);
  td.appendChild(boton);
  fila.appendChild(td);
}

// MÓDULO 2: arreglo de objetos, push, tabla DOM y eliminación con splice.
function agregarMantenimiento(evento) {
  evento.preventDefault();
  const componente = porId("componente").value.trim();
  if (componente === "" || componente.length > 60) {
    mostrarMensaje("mensaje-mantenimiento", "Escribe un nombre de componente de 1 a 60 caracteres.");
    return;
  }
  const horas = validarNumero(porId("horas"), "horas de uso", 0, 100000);
  if (!horas.valido) { mostrarMensaje("mensaje-mantenimiento", horas.error); return; }
  const estado = porId("estado").value;
  if (!Object.hasOwn(ESTADOS, estado)) {
    mostrarMensaje("mensaje-mantenimiento", "Selecciona un estado: normal, revisión o urgente.");
    return;
  }

  mantenimientos.push({ id: nuevoId(), componente: componente, horas: horas.valor, estado: estado });
  mostrarMantenimientos();
  porId("form-mantenimiento").reset();
  mostrarMensaje("mensaje-mantenimiento", "Componente agregado correctamente.", "success");
  guardarDatos();
}

function mostrarMantenimientos() {
  const cuerpo = porId("tabla-mantenimiento");
  cuerpo.replaceChildren();
  porId("total-mantenimiento").textContent = String(mantenimientos.length);
  if (mantenimientos.length === 0) {
    const fila = document.createElement("tr");
    const vacia = celda(fila, "Todavía no hay componentes registrados.");
    vacia.colSpan = 4;
    vacia.className = "empty-table";
    cuerpo.appendChild(fila);
    return;
  }
  mantenimientos.forEach(item => {
    const fila = document.createElement("tr");
    celda(fila, item.componente);
    celda(fila, formatear(item.horas));
    const estado = celda(fila, "");
    agregarTexto(estado, "span", "tag tag-" + item.estado, ESTADOS[item.estado]);
    botonEliminar(fila, item.id);
    cuerpo.appendChild(fila);
  });
}

function eliminarMantenimiento(evento) {
  const boton = evento.target.closest("button[data-id]");
  if (!boton) return;
  const indice = mantenimientos.findIndex(item => item.id === boton.dataset.id);
  if (indice === -1) return;
  mantenimientos.splice(indice, 1);
  mostrarMantenimientos();
  mostrarMensaje("mensaje-mantenimiento", "Componente eliminado correctamente.", "success");
  guardarDatos();
}

// MÓDULO 3: cinco números en un arreglo, for y forEach para suma/máximo.
function analizarViento(evento) {
  evento.preventDefault();
  const campos = document.querySelectorAll(".wind-input");
  const mediciones = [];
  for (let i = 0; i < campos.length; i++) {
    const validacion = validarNumero(campos[i], "medición " + (i + 1), 0, 120);
    if (!validacion.valido) { mostrarMensaje("mensaje-viento", validacion.error); return; }
    mediciones.push(validacion.valor);
  }
  if (mediciones.length !== 5) {
    mostrarMensaje("mensaje-viento", "Es obligatorio registrar exactamente cinco mediciones.");
    return;
  }
  medicionesViento = mediciones;
  mostrarResultadoViento();
  mostrarMensaje("mensaje-viento", "Cinco mediciones registradas y analizadas.", "success");
  guardarDatos();
}

function clasificarViento(promedio) {
  if (promedio < UMBRAL_VIENTO_MODERADO) return { texto: "Bajo", clase: "safe" };
  if (promedio < UMBRAL_VIENTO_ALTO) return { texto: "Moderado", clase: "warning" };
  return { texto: "Alto", clase: "alert" };
}

function mostrarResultadoViento() {
  const caja = porId("resultado-viento");
  caja.replaceChildren();
  if (medicionesViento.length !== 5) {
    caja.textContent = "Registra cinco mediciones para obtener el análisis.";
    return;
  }
  let suma = 0;
  let maximo = medicionesViento[0];
  medicionesViento.forEach(numero => {
    suma += numero;
    if (numero > maximo) maximo = numero;
  });
  const promedio = suma / medicionesViento.length;
  const clasificacion = clasificarViento(promedio);
  const estadisticas = document.createElement("div");
  estadisticas.className = "wind-results";
  const promedioCaja = agregarTexto(estadisticas, "div", "stat", "");
  agregarTexto(promedioCaja, "span", "", "Promedio");
  agregarTexto(promedioCaja, "strong", "", formatear(promedio));
  const maximoCaja = agregarTexto(estadisticas, "div", "stat", "");
  agregarTexto(maximoCaja, "span", "", "Máximo");
  agregarTexto(maximoCaja, "strong", "", formatear(maximo));
  caja.appendChild(estadisticas);
  agregarTexto(caja, "p", "result-detail", "Mediciones (unidades simuladas): " + medicionesViento.map(formatear).join(", ") + ".");
  agregarTexto(caja, "span", "result-status " + clasificacion.clase,
    "Clasificación didáctica según el promedio: " + clasificacion.texto + ".");
}

// MÓDULO 4: prueba real de expresión regular, validaciones y alta en el DOM.
function registrarSensor(evento) {
  evento.preventDefault();
  const codigo = porId("codigo-sensor").value.trim();
  if (codigo === "") {
    mostrarMensaje("mensaje-sensores", "El código del sensor es obligatorio.");
    return;
  }
  if (!PATRON_SENSOR.test(codigo)) {
    mostrarMensaje("mensaje-sensores", "Código inválido. Usa SEN- seguido de tres dígitos, por ejemplo SEN-001 (no SEN-1).");
    return;
  }
  const tipo = porId("tipo-sensor").value;
  if (!TIPOS_SENSOR.includes(tipo)) {
    mostrarMensaje("mensaje-sensores", "Selecciona un tipo de sensor.");
    return;
  }
  const lectura = validarNumero(porId("lectura"), "lectura simulada", 0, 100);
  if (!lectura.valido) { mostrarMensaje("mensaje-sensores", lectura.error); return; }

  sensores.push({ id: nuevoId(), codigo: codigo, tipo: tipo, lectura: lectura.valor });
  mostrarSensores();
  porId("form-sensores").reset();
  mostrarMensaje("mensaje-sensores", "Sensor " + codigo + " registrado correctamente.", "success");
  guardarDatos();
}

function mostrarSensores() {
  const cuerpo = porId("tabla-sensores");
  cuerpo.replaceChildren();
  porId("total-sensores").textContent = String(sensores.length);
  if (sensores.length === 0) {
    const fila = document.createElement("tr");
    const vacia = celda(fila, "Todavía no hay sensores registrados.");
    vacia.colSpan = 4;
    vacia.className = "empty-table";
    cuerpo.appendChild(fila);
    return;
  }
  sensores.forEach(item => {
    const fila = document.createElement("tr");
    celda(fila, item.codigo);
    celda(fila, item.tipo);
    celda(fila, formatear(item.lectura));
    botonEliminar(fila, item.id);
    cuerpo.appendChild(fila);
  });
}

function eliminarSensor(evento) {
  const boton = evento.target.closest("button[data-id]");
  if (!boton) return;
  sensores = sensores.filter(item => item.id !== boton.dataset.id);
  mostrarSensores();
  mostrarMensaje("mensaje-sensores", "Sensor eliminado correctamente.", "success");
  guardarDatos();
}

function limpiarDatos() {
  mantenimientos = [];
  sensores = [];
  medicionesViento = [];
  ultimaDetencion = null;
  try {
    localStorage.removeItem(CLAVE_STORAGE);
  } catch (error) {
    // Los arreglos y la interfaz se limpian aunque el almacenamiento esté bloqueado.
  }
  document.querySelectorAll("main form").forEach(formulario => formulario.reset());
  ["mensaje-detencion", "mensaje-mantenimiento", "mensaje-viento", "mensaje-sensores"].forEach(id => mostrarMensaje(id, ""));
  mostrarResultadoDetencion();
  mostrarMantenimientos();
  mostrarResultadoViento();
  mostrarSensores();
  mostrarMensaje("estado-almacenamiento", "Se limpiaron los registros y los resultados de SIMTELE-WEB.", "success");
}

function iniciarAplicacion() {
  cargarDatos();
  mostrarResultadoDetencion();
  mostrarMantenimientos();
  mostrarResultadoViento();
  mostrarSensores();
  porId("form-detencion").addEventListener("submit", calcularDetencion);
  porId("form-mantenimiento").addEventListener("submit", agregarMantenimiento);
  porId("tabla-mantenimiento").addEventListener("click", eliminarMantenimiento);
  porId("form-viento").addEventListener("submit", analizarViento);
  porId("form-sensores").addEventListener("submit", registrarSensor);
  porId("tabla-sensores").addEventListener("click", eliminarSensor);
  porId("limpiar-datos").addEventListener("click", limpiarDatos);
}

document.addEventListener("DOMContentLoaded", iniciarAplicacion);
