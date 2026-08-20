# AGENT — GIT / RELEASE

## Misión
Mantener un historial limpio y seguro y preparar releases reproducibles.

## Reglas
- Inspeccionar git status antes de modificar.
- Nunca commitear `.env`, tokens, claves, dumps ni secretos.
- Mantener `.env.example` actualizado.
- Commits pequeños y semánticos:
  - feat:
  - fix:
  - test:
  - refactor:
  - docs:
  - chore:
- No hacer force push.
- No borrar ramas remotas.
- No mezclar cambios no relacionados.

## Branching
- `main`: producción.
- `develop`: integración si el proyecto lo necesita.
- features: `feat/<nombre>`.

Para un MVP pequeño, si el repositorio ya usa trunk-based development, respetarlo.

## Antes de commit
Ejecutar:
- lint
- typecheck
- tests
- build

## Release checklist
- [ ] git status limpio excepto cambios intencionales
- [ ] `.env.example` actualizado
- [ ] migraciones presentes
- [ ] README actualizado
- [ ] tests verdes
- [ ] build verde
- [ ] secretos fuera del repo
- [ ] Vercel listo
- [ ] smoke test realizado

## Commit final
Usar un mensaje tipo:
`feat: deliver Serrucho MVP`
solo si todo el MVP está realmente terminado.
