--DROP FUNCTION pgr_dijkstra(varchar,int,int);

CREATE OR REPLACE FUNCTION pgr_dijkstra(
                IN tbl varchar,
                IN source integer,
                IN target integer,
                OUT seq integer,
                OUT gid integer,
                OUT fraarcid text,
                OUT cost double precision,
                OUT geom geometry
        )
        RETURNS SETOF record AS
$BODY$
DECLARE
        sql     text;
        rec     record;
BEGIN
        seq     := 0;
        sql     := 'SELECT gid,geom FROM ' ||
                        'pgr_dijkstra(''SELECT gid as id, source::int, target::int, '
                                        || 'st_length(geom)::float AS cost FROM '
                                        || quote_ident(tbl) || ''', '
                                        || quote_literal(source) || ', '
                                        || quote_literal(target) || ' , false, false), '
                                || quote_ident(tbl) || ' WHERE id2 = gid ORDER BY seq';

        FOR rec IN EXECUTE sql
        LOOP
                seq     := seq + 1;
                gid     := rec.gid;
                geom    := rec.geom;
                RETURN NEXT;
        END LOOP;
        RETURN;
END;
$BODY$
LANGUAGE 'plpgsql' VOLATILE STRICT;

