# Requerimientos No Funcionales (RNF)

## 1. Calidad de Código y Análisis Estático
El proyecto valida la calidad del código en dos niveles (local y pipeline) con herramientas de costo cero (Open Source / capa gratuita para repositorios públicos).

### 1.1 Linter y formateador: Ruff
- **Ruff** reemplaza a Flake8, Black e Isort con una sola herramienta, mucho más rápida.
- La configuración vive en `pyproject.toml` (raíz del repositorio):

| Regla | Qué valida |
|---|---|
| `E`, `W` | Estilo (pycodestyle) |
| `F` | Errores lógicos: imports y variables sin usar (Pyflakes) |
| `C90` | Complejidad ciclomática: máximo **5** por función (`max-complexity = 5`) |
| `B` | Errores probables y malas prácticas (Bugbear) |
| `S` | Seguridad (Bandit): contraseñas hardcodeadas, uso inseguro de funciones, etc. |
| `N` | Convenciones de nombres (PEP 8) |

- Longitud máxima de línea: **88**. Versión objetivo: **Python 3.11**.

### 1.2 Tipado: Mypy
- **Mypy** en modo estricto. Requisito para validar los modelos de Pydantic y FastAPI antes del despliegue.

### 1.3 Pipeline CI/CD: GitHub Actions + SonarCloud
- El workflow `.github/workflows/calidad.yaml` se ejecuta en cada *push* y *Pull Request*:
  1. **Ruff** (`ruff check .`): si encuentra violaciones, el job falla.
  2. **SonarCloud**: audita bugs, vulnerabilidades, *code smells* y cobertura.
- **Fase inicial (informativa):** SonarCloud audita sin bloquear el *merge*.
- **Fase final (Quality Gate bloqueante):** el PR se rechaza si no cumple con 0 vulnerabilidades, 0 *code smells* críticos y **80 %** de cobertura en código nuevo.
- Los tokens (`SONAR_TOKEN`) se guardan como **secretos de GitHub**; nunca en el repositorio.
