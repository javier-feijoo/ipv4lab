# IPv4 Lab — Aprender, Explorar y Jugar

Aplicación web estática para enseñar direccionamiento IPv4 de forma visual e interactiva: calculadora, representación en bits, simulador de subnetting (FLSM/VLSM), calculadora por bits y minijuego de preguntas.

## Objetivos educativos

- Comprender el papel del prefijo/máscara y la separación red/host.
- Practicar el cálculo de red, broadcast y rango de hosts.
- Interiorizar tamaños de subred (bloques) y máscaras CIDR frecuentes.
- Trabajar subnetting fijo (FLSM) y variable (VLSM) con feedback inmediato.
- Ofrecer un modo proyectable para aula con alta visibilidad.

## Secciones de la app

- **Explorar**: calculadora IPv4 con IP, máscara/CIDR sincronizados, resultados (red/broadcast/hosts) y visualización binaria de IP/máscara/red/broadcast.
- **Aprender**: contenidos teóricos con ejemplos (se sirve desde `learn.html`).
- **Subnetting**: 
  - FLSM: bits ↔ número de subredes sincronizados (gana el último editado). Muestra subredes generadas y cuántas “solicitadas”/“libres”.
  - VLSM: lista de requerimientos (hosts) ordenada descendente y asignada dentro de la red base.
- **Calculadora**: simulador por bits. Permite pulsar bits de IP (bloqueando o no la parte de red) y fijar el prefijo pulsando en los bits de la máscara. Muestra octetos decimales de apoyo.
 - **Calculadora**: simulador por bits. Permite pulsar bits de IP (bloqueando o no la parte de red) y fijar el prefijo pulsando en los bits de la máscara. Muestra octetos decimales de apoyo. Incluye un toggle de “Mostrar pesos de bits” para enseñar los pesos 128·64·32·… sobre los bits de IP.
- **Juego**: preguntas aleatorias (red, broadcast, hosts, primer/último host, máscara↔prefijo, clase, privada sí/no).
- **Juego**: preguntas aleatorias (red, broadcast, hosts, primer/último host, máscara↔prefijo, clase, privada sí/no, wildcard, ¿red?, ¿broadcast?, ¿misma subred?, tamaño de bloque, ¿host utilizable?, subredes con bits prestados). Con barra de tiempo, efectos visuales, botón Saltar y rachas.
 - **Juego**: preguntas aleatorias (red, broadcast, hosts, primer/último host, máscara↔prefijo, clase, privada sí/no, wildcard, ¿red?, ¿broadcast?, ¿misma subred?, tamaño de bloque, ¿host utilizable?, subredes con bits prestados). Con barra de tiempo, efectos visuales, botón Saltar y rachas. Selector de duración (1–10 min) y descarga del log de la sesión.

## Uso

1. Clona o descarga este repositorio.
2. Abre `index.html` en un navegador moderno (no requiere servidor).
3. Navega por las pestañas para usar cada módulo.
4. Botones en la cabecera:
   - `Tema`: alterna claro/oscuro (se guarda en `localStorage`).
   - `Proyector`: expande el ancho y hace los bits cuadrados a escala, ideal para aula.

## Validación y ergonomía

- Entradas IP/máscara: sanitización progresiva (permite teclear `10.` o `192.168.`) y validación final en blur. 
- Máscara decimal: valida patrón CIDR (1s consecutivos y luego 0s).
- VLSM: solo números, comas y espacios.
- FLSM: límites según prefijo base; “subredes” no se fuerza a potencia de 2 cuando la persona escribe un valor no exacto (se muestran libres).

## Estructura del proyecto

```
IPv4-Lab/
├── index.html        # Vista principal y navegación por pestañas
├── styles.css        # Estilos (tema claro/oscuro, bits, layout proyector)
├── learn.html        # Contenidos teóricos cargados en la pestaña Aprender
├── js/
│   ├── utils.js      # Utilidades IPv4 + sanitización/validación
│   ├── theme.js      # Tema claro/oscuro y modo proyector
│   ├── nav.js        # Lógica de pestañas
│   ├── calc.js       # Calculadora base (Explorar)
│   ├── subnetting.js # FLSM/VLSM (tabla de subredes)
│   ├── bitcalc.js    # Calculadora por bits (IP y máscara clicables)
│   └── game.js       # Minijuego de preguntas
└── README.md
```

## Personalización rápida

- **Tema**: colores en `:root` y `[data-theme="light"]` dentro de `styles.css`.
- **Tamaño de bits**: variables `--bit-size` y `--bit-font` (modo proyector ajusta ancho/ratio automáticamente).
- **Textos**: edita cadenas en `index.html` y `learn.html`.

## Juego: atajos y controles

- Responder: Enter.
- Saltar pregunta: botón “Saltar” o tecla Escape (no penaliza ni resta puntos).
- Fallos no restan; los aciertos suman 1 punto.
- Se muestra la racha actual y se guarda la mejor racha (localStorage).
- Selector de duración 1–10 min con chips (1m, 3m, 5m, 10m) y mejores puntuaciones por nivel (minutos).
- Ranking simple en la tarjeta: mejores por 1/3/5/10 min y mejor racha.
- Al finalizar se habilita “Descargar sesión” que exporta un TXT con: fecha, duración, puntos, racha máx y el detalle de cada pregunta (planteamiento, respuesta dada, correcta y resultado).

## Créditos

Créditos: Javier Feijóo López — Docente Informática en Secundaria, Xunta de Galicia — [github.com/javier-feijoo](https://github.com/javier-feijoo)

## Licencia
Este proyecto se publica bajo **Creative Commons CC BY-SA 4.0**. 
Puedes compartir y adaptar el material citando la autoría y manteniendo la misma licencia.
