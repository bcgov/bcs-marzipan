"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const seed_runner_1 = require("./seed-runner");
(0, vitest_1.describe)('parseSqlStatements', () => {
    (0, vitest_1.describe)('basic parsing', () => {
        (0, vitest_1.it)('parses a single simple statement', () => {
            const sql = 'SELECT * FROM users;';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('parses multiple simple statements', () => {
            const sql = 'SELECT * FROM users; SELECT * FROM posts;';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
        });
        (0, vitest_1.it)('handles statements with newlines', () => {
            const sql = `SELECT * FROM users
WHERE id = 1;`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users\nWHERE id = 1']);
        });
        (0, vitest_1.it)('handles multiple statements with newlines', () => {
            const sql = `SELECT * FROM users;
INSERT INTO posts (title) VALUES ('Hello');`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                'SELECT * FROM users',
                "INSERT INTO posts (title) VALUES ('Hello')",
            ]);
        });
    });
    (0, vitest_1.describe)('string literals', () => {
        (0, vitest_1.it)('ignores semicolons inside single-quoted strings', () => {
            const sql = "INSERT INTO foo VALUES ('value;with;semicolons');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                "INSERT INTO foo VALUES ('value;with;semicolons')",
            ]);
        });
        (0, vitest_1.it)('handles multiple semicolons in strings', () => {
            const sql = "SELECT 'a;b;c' AS value; SELECT 'x;y' AS other;";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                "SELECT 'a;b;c' AS value",
                "SELECT 'x;y' AS other",
            ]);
        });
        (0, vitest_1.it)('handles strings with quotes and semicolons', () => {
            const sql = "INSERT INTO foo VALUES ('it''s a test; value');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                "INSERT INTO foo VALUES ('it''s a test; value')",
            ]);
        });
        (0, vitest_1.it)('handles empty strings', () => {
            const sql = "INSERT INTO foo VALUES ('');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(["INSERT INTO foo VALUES ('')"]);
        });
        (0, vitest_1.it)('handles strings spanning multiple lines', () => {
            const sql = `INSERT INTO foo VALUES ('line1
line2');`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(["INSERT INTO foo VALUES ('line1\nline2')"]);
        });
    });
    (0, vitest_1.describe)('escaped quotes', () => {
        (0, vitest_1.it)('handles SQL escaped quotes (double single quotes)', () => {
            const sql = "INSERT INTO foo VALUES ('it''s escaped');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(["INSERT INTO foo VALUES ('it''s escaped')"]);
        });
        (0, vitest_1.it)('handles multiple escaped quotes', () => {
            const sql = "INSERT INTO foo VALUES ('it''s a ''test'' value');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                "INSERT INTO foo VALUES ('it''s a ''test'' value')",
            ]);
        });
        (0, vitest_1.it)('handles escaped quotes at string boundaries', () => {
            const sql = "INSERT INTO foo VALUES ('''');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(["INSERT INTO foo VALUES ('''')"]);
        });
        (0, vitest_1.it)('handles escaped quotes with semicolons', () => {
            const sql = "INSERT INTO foo VALUES ('it''s; a test');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(["INSERT INTO foo VALUES ('it''s; a test')"]);
        });
    });
    (0, vitest_1.describe)('line comments', () => {
        (0, vitest_1.it)('ignores semicolons in line comments', () => {
            const sql = 'SELECT * FROM users; -- comment with ; semicolon';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('handles line comments before statements', () => {
            const sql = '-- This is a comment\nSELECT * FROM users;';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('handles line comments after statements', () => {
            const sql = 'SELECT * FROM users; -- end comment';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('handles line comments in the middle of statements', () => {
            const sql = `SELECT * FROM users
-- comment in middle
WHERE id = 1;`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users\nWHERE id = 1']);
        });
        (0, vitest_1.it)('handles multiple line comments', () => {
            const sql = `-- comment 1
SELECT * FROM users;
-- comment 2
SELECT * FROM posts;`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
        });
        (0, vitest_1.it)('does not treat -- inside strings as comments', () => {
            const sql = "INSERT INTO foo VALUES ('-- not a comment');";
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(["INSERT INTO foo VALUES ('-- not a comment')"]);
        });
    });
    (0, vitest_1.describe)('block comments', () => {
        (0, vitest_1.it)('removes block comments', () => {
            const sql = 'SELECT * FROM users; /* block comment */';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('removes block comments with semicolons', () => {
            const sql = 'SELECT * FROM users; /* block with ; semicolon */';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('removes multi-line block comments', () => {
            const sql = `SELECT * FROM users;
/* multi-line
   block comment
   with ; semicolon */`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('removes block comments between statements', () => {
            const sql = `SELECT * FROM users;
/* comment */
SELECT * FROM posts;`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
        });
        (0, vitest_1.it)('removes nested block comments', () => {
            const sql = 'SELECT * FROM users; /* outer /* inner */ comment */';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('handles empty input', () => {
            const result = (0, seed_runner_1.parseSqlStatements)('');
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)('handles whitespace-only input', () => {
            const result = (0, seed_runner_1.parseSqlStatements)('   \n\t  ');
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)('handles statement without trailing semicolon', () => {
            const sql = 'SELECT * FROM users';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('handles multiple statements where last has no semicolon', () => {
            const sql = 'SELECT * FROM users; SELECT * FROM posts';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
        });
        (0, vitest_1.it)('trims whitespace from statements', () => {
            const sql = '  SELECT * FROM users  ;  ';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users']);
        });
        (0, vitest_1.it)('handles multiple consecutive semicolons', () => {
            const sql = 'SELECT * FROM users;; SELECT * FROM posts;';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
        });
        (0, vitest_1.it)('handles semicolons with only whitespace between', () => {
            const sql = 'SELECT * FROM users;   ;   SELECT * FROM posts;';
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
        });
    });
    (0, vitest_1.describe)('complex scenarios', () => {
        (0, vitest_1.it)('handles all comment types together', () => {
            const sql = `-- line comment
SELECT * FROM users;
/* block comment */
INSERT INTO posts VALUES ('test''s value; with semicolon');
-- another comment`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                'SELECT * FROM users',
                "INSERT INTO posts VALUES ('test''s value; with semicolon')",
            ]);
        });
        (0, vitest_1.it)('handles real-world INSERT statement', () => {
            const sql = `INSERT INTO activities (title, description) VALUES
('Meeting', 'Team meeting; agenda: discuss project');
INSERT INTO activities (title) VALUES ('Lunch');`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                "INSERT INTO activities (title, description) VALUES\n('Meeting', 'Team meeting; agenda: discuss project')",
                "INSERT INTO activities (title) VALUES ('Lunch')",
            ]);
        });
        (0, vitest_1.it)('handles CREATE TABLE with complex string values', () => {
            const sql = `CREATE TABLE test (id INT);
INSERT INTO test VALUES (1);
INSERT INTO test VALUES (2); -- comment`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                'CREATE TABLE test (id INT)',
                'INSERT INTO test VALUES (1)',
                'INSERT INTO test VALUES (2)',
            ]);
        });
        (0, vitest_1.it)('handles strings with escaped quotes and comments', () => {
            const sql = `INSERT INTO foo VALUES ('it''s a test'); -- comment
INSERT INTO bar VALUES ('another ''value''');`;
            const result = (0, seed_runner_1.parseSqlStatements)(sql);
            (0, vitest_1.expect)(result).toEqual([
                "INSERT INTO foo VALUES ('it''s a test')",
                "INSERT INTO bar VALUES ('another ''value''')",
            ]);
        });
    });
});
