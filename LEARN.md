# Aprender IPv4

Esta guía resume los conceptos clave de IPv4 con ejemplos. Es la base del contenido mostrado en la pestaña “Aprender” de la aplicación.

## Conceptos clave

- IPv4 usa 32 bits divididos en 4 octetos (p. ej., `192.168.1.10`).
- El prefijo `/n` (CIDR) indica cuántos bits son de red; el resto son de host.
- Red = IP AND máscara. Broadcast = red OR (NOT máscara).
- Rango de hosts: de red+1 a broadcast−1 (excepto /31 y /32).
- Hosts utilizables = `2^(32 − n) − 2` para `n ≤ 30`; en `/31` hay 2 y en `/32` hay 1.

## Máscaras y CIDR

- Máscaras válidas: bits a 1 consecutivos de izquierda a derecha y luego 0.
- Equivalencias útiles: `/8 = 255.0.0.0`, `/16 = 255.255.0.0`, `/24 = 255.255.255.0`, `/26 = 255.255.255.192`, `/30 = 255.255.255.252`.
- Tamaño de subred (bloque) = `2^(32 − n)` direcciones (incluye red y broadcast).

## Cálculos con ejemplos

### Ejemplo 1: `172.16.34.129/20`

- Bloque: `2^(32−20) = 4096` (`255.255.240.0`).
- Red más cercana múltiplo de 4096: `172.16.32.0`.
- Red: `172.16.32.0` — Broadcast: `172.16.47.255`.
- Rango de hosts: `172.16.32.1` — `172.16.47.254`.
- Hosts utilizables: `4096 − 2 = 4094`.

### Ejemplo 2: `10.1.5.200/26`

- Bloque: `2^(32−26) = 64` (`255.255.255.192`).
- Subred en ese octeto: …, `.128`, `.192` (siguiente `.256` no existe). Red: `10.1.5.192`.
- Broadcast: `10.1.5.255`. Rango: `10.1.5.193` — `10.1.5.254`.
- Hosts utilizables: `64 − 2 = 62`.

## Clases y rangos especiales

- Clases tradicionales (referencia): A `0–127`, B `128–191`, C `192–223`, D Multicast `224–239`, E Experimental `240–255`.
- Privadas: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- Link‑local (APIPA): `169.254.0.0/16` — Loopback: `127.0.0.0/8`.
- Indeterminada: `0.0.0.0` — Broadcast limitado: `255.255.255.255`.

## Subnetting rápido (FLSM)

1. Elige cuántas subredes necesitas: `k = ceil(log2(n))` bits extra.
2. Nuevo prefijo: `/n' = /n + k`. Bloque: `2^(32 − n')`.
3. Enumera redes sumando el bloque a partir de la red base.

Ejemplo (`192.168.1.0/24` en 6 subredes): `k = 3` → `/27`, bloque `32`. Subredes: `.0`, `.32`, `.64`, `.96`, `.128`, `.160`, `.192`, `.224` → 6 usadas y 2 libres.

## VLSM (tamaños variables)

1. Ordena necesidades de hosts (descendente).
2. Para cada una, calcula el prefijo mínimo que soporte `hosts + 2`.
3. Alinea cada subred al siguiente múltiplo de su bloque dentro de la red base.

Ejemplo (`192.168.10.0/24` con `100, 50, 20`): `/25` → `192.168.10.0/25`; `/26` → `192.168.10.128/26`; `/27` → `192.168.10.192/27` (quedan libres /27 y menores).

## Trucos y errores comunes

- `/31` y `/32` no siguen la regla de restar 2 hosts: casos especiales.
- Si una máscara no es “1s seguidos y luego 0s”, no es CIDR válida.
- Usa el bloque para saltar entre subredes en el octeto donde cambia el prefijo.
- Rangos privados no son enrutables en Internet; se usan en LANs.

## Recordatorio rápido

- Por cada subred IPv4 tradicional hay 2 direcciones no asignables a hosts: red y broadcast.
- Para dimensionar por hosts, usa: `prefijo = 32 − ceil(log2(hosts + 2))` y bloque `2^(32 − prefijo)`.
- Los prefijos `/31` y `/32` se reservan para casos puntuales (enlaces punto a punto o direcciones de host únicas) y no aplican cuando dimensionas por “hosts utilizables en una subred”.
