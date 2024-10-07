CREATE OR REPLACE FUNCTION time_subtype_diff(x time, y time) RETURNS float8 AS
'SELECT EXTRACT(EPOCH FROM (x - y))' LANGUAGE sql STRICT IMMUTABLE;

CREATE TYPE time_range AS RANGE (
    subtype = time,
    subtype_diff = time_subtype_diff
);
