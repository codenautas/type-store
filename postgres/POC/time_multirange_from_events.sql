-- Convierte una secuencia de eventos E(ntrada)/S(alida) en un time_multirange.
-- Reglas:
--   · E's consecutivas se colapsan: solo cuenta la primera de cada racha.
--   · S's consecutivas se colapsan: solo cuenta la primera de cada racha.
--   · Cada primera-E abre un rango; la primera-S siguiente lo cierra.
--   · Si la secuencia arranca con S → lower bound = null (rango abierto a la izquierda).
--   · Si la secuencia termina con E  → upper bound = null (rango abierto a la derecha).
--
-- Con los datos de ejemplo el resultado esperado es:
--   {[08:00:00,12:00:00),[14:10:00,16:00:00)}

-- /*
WITH eventos_raw(hora, tipo) AS (
    VALUES
        ('08:00'::time, 'E'),
        ('08:10'::time, 'E'),   -- consecutiva, se ignora
        ('12:00'::time, 'S'),
        ('13:00'::time, 'S'),   -- consecutiva, se ignora
        ('13:10'::time, 'S'),   -- consecutiva, se ignora
        ('14:10'::time, 'E'),
        ('14:20'::time, 'E'),   -- consecutiva, se ignora
        ('14:30'::time, 'E'),   -- consecutiva, se ignora
        ('16:00'::time, 'S'),
        ('16:10'::time, 'S')    -- consecutiva, se ignora
),

-- Conservar solo la primera fila de cada racha consecutiva del mismo tipo.
primeros AS (
    SELECT hora, tipo
    FROM (
        SELECT hora, tipo, LAG(tipo) OVER (ORDER BY hora) AS tipo_anterior
        FROM eventos_raw
    ) t
    WHERE tipo IS DISTINCT FROM tipo_anterior
),

-- Asignar grupo: cada E incrementa el contador; las S heredan el grupo actual.
-- Las filas anteriores a la primera E quedan en grupo 0 (caso: inicio con S).
eventos AS (
    SELECT
        hora,
        tipo,
        SUM(CASE WHEN tipo = 'E' THEN 1 ELSE 0 END)
            OVER (ORDER BY hora ROWS UNBOUNDED PRECEDING) AS grupo
    FROM primeros
),

-- Por grupo: primera E como entrada, primera S como salida.
rangos AS (
    SELECT
        grupo,
        MIN(CASE WHEN tipo = 'E' THEN hora END) AS entrada,
        MIN(CASE WHEN tipo = 'S' THEN hora END) AS salida
    FROM eventos
    GROUP BY grupo
)

-- Construir el multirange agregando todos los rangos individuales.
-- time_range(NULL, x) → (,x)   — lower unbounded (arranca con S)
-- time_range(x, NULL) → [x,)   — upper unbounded (termina con E)
SELECT range_agg(time_range(entrada, salida)) AS presencia
FROM rangos;
-- */