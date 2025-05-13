backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music ADD CONSTRAINT fk_music_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music ADD CONSTRAINT fk_music_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music ADD CONSTRAINT fk_music_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_sound_profile_id FOREIGN KEY(sound_profile_id) REFERENCES sound_profiles (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE physics_2d ADD CONSTRAINT fk_physics_2d_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE physics_2d ADD CONSTRAINT fk_physics_2d_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE physics_2d ADD CONSTRAINT fk_physics_2d_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] INSERT INTO alembic_version (version_num) VALUES ('5da119559737') RETURNING alembic_version.version_num
backend-1  | INFO  [sqlalchemy.engine.Engine] [generated in 0.00006s] {}
backend-1  | INFO  [alembic.runtime.migration] Running upgrade 5da119559737 -> d212af8da78a, add notes table
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE music (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    scene_id INTEGER,
backend-1  |    music_data JSON NOT NULL,
backend-1  |    algorithm VARCHAR(50),
backend-1  |    tempo INTEGER,
backend-1  |    key VARCHAR(10),
backend-1  |    scale VARCHAR(20),
backend-1  |    parameters JSON,
backend-1  |    audio_url VARCHAR(255),
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id),
backend-1  |    FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ROLLBACK
backend-1  | Traceback (most recent call last):
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1964, in _exec_single_context
backend-1  |     self.dialect.do_execute(
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 945, in do_execute
backend-1  |     cursor.execute(statement, parameters)
backend-1  | psycopg2.errors.DuplicateTable: relation "music" already exists
backend-1  |
backend-1  |
backend-1  | The above exception was the direct cause of the following exception:
backend-1  |
backend-1  | Traceback (most recent call last):
backend-1  |   File "/usr/local/bin/flask", line 8, in <module>
backend-1  |     sys.exit(main())
backend-1  |              ^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask/cli.py", line 1129, in main
backend-1  |     cli.main()
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1363, in main
backend-1  |     rv = self.invoke(ctx)
backend-1  |          ^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1830, in invoke
backend-1  |     return _process_result(sub_ctx.command.invoke(sub_ctx))
backend-1  |                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1830, in invoke
backend-1  |     return _process_result(sub_ctx.command.invoke(sub_ctx))
backend-1  |                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1226, in invoke
backend-1  |     return ctx.invoke(self.callback, **ctx.params)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 794, in invoke
backend-1  |     return callback(*args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/decorators.py", line 34, in new_func
backend-1  |     return f(get_current_context(), *args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask/cli.py", line 400, in decorator
backend-1  |     return ctx.invoke(f, *args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 794, in invoke
backend-1  |     return callback(*args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask_migrate/cli.py", line 157, in upgrade
backend-1  |     _upgrade(directory or g.directory, revision, sql, tag, x_arg or g.x_arg)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask_migrate/__init__.py", line 111, in wrapped
backend-1  |     f(*args, **kwargs)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask_migrate/__init__.py", line 200, in upgrade
backend-1  |     command.upgrade(config, revision, sql=sql, tag=tag)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/command.py", line 408, in upgrade
backend-1  |     script.run_env()
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/script/base.py", line 586, in run_env
backend-1  |     util.load_python_file(self.dir, "env.py")
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/util/pyfiles.py", line 95, in load_python_file
backend-1  |     module = load_module_py(module_id, path)
backend-1  |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/util/pyfiles.py", line 113, in load_module_py
backend-1  |     spec.loader.exec_module(module)  # type: ignore
backend-1  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "<frozen importlib._bootstrap_external>", line 940, in exec_module
backend-1  |   File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
backend-1  |   File "/app/migrations/env.py", line 113, in <module>
backend-1  |     run_migrations_online()
backend-1  |   File "/app/migrations/env.py", line 107, in run_migrations_online
backend-1  |     context.run_migrations()
backend-1  |   File "<string>", line 8, in run_migrations
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/runtime/environment.py", line 946, in run_migrations
backend-1  |     self.get_context().run_migrations(**kw)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/runtime/migration.py", line 623, in run_migrations
backend-1  |     step.migration_fn(**kw)
backend-1  |   File "/app/migrations/versions/d212af8da78a_add_notes_table.py", line 21, in upgrade
backend-1  |     op.create_table('music',
backend-1  |   File "<string>", line 8, in create_table
backend-1  |   File "<string>", line 3, in create_table
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/operations/ops.py", line 1317, in create_table
backend-1  |     return operations.invoke(op)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/operations/base.py", line 441, in invoke
backend-1  |     return fn(self, operation)
backend-1  |            ^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/operations/toimpl.py", line 130, in create_table
backend-1  |     operations.impl.create_table(table, **kw)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/ddl/impl.py", line 405, in create_table
backend-1  |     self._exec(schema.CreateTable(table, **kw))
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/ddl/impl.py", line 246, in _exec
backend-1  |     return conn.execute(construct, params)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1416, in execute
backend-1  |     return meth(
backend-1  |            ^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/sql/ddl.py", line 187, in _execute_on_connection
backend-1  |     return connection._execute_ddl(
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1527, in _execute_ddl
backend-1  |     ret = self._execute_context(
backend-1  |           ^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1843, in _execute_context
backend-1  |     return self._exec_single_context(
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1983, in _exec_single_context
backend-1  |     self._handle_dbapi_exception(
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2352, in _handle_dbapi_exception
backend-1  |     raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1964, in _exec_single_context
backend-1  |     self.dialect.do_execute(
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 945, in do_execute
backend-1  |     cursor.execute(statement, parameters)
backend-1  | sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DuplicateTable) relation "music" already exists
backend-1  |
backend-1  | [SQL:
backend-1  | CREATE TABLE music (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    scene_id INTEGER,
backend-1  |    music_data JSON NOT NULL,
backend-1  |    algorithm VARCHAR(50),
backend-1  |    tempo INTEGER,
backend-1  |    key VARCHAR(10),
backend-1  |    scale VARCHAR(20),
backend-1  |    parameters JSON,
backend-1  |    audio_url VARCHAR(255),
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id),
backend-1  |    FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | )
backend-1  |
backend-1  | ]
backend-1  | (Background on this error at: https://sqlalche.me/e/20/f405)
backend-1  | Waiting for database...
backend-1  | db:5432 - accepting connections
backend-1  | Database is up!
backend-1  | Applying database migrations...
backend-1  | DEBUG - JWT_SECRET_KEY: 'jwt-s...'
backend-1  | DEBUG - JWT_REFRESH_SECRET_KEY: 'jwt-s...'
backend-1  | WARNING: fixes modules not found, continuing without fixes
backend-1  | WARNING: fixes modules not found, continuing without fixes
backend-1  | [2025-05-13 18:47:14,263] INFO in __init__: Using configuration: DevelopmentConfig
backend-1  | [2025-05-13 18:47:14,263] INFO in config: JWT Configuration:
backend-1  | [2025-05-13 18:47:14,263] INFO in config: - Secret Key (first 3 chars): jwt...
backend-1  | [2025-05-13 18:47:14,263] INFO in config: - Access Token Expires: 1:00:00
backend-1  | [2025-05-13 18:47:14,263] INFO in config: - Refresh Token Expires: 30 days, 0:00:00
backend-1  | [2025-05-13 18:47:14,275] DEBUG in __init__: JWT secret key in use (first 3 chars): jwt...
backend-1  | [2025-05-13 18:47:14,275] INFO in __init__: JWT monkey patches applied successfully
backend-1  | [2025-05-13 18:47:14,275] INFO in __init__: CORS configuration: origins=['http://localhost:5173', 'http://127.0.0.1:5173'], credentials=True
backend-1  | [2025-05-13 18:47:14,276] INFO in __init__: Using static folder: /app/static
backend-1  | INFO  [sqlalchemy.engine.Engine] select pg_catalog.version()
backend-1  | INFO  [sqlalchemy.engine.Engine] [raw sql] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] select current_schema()
backend-1  | INFO  [sqlalchemy.engine.Engine] [raw sql] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] show standard_conforming_strings
backend-1  | INFO  [sqlalchemy.engine.Engine] [raw sql] {}
backend-1  | INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
backend-1  | INFO  [alembic.runtime.migration] Will assume transactional DDL.
backend-1  | INFO  [sqlalchemy.engine.Engine] BEGIN (implicit)
backend-1  | INFO  [sqlalchemy.engine.Engine] SELECT pg_catalog.pg_class.relname
backend-1  | FROM pg_catalog.pg_class JOIN pg_catalog.pg_namespace ON pg_catalog.pg_namespace.oid = pg_catalog.pg_class.relnamespace
backend-1  | WHERE pg_catalog.pg_class.relname = %(table_name)s AND pg_catalog.pg_class.relkind = ANY (ARRAY[%(param_1)s, %(param_2)s, %(param_3)s, %(param_4)s, %(param_5)s]) AND pg_catalog.pg_table_is_visible(pg_catalog.pg_class.oid) AND pg_catalog.pg_namespace.nspname != %(nspname_1)s
backend-1  | INFO  [sqlalchemy.engine.Engine] [generated in 0.00008s] {'table_name': 'alembic_version', 'param_1': 'r', 'param_2': 'p', 'param_3': 'f', 'param_4': 'v', 'param_5': 'm', 'nspname_1': 'pg_catalog'}
backend-1  | INFO  [sqlalchemy.engine.Engine] SELECT pg_catalog.pg_class.relname
backend-1  | FROM pg_catalog.pg_class JOIN pg_catalog.pg_namespace ON pg_catalog.pg_namespace.oid = pg_catalog.pg_class.relnamespace
backend-1  | WHERE pg_catalog.pg_class.relname = %(table_name)s AND pg_catalog.pg_class.relkind = ANY (ARRAY[%(param_1)s, %(param_2)s, %(param_3)s, %(param_4)s, %(param_5)s]) AND pg_catalog.pg_table_is_visible(pg_catalog.pg_class.oid) AND pg_catalog.pg_namespace.nspname != %(nspname_1)s
backend-1  | INFO  [sqlalchemy.engine.Engine] [cached since 0.001477s ago] {'table_name': 'alembic_version', 'param_1': 'r', 'param_2': 'p', 'param_3': 'f', 'param_4': 'v', 'param_5': 'm', 'nspname_1': 'pg_catalog'}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE alembic_version (
backend-1  |    version_num VARCHAR(32) NOT NULL,
backend-1  |    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [alembic.runtime.migration] Running upgrade  -> 5da119559737, create initial tables
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE users (
backend-1  |    username VARCHAR(80) NOT NULL,
backend-1  |    email VARCHAR(120) NOT NULL,
backend-1  |    password_hash VARCHAR(255),
backend-1  |    version INTEGER NOT NULL,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00005s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_users_created_at ON users (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE UNIQUE INDEX ix_users_email ON users (email)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_users_is_deleted ON users (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_users_updated_at ON users (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00006s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE UNIQUE INDEX ix_users_username ON users (username)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE universes (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    sound_profile_id INTEGER,
backend-1  |    is_public BOOLEAN NOT NULL,
backend-1  |    genre VARCHAR(100),
backend-1  |    theme VARCHAR(100),
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_universes_created_at ON universes (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_universes_is_deleted ON universes (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_universes_name ON universes (name)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_universes_sound_profile_id ON universes (sound_profile_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_universes_updated_at ON universes (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_universes_user_id ON universes (user_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE scenes (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    summary TEXT,
backend-1  |    content TEXT,
backend-1  |    notes_text TEXT,
backend-1  |    location VARCHAR(200),
backend-1  |    scene_type VARCHAR(50),
backend-1  |    time_of_day VARCHAR(50),
backend-1  |    status VARCHAR(50),
backend-1  |    significance VARCHAR(50),
backend-1  |    date_of_scene VARCHAR(50),
backend-1  |    "order" INTEGER,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    sound_profile_id INTEGER,
backend-1  |    is_public BOOLEAN NOT NULL,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_scenes_created_at ON scenes (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_scenes_is_deleted ON scenes (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_scenes_name ON scenes (name)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_scenes_sound_profile_id ON scenes (sound_profile_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_scenes_universe_id ON scenes (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_scenes_updated_at ON scenes (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE sound_profiles (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER,
backend-1  |    scene_id INTEGER,
backend-1  |    ambient_volume FLOAT NOT NULL,
backend-1  |    music_volume FLOAT NOT NULL,
backend-1  |    effects_volume FLOAT NOT NULL,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_created_at ON sound_profiles (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_is_deleted ON sound_profiles (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_name ON sound_profiles (name)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_scene_id ON sound_profiles (scene_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_universe_id ON sound_profiles (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_updated_at ON sound_profiles (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_sound_profiles_user_id ON sound_profiles (user_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE universes ADD CONSTRAINT fk_universes_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE scenes ADD CONSTRAINT fk_scenes_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE sound_profiles ADD CONSTRAINT fk_sound_profiles_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE sound_profiles ADD CONSTRAINT fk_sound_profiles_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE universes ADD CONSTRAINT fk_universes_sound_profile_id FOREIGN KEY(sound_profile_id) REFERENCES sound_profiles (id) ON DELETE SET NULL
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE scenes ADD CONSTRAINT fk_scenes_sound_profile_id FOREIGN KEY(sound_profile_id) REFERENCES sound_profiles (id) ON DELETE SET NULL
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE sound_profiles ADD CONSTRAINT fk_sound_profiles_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE audio_samples (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    file_path VARCHAR(255) NOT NULL,
backend-1  |    duration FLOAT,
backend-1  |    sample_rate INTEGER,
backend-1  |    channels INTEGER,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    sound_profile_id INTEGER,
backend-1  |    universe_id INTEGER,
backend-1  |    scene_id INTEGER,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_created_at ON audio_samples (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_is_deleted ON audio_samples (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_name ON audio_samples (name)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_scene_id ON audio_samples (scene_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_sound_profile_id ON audio_samples (sound_profile_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_universe_id ON audio_samples (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_updated_at ON audio_samples (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_audio_samples_user_id ON audio_samples (user_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE characters (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_characters_created_at ON characters (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_characters_is_deleted ON characters (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_characters_universe_id ON characters (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_characters_updated_at ON characters (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE music (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    scene_id INTEGER,
backend-1  |    music_data JSON NOT NULL,
backend-1  |    algorithm VARCHAR(50),
backend-1  |    tempo INTEGER,
backend-1  |    key VARCHAR(10),
backend-1  |    scale VARCHAR(20),
backend-1  |    parameters JSON,
backend-1  |    audio_url VARCHAR(255),
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_created_at ON music (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_is_deleted ON music (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_name ON music (name)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_scene_id ON music (scene_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_universe_id ON music (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_updated_at ON music (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_user_id ON music (user_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE music_pieces (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    file_path VARCHAR(255) NOT NULL,
backend-1  |    duration FLOAT,
backend-1  |    tempo INTEGER,
backend-1  |    key VARCHAR(10),
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    sound_profile_id INTEGER,
backend-1  |    universe_id INTEGER,
backend-1  |    scene_id INTEGER,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_created_at ON music_pieces (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_is_deleted ON music_pieces (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_name ON music_pieces (name)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_scene_id ON music_pieces (scene_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_sound_profile_id ON music_pieces (sound_profile_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_universe_id ON music_pieces (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_updated_at ON music_pieces (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_music_pieces_user_id ON music_pieces (user_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE physics_2d (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    scene_id INTEGER,
backend-1  |    gravity_x FLOAT NOT NULL,
backend-1  |    gravity_y FLOAT NOT NULL,
backend-1  |    allow_sleep BOOLEAN NOT NULL,
backend-1  |    warm_starting BOOLEAN NOT NULL,
backend-1  |    continuous_physics BOOLEAN NOT NULL,
backend-1  |    sub_stepping BOOLEAN NOT NULL,
backend-1  |    velocity_iterations INTEGER NOT NULL,
backend-1  |    position_iterations INTEGER NOT NULL,
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id)
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_physics_2d_created_at ON physics_2d (created_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_physics_2d_is_deleted ON physics_2d (is_deleted)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_physics_2d_scene_id ON physics_2d (scene_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_physics_2d_universe_id ON physics_2d (universe_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_physics_2d_updated_at ON physics_2d (updated_at)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] CREATE INDEX ix_physics_2d_user_id ON physics_2d (user_id)
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00002s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE audio_samples ADD CONSTRAINT fk_audio_samples_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE audio_samples ADD CONSTRAINT fk_audio_samples_sound_profile_id FOREIGN KEY(sound_profile_id) REFERENCES sound_profiles (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE audio_samples ADD CONSTRAINT fk_audio_samples_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE audio_samples ADD CONSTRAINT fk_audio_samples_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE characters ADD CONSTRAINT fk_characters_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music ADD CONSTRAINT fk_music_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00004s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music ADD CONSTRAINT fk_music_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music ADD CONSTRAINT fk_music_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_sound_profile_id FOREIGN KEY(sound_profile_id) REFERENCES sound_profiles (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE music_pieces ADD CONSTRAINT fk_music_pieces_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE physics_2d ADD CONSTRAINT fk_physics_2d_user_id FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE physics_2d ADD CONSTRAINT fk_physics_2d_universe_id FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ALTER TABLE physics_2d ADD CONSTRAINT fk_physics_2d_scene_id FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] INSERT INTO alembic_version (version_num) VALUES ('5da119559737') RETURNING alembic_version.version_num
backend-1  | INFO  [sqlalchemy.engine.Engine] [generated in 0.00006s] {}
backend-1  | INFO  [alembic.runtime.migration] Running upgrade 5da119559737 -> d212af8da78a, add notes table
backend-1  | INFO  [sqlalchemy.engine.Engine]
backend-1  | CREATE TABLE music (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    scene_id INTEGER,
backend-1  |    music_data JSON NOT NULL,
backend-1  |    algorithm VARCHAR(50),
backend-1  |    tempo INTEGER,
backend-1  |    key VARCHAR(10),
backend-1  |    scale VARCHAR(20),
backend-1  |    parameters JSON,
backend-1  |    audio_url VARCHAR(255),
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id),
backend-1  |    FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | )
backend-1  |
backend-1  |
backend-1  | INFO  [sqlalchemy.engine.Engine] [no key 0.00003s] {}
backend-1  | INFO  [sqlalchemy.engine.Engine] ROLLBACK
backend-1  | Traceback (most recent call last):
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1964, in _exec_single_context
backend-1  |     self.dialect.do_execute(
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 945, in do_execute
backend-1  |     cursor.execute(statement, parameters)
backend-1  | psycopg2.errors.DuplicateTable: relation "music" already exists
backend-1  |
backend-1  |
backend-1  | The above exception was the direct cause of the following exception:
backend-1  |
backend-1  | Traceback (most recent call last):
backend-1  |   File "/usr/local/bin/flask", line 8, in <module>
backend-1  |     sys.exit(main())
backend-1  |              ^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask/cli.py", line 1129, in main
backend-1  |     cli.main()
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1363, in main
backend-1  |     rv = self.invoke(ctx)
backend-1  |          ^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1830, in invoke
backend-1  |     return _process_result(sub_ctx.command.invoke(sub_ctx))
backend-1  |                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1830, in invoke
backend-1  |     return _process_result(sub_ctx.command.invoke(sub_ctx))
backend-1  |                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1226, in invoke
backend-1  |     return ctx.invoke(self.callback, **ctx.params)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 794, in invoke
backend-1  |     return callback(*args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/decorators.py", line 34, in new_func
backend-1  |     return f(get_current_context(), *args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask/cli.py", line 400, in decorator
backend-1  |     return ctx.invoke(f, *args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/click/core.py", line 794, in invoke
backend-1  |     return callback(*args, **kwargs)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask_migrate/cli.py", line 157, in upgrade
backend-1  |     _upgrade(directory or g.directory, revision, sql, tag, x_arg or g.x_arg)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask_migrate/__init__.py", line 111, in wrapped
backend-1  |     f(*args, **kwargs)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask_migrate/__init__.py", line 200, in upgrade
backend-1  |     command.upgrade(config, revision, sql=sql, tag=tag)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/command.py", line 408, in upgrade
backend-1  |     script.run_env()
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/script/base.py", line 586, in run_env
backend-1  |     util.load_python_file(self.dir, "env.py")
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/util/pyfiles.py", line 95, in load_python_file
backend-1  |     module = load_module_py(module_id, path)
backend-1  |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/util/pyfiles.py", line 113, in load_module_py
backend-1  |     spec.loader.exec_module(module)  # type: ignore
backend-1  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "<frozen importlib._bootstrap_external>", line 940, in exec_module
backend-1  |   File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
backend-1  |   File "/app/migrations/env.py", line 113, in <module>
backend-1  |     run_migrations_online()
backend-1  |   File "/app/migrations/env.py", line 107, in run_migrations_online
backend-1  |     context.run_migrations()
backend-1  |   File "<string>", line 8, in run_migrations
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/runtime/environment.py", line 946, in run_migrations
backend-1  |     self.get_context().run_migrations(**kw)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/runtime/migration.py", line 623, in run_migrations
backend-1  |     step.migration_fn(**kw)
backend-1  |   File "/app/migrations/versions/d212af8da78a_add_notes_table.py", line 21, in upgrade
backend-1  |     op.create_table('music',
backend-1  |   File "<string>", line 8, in create_table
backend-1  |   File "<string>", line 3, in create_table
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/operations/ops.py", line 1317, in create_table
backend-1  |     return operations.invoke(op)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/operations/base.py", line 441, in invoke
backend-1  |     return fn(self, operation)
backend-1  |            ^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/operations/toimpl.py", line 130, in create_table
backend-1  |     operations.impl.create_table(table, **kw)
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/ddl/impl.py", line 405, in create_table
backend-1  |     self._exec(schema.CreateTable(table, **kw))
backend-1  |   File "/usr/local/lib/python3.11/site-packages/alembic/ddl/impl.py", line 246, in _exec
backend-1  |     return conn.execute(construct, params)
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1416, in execute
backend-1  |     return meth(
backend-1  |            ^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/sql/ddl.py", line 187, in _execute_on_connection
backend-1  |     return connection._execute_ddl(
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1527, in _execute_ddl
backend-1  |     ret = self._execute_context(
backend-1  |           ^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1843, in _execute_context
backend-1  |     return self._exec_single_context(
backend-1  |            ^^^^^^^^^^^^^^^^^^^^^^^^^^
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1983, in _exec_single_context
backend-1  |     self._handle_dbapi_exception(
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2352, in _handle_dbapi_exception
backend-1  |     raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 1964, in _exec_single_context
backend-1  |     self.dialect.do_execute(
backend-1  |   File "/usr/local/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 945, in do_execute
backend-1  |     cursor.execute(statement, parameters)
backend-1  | sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DuplicateTable) relation "music" already exists
backend-1  |
backend-1  | [SQL:
backend-1  | CREATE TABLE music (
backend-1  |    name VARCHAR(100) NOT NULL,
backend-1  |    description TEXT,
backend-1  |    user_id INTEGER NOT NULL,
backend-1  |    universe_id INTEGER NOT NULL,
backend-1  |    scene_id INTEGER,
backend-1  |    music_data JSON NOT NULL,
backend-1  |    algorithm VARCHAR(50),
backend-1  |    tempo INTEGER,
backend-1  |    key VARCHAR(10),
backend-1  |    scale VARCHAR(20),
backend-1  |    parameters JSON,
backend-1  |    audio_url VARCHAR(255),
backend-1  |    id BIGSERIAL NOT NULL,
backend-1  |    created_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    updated_at TIMESTAMP WITHOUT TIME ZONE,
backend-1  |    is_deleted BOOLEAN,
backend-1  |    PRIMARY KEY (id),
backend-1  |    FOREIGN KEY(scene_id) REFERENCES scenes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(universe_id) REFERENCES universes (id) ON DELETE CASCADE,
backend-1  |    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
backend-1  | )
backend-1  |
backend-1  | ]
backend-1  | (Background on this error at: https://sqlalche.me/e/20/f405)
backend-1  | Waiting for database...
backend-1  | db:5432 - accepting connections
backend-1  | Database is up!
backend-1  | Applying database migrations...
backend-1  | Error: While importing 'app', an ImportError was raised:
backend-1  |
backend-1  | Traceback (most recent call last):
backend-1  |   File "/usr/local/lib/python3.11/site-packages/flask/cli.py", line 245, in locate_app
backend-1  |     __import__(module_name)
backend-1  |   File "/app/app/__init__.py", line 32, in <module>
backend-1  |     from .api.routes import api_bp
backend-1  |   File "/app/app/api/__init__.py", line 4, in <module>
backend-1  |     from ..api.routes.auth import auth_bp
backend-1  |   File "/app/app/api/routes/__init__.py", line 7, in <module>
backend-1  |     from .auth import auth_bp
backend-1  |   File "/app/app/api/routes/auth/__init__.py", line 7, in <module>
backend-1  |     from . import token
backend-1  |   File "/app/app/api/routes/auth/token.py", line 3, in <module>
backend-1  |     from ...models.user import User
backend-1  |   File "/app/app/api/models/__init__.py", line 8, in <module>
backend-1  |     from .audio import SoundProfile, AudioSample, MusicPiece, Harmony, MusicalTheme
backend-1  | ImportError: cannot import name 'MusicalTheme' from 'app.api.models.audio' (/app/app/api/models/audio.py)
backend-1  |
backend-1  |
backend-1  | Usage: flask [OPTIONS] COMMAND [ARGS]...
backend-1  | Try 'flask --help' for help.
backend-1  |
backend-1  | Error: No such command 'db'.
❯ docker-compose logs frontend
frontend-1  |
frontend-1  | > frontend@1.0.0 dev /app
frontend-1  | > vite --force --clearScreen=false --host --cors
frontend-1  |
frontend-1  | failed to load config from /app/vite.config.js
frontend-1  | error when starting dev server:
frontend-1  | Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /app/node_modules/.vite-temp/vite.config.js.timestamp-1747102091860-515065e1437e5.mjs
frontend-1  |     at new NodeError (node:internal/errors:405:5)
frontend-1  |     at packageResolve (node:internal/modules/esm/resolve:916:9)
frontend-1  |     at moduleResolve (node:internal/modules/esm/resolve:973:20)
frontend-1  |     at defaultResolve (node:internal/modules/esm/resolve:1206:11)
frontend-1  |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
frontend-1  |     at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
frontend-1  |     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
frontend-1  |     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39)
frontend-1  |     at link (node:internal/modules/esm/module_job:75:36)
frontend-1  |  ELIFECYCLE  Command failed with exit code 1.
frontend-1  |
frontend-1  | > frontend@1.0.0 dev /app
frontend-1  | > vite --force --clearScreen=false --host --cors
frontend-1  |
frontend-1  | failed to load config from /app/vite.config.js
frontend-1  | error when starting dev server:
frontend-1  | Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /app/node_modules/.vite-temp/vite.config.js.timestamp-1747161278398-003c8fd4e8a7a.mjs
frontend-1  |     at new NodeError (node:internal/errors:405:5)
frontend-1  |     at packageResolve (node:internal/modules/esm/resolve:916:9)
frontend-1  |     at moduleResolve (node:internal/modules/esm/resolve:973:20)
frontend-1  |     at defaultResolve (node:internal/modules/esm/resolve:1206:11)
frontend-1  |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
frontend-1  |     at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
frontend-1  |     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
frontend-1  |     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39)
frontend-1  |     at link (node:internal/modules/esm/module_job:75:36)
frontend-1  |  ELIFECYCLE  Command failed with exit code 1.
frontend-1  |
frontend-1  | > frontend@1.0.0 dev /app
frontend-1  | > vite --force --clearScreen=false --host --cors
frontend-1  |
frontend-1  | failed to load config from /app/vite.config.js
frontend-1  | error when starting dev server:
frontend-1  | Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /app/node_modules/.vite-temp/vite.config.js.timestamp-1747162034052-266eea5470e61.mjs
frontend-1  |     at new NodeError (node:internal/errors:405:5)
frontend-1  |     at packageResolve (node:internal/modules/esm/resolve:916:9)
frontend-1  |     at moduleResolve (node:internal/modules/esm/resolve:973:20)
frontend-1  |     at defaultResolve (node:internal/modules/esm/resolve:1206:11)
frontend-1  |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
frontend-1  |     at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
frontend-1  |     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
frontend-1  |     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39)
frontend-1  |     at link (node:internal/modules/esm/module_job:75:36)
frontend-1  |  ELIFECYCLE  Command failed with exit code 1.
frontend-1  |
frontend-1  | > frontend@1.0.0 dev /app
frontend-1  | > vite --force --clearScreen=false --host --cors
frontend-1  |
frontend-1  | failed to load config from /app/vite.config.js
frontend-1  | error when starting dev server:
frontend-1  | Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /app/node_modules/.vite-temp/vite.config.js.timestamp-1747162901580-f853f6c86a03b.mjs
frontend-1  |     at new NodeError (node:internal/errors:405:5)
frontend-1  |     at packageResolve (node:internal/modules/esm/resolve:916:9)
frontend-1  |     at moduleResolve (node:internal/modules/esm/resolve:973:20)
frontend-1  |     at defaultResolve (node:internal/modules/esm/resolve:1206:11)
frontend-1  |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
frontend-1  |     at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
frontend-1  |     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
frontend-1  |     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39)
frontend-1  |     at link (node:internal/modules/esm/module_job:75:36)
frontend-1  |  ELIFECYCLE  Command failed with exit code 1.

 ~/Des/A/ca/p/Harmonic-Universe │ greenlit *3 !7 ?2
            ✔ │ system ⬢ │ local hist │ 02:03:22 PM 
