CREATE OR REPLACE FUNCTION time_subtype_diff(x time, y time) RETURNS float8 AS
'SELECT EXTRACT(EPOCH FROM (x - y))' LANGUAGE sql STRICT IMMUTABLE;

CREATE TYPE time_range AS RANGE (
    subtype = time,
    subtype_diff = time_subtype_diff,
    multirange_type_name = time_multirange
);

CREATE OR REPLACE FUNCTION duration(mr time_multirange) RETURNS interval
  LANGUAGE sql IMMUTABLE LEAKPROOF
AS
$SQL$
  SELECT SUM(upper(r) - lower(r))
  FROM unnest(mr) AS r;
$SQL$;

SELECT expected, duration(mr) as obtained, mr as "from"
  FROM (VALUES
    ('1:00:00'::interval, time_multirange(time_range('08:00', '09:00'))),
    (null, time_multirange(time_range(null, '09:00'))),
    ('2:11:00'::interval, time_multirange(time_range('08:00', '09:00'),time_range('10:00', '11:11'))),
    ('2:11:00'::interval, time_multirange(time_range('08:00', '09:00'),time_range('10:00', '11:11'),time_range('13:00',null))),
    ('4:11:00'::interval, time_multirange(time_range('04:00', '05:00'),time_range('06:00', '07:00'),time_range('08:00', '09:00'),time_range('10:00', '11:11'))),
    (null, time_multirange())
  ) test_cases (expected, mr)
  WHERE duration(mr) is distinct from expected
