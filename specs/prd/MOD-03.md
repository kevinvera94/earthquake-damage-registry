# MOD-03 — Personas ocupantes
> Prioridad: **Debe estar** · Roles: Inspector, Administrador · BRIEF §8.3, §9, RN-05 a RN-07

## Objetivo
Registrar a las personas (propietarios y arrendatarios) que ocupan cada edificación con las características que pide el tablero del profesor.

## Requerimientos

### RF-03-01 Agregar persona a una edificación
Campos de BRIEF §8.3: nombres y apellidos, tipo y número de documento, vínculo, fecha de nacimiento, condición especial (múltiple), tipo de población.
- **CA-1** Se agrega desde la ficha de la edificación (RN-05)
- **CA-2** Si el tipo de documento es "Sin documento", el número se oculta y no se exige; en otro caso es obligatorio
- **CA-3** "Ninguna" en condición especial es excluyente con las demás opciones
- **CA-4** Tipo de población por defecto "Civil"
- **CA-5** La fecha de nacimiento no puede ser futura

### RF-03-02 Evitar duplicados en la edificación (RN-06)
- **CA-1** Con documento: no se acepta otra persona con el mismo tipo y número **en la misma edificación** (409)
- **CA-2** Sin documento: no se acepta otra persona con el mismo nombre completo (sin distinguir mayúsculas ni tildes) y la misma fecha de nacimiento en la misma edificación
- **CA-3** La misma persona sí puede estar en edificaciones distintas

### RF-03-03 Edad y rango etario calculados (RN-07)
- **CA-1** La edad se calcula a la fecha actual; no es un campo editable
- **CA-2** Rangos: 0–9 "Niños menores de 10", 10–17 "Niños y adolescentes", 18–59 "Adultos", 60+ "Adultos mayores"
- **CA-3** Casos límite probados: 9, 10, 17, 18, 59 y 60 años

### RF-03-04 Editar y retirar persona
- **CA-1** Se pueden editar todos los campos, con las mismas validaciones
- **CA-2** Retirar elimina a la persona de la edificación, previa confirmación en pantalla

### RF-03-05 Listado en la ficha
- **CA-1** La ficha muestra las personas con nombre, documento, vínculo, edad, rango, condición y tipo de población

## Fuera de alcance
Género, etnia, parentesco, hogar, alojamiento, estado tras el sismo, historial de ocupantes por inspección (BRIEF §14).
