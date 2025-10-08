# IPv4 Lab — Documentación de código (CC BY-SA 4.0)

Autor: Javier Feijóo López

Este documento resume la organización del código y describe las funciones clave de cada módulo.

## js/utils.js (utilidades IPv4 y validación)

- `clamp(n, min, max)`: limita un valor a un rango.
- `parseOctets(str)`: convierte "x.x.x.x" a `[a,b,c,d]` (0–255) o `null`.
- `octetsToStr(octets)`: lista de 4 octetos → cadena.
- `toUint32(octets)`, `fromUint32(u)`: conversión entre octetos y entero sin signo.
- `maskFromCidr(c)`: máscará en octetos a partir de `c` (0–32).
- `cidrFromMask(maskOctets)`: devuelve `c` si la máscara es CIDR válida; `-1` si no.
- `ipClass(o)`: clase A/B/C/D/E según primer octeto.
- `isPrivate(o)`: `true` si está en 10/8, 172.16/12 o 192.168/16.
- `network(ipU, maskU)`: `ip & mask`.
- `broadcast(netU, maskU)`: `net | ~mask`.
- `firstHost(netU, c)`, `lastHost(bcU, c)`: primer/último host (nulo en `/31` o `/32`).
- `usableHosts(c)`: `2^(32-c)-2` (casos especiales `/31`=2, `/32`=1).
- `bits32ToArray(u)`: array de 32 caracteres `'0'|'1'` (MSB→LSB).
- `maskToStrFromCidr(c)`: máscara en cadena desde CIDR.
- `blockSizeFromPrefix(p)`: tamaño de bloque `2^(32-p)`.
- `alignUp(u, base, block)`: alinea `u` al siguiente múltiplo de `block` relativo a `base`.
- `normalizeNetwork(ipO, c)`: devuelve `{ ipU, maskU, netU, bcU }` de una IP con prefijo.
- `sanitizeIpString(raw)`: limpia una entrada permitiendo escritura parcial (`10.`). No recorta a 0–255 durante la escritura.
- `attachIpSanitizer(el, { requireValidMask })`: añade sanitización progresiva; valida máscara CIDR si se indica.

## js/calc.js (Explorar)

- Render de bits para IP/Máscara/Red/Broadcast con etiqueta por fila.
- Sincronización entre máscara decimal y slider CIDR (última fuente de cambio gana).
- Salidas: red, broadcast, primer/último host, hosts utilizables, clase y privado.

Funciones destacadas:
- `renderBits(container, u, cidr, kind)`: pinta 32 bits con separadores por octeto.
- `updateAll()`: recalcula a partir de IP, máscara/CIDR y actualiza UI.

## js/subnetting.js (FLSM/VLSM)

- `simulateFLSM(baseIp, basePrefix, subBits, wantSubnets)`: genera `2^subBits` subredes; muestra “solicitadas/libres”.
- `simulateVLSM(baseIp, basePrefix, reqs)`: asigna bloques por demanda ordenada desc, con alineación y validaciones.
- `syncFlsmControls(source)`: mantiene en sincronía “bits” ↔ “subredes” (gana el último editado).
- Sanitización: IP base y lista de VLSM; límites de inputs numéricos.

## js/bitcalc.js (Calculadora por bits)

- Grilla de bits para IP (clic → alterna) y para Máscara (clic → fija prefijo). 
- Bloqueo de red opcional para que solo cambien bits de host.
- Muestra octetos decimales de IP y máscara como apoyo.

Funciones:
- `rebuildBitsGrid(netU, maskU, cidr)`: grilla interactiva de IP.
- `rebuildMaskGrid(cidr)`: grilla interactiva de máscara (controla prefijo).
- `updateBitsSim()`: sincroniza entradas, grillas y resultados.

## js/theme.js (tema y modo proyector)

- Persistencia de tema `light/dark` en `localStorage`.
- Modo `projector`: maximiza ancho y hace bits cuadrados a escala.

## js/nav.js (pestañas)

- Lógica básica para conmutar pestañas con `aria-selected` y `hidden`.

## js/game.js (minijuego)

- Genera preguntas aleatorias:
  - red, broadcast, hosts, primer/último host
  - máscara desde prefijo, prefijo desde máscara
  - clase A/B/C/D/E, privada sí/no
- Extra: wildcard, ¿es red?, ¿es broadcast?, ¿misma subred?, tamaño de bloque, ¿host utilizable?, subredes con bits prestados.
- Controles: Iniciar/Detener/Saltar (Escape también salta). Fallos no restan.
- Racha actual y mejor racha persistente (`ipv4lab.bestStreak`).
- Barra de tiempo con cambio de color al final, efectos visuales en acierto/fallo.
- Selector de duración (1–10 min): `#gameDuration`, variable `totalTime`.
- Mejor puntuación por nivel/duración: `ipv4lab.best.{min}`.
- Descarga de sesión: botón `#downloadLog`; genera TXT con log (`sessionLog`) mediante Blob.
- `isCorrect(val, current)`: normaliza y valida respuestas.

## styles.css (estilos)

- Temas claro/oscuro con variables CSS.
- Representación de bits con tamaño configurable y aspecto cuadrado en modo proyector.
- Estilo de formularios consistente (text/number) y layout compacto en Subnetting.

## index.html / learn.html

- `index.html`: estructura principal, pestañas y secciones.
- `learn.html`: versión standalone de los contenidos de “Aprender” (no se usa por defecto en la app, pero puede abrirse directamente).

## Licencia

Contenido y código documentados bajo **CC BY-SA 4.0**.
