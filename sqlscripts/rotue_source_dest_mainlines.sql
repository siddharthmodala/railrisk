
DROP FUNCTION pgr_fromAtoB_Mainlines(varchar, double precision, double precision, 
                         double precision, double precision);

CREATE OR REPLACE FUNCTION pgr_fromAtoB_Mainlines(
                IN tbl varchar,
                IN x1 double precision,
                IN y1 double precision,
                IN x2 double precision,
                IN y2 double precision,
                OUT seq integer,
                OUT gid integer,
                OUT fraarcid text,
                OUT stateab text,
                OUT sigsys text,
                OUT subdiv text,
                OUT rrowner text,
                OUT heading double precision,
                OUT cost double precision,
                OUT miles numeric,
                OUT consequence numeric,
                OUT derailmentrate numeric,
                OUT geom geometry
        )
        RETURNS SETOF record AS
$BODY$
DECLARE
        sql     text;
        rec     record;
        source	integer;
        target	integer;
        point	integer;
        
BEGIN
	-- Find nearest node
	EXECUTE 'SELECT id::integer FROM rail_main_lines_vertices_pgr 
			ORDER BY the_geom <-> ST_GeometryFromText(''POINT(' 
			|| x1 || ' ' || y1 || ')'',4326) LIMIT 1' INTO rec;
	source := rec.id;
	
	EXECUTE 'SELECT id::integer FROM rail_main_lines_vertices_pgr 
			ORDER BY the_geom <-> ST_GeometryFromText(''POINT(' 
			|| x2 || ' ' || y2 || ')'',4326) LIMIT 1' INTO rec;
	target := rec.id;

	-- Shortest path query (TODO: limit extent by BBOX) 
        seq := 0;
        sql := 'SELECT gid, geom, fraarcid,stateab,sigsys,subdiv,rrowner1, cost, source, target,miles, consequence,derailmentrate,
				ST_Reverse(geom) AS flip_geom FROM ' ||
                        'pgr_dijkstra(''SELECT gid as id, source::int, target::int,miles::float,consequence::float,derailmentrate::float, '
                                        || 'st_length(geom)::float AS cost FROM '
                                        || quote_ident(tbl) || ''', '
                                        || source || ', ' || target 
                                        || ' , false, false), '
                                || quote_ident(tbl) || ' WHERE id2 = gid ORDER BY seq';

	-- Remember start point
        point := source;

        FOR rec IN EXECUTE sql
        LOOP
		-- Flip geometry (if required)
		IF ( point != rec.source ) THEN
			rec.geom := rec.flip_geom;
			point := rec.source;
		ELSE
			point := rec.target;
		END IF;

		-- Calculate heading (simplified)
		EXECUTE 'SELECT degrees( ST_Azimuth( 
				ST_StartPoint(''' || rec.geom::text || '''),
				ST_EndPoint(''' || rec.geom::text || ''') ) )' 
			INTO heading;

		-- Return record
                seq     := seq + 1;
                gid     := rec.gid;
                fraarcid    := rec.fraarcid;
                stateab := rec.stateab;
                sigsys	:= rec.sigsys;
                subdiv	:= rec.subdiv;
                rrowner	:= rec.rrowner1;
                cost    := rec.cost;
                geom    := rec.geom;
                miles	:= rec.miles;   
                consequence := rec.consequence;
                derailmentrate := rec.derailmentrate;             
                RETURN NEXT;
        END LOOP;
        RETURN;
END;
$BODY$
LANGUAGE 'plpgsql' VOLATILE STRICT;