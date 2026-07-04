# UChile Bench web

Sitio estatico para publicar resultados de UChile Bench.

## Comandos

Generar datos desde `runs/`:

```bash
bun run web:data
```

Desarrollo local:

```bash
bun run web:dev
```

Build publicable:

```bash
bun run web:build
```

Preview del build:

```bash
bun run web:preview
```

## Cloudflare Pages

- Framework preset: `Astro`
- Build command: `bun run web:build`
- Build output directory: `web/dist`

El comando `web:build` regenera `web/public/data/manifest.json` y copia sesiones compactas a `web/public/data/sessions/`.

## Datos publicados

El sitio publica:

- targets, solvers, notas y costos en `web/public/data/manifest.json`;
- sesiones compactas del solver en `web/public/data/sessions/*.json`;
- costo normalizado por modelo, incluido DeepSeek V4 Flash aunque el provider lo haya reportado como gratis.

No publica `original/`, `grading/`, runs archivados, credenciales ni sesiones del juez.
