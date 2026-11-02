# Backend startup bytecode repair — 2026-10-16

## Evidence and cause

- Submitted startup log: `ClassFormatError: Invalid method Code length 0` in
  `com.m4n.backend.entity.Article`, loaded by DevTools `RestartClassLoader`.
- Before repair, `target/classes/com/m4n/backend/entity/Article.class` was 8,385
  bytes, modified at 18:37:02. JDK 21 `javap -p -c` showed an empty no-argument
  constructor and an all-argument constructor that threw `Error` with
  `Unresolved compilation problems` / `Flexible Constructor Bodies` messages.
- The active VS Code Java language server used Eclipse JDT and its bundled
  Lombok 1.18.39 agent. Its workspace log contained the same source-level
  diagnostic for `Article.java` and other Lombok constructors. These are failed
  Eclipse compilation artifacts, not entity or database validation errors.
- IntelliJ's local project SDK was independently set to Java 25, while the
  project's Maven configuration requires Java 21.

## Changes

- Local IntelliJ `.idea/misc.xml`: Project SDK 21, language level JDK_21.
- Workspace `.vscode/settings.json`: select the installed JavaSE-21 runtime and
  disable Java auto-build so Eclipse does not overwrite Maven build output.
  Reload IDE settings before the next IDE build. VS Code Java debugging now
  needs an explicit successful Maven build first.
- `docs/DEVELOPMENT_GUIDE.md`: document build ownership and clean rebuild steps.
- No application source, dependency or business behavior was changed.

## Verification

- JDK 21.0.7, Maven Wrapper 3.9.16, offline `mvnw.cmd -o clean verify`:
  **465 tests, zero failures/errors/skips; BUILD SUCCESS**.
- Integration tests used disposable PostgreSQL database
  `m4n_bytecode_check_20261016`, created for this check and removed afterward.
- Recompiled Article is 7,105 bytes and its no-argument constructor invokes
  `Object.<init>` and returns normally. No compiled application class contains
  `Unresolved compilation problem`.
- Started the rebuilt executable jar with Java 21, existing local configuration,
  `ddl-auto=validate` and development seeding disabled. PID 3504 listens on 8080.
- At 18:42:40 local time, `GET /api/v1/health` returned HTTP 200, `status: UP`.
- Build log: `m4n-backend/target/startup-bytecode-verify.log`; startup logs:
  `startup-bytecode-fix.log` and `startup-bytecode-fix-error.log` in the same
  folder. These generated logs are replaced by future clean builds.
- The restored running backend uses the packaged jar. The IDE has not been
  reloaded or relaunched through its UI; reload the project/workspace to apply
  its saved settings before switching back to IDE execution.
