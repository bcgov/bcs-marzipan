import { describe, it, expect } from 'vitest';
import { parseSqlStatements } from './seed-runner';

describe('parseSqlStatements', () => {
  describe('basic parsing', () => {
    it('parses a single simple statement', () => {
      const sql = 'SELECT * FROM users;';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('parses multiple simple statements', () => {
      const sql = 'SELECT * FROM users; SELECT * FROM posts;';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
    });

    it('handles statements with newlines', () => {
      const sql = `SELECT * FROM users
WHERE id = 1;`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users\nWHERE id = 1']);
    });

    it('handles multiple statements with newlines', () => {
      const sql = `SELECT * FROM users;
INSERT INTO posts (title) VALUES ('Hello');`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        'SELECT * FROM users',
        "INSERT INTO posts (title) VALUES ('Hello')",
      ]);
    });
  });

  describe('string literals', () => {
    it('ignores semicolons inside single-quoted strings', () => {
      const sql = "INSERT INTO foo VALUES ('value;with;semicolons');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        "INSERT INTO foo VALUES ('value;with;semicolons')",
      ]);
    });

    it('handles multiple semicolons in strings', () => {
      const sql = "SELECT 'a;b;c' AS value; SELECT 'x;y' AS other;";
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        "SELECT 'a;b;c' AS value",
        "SELECT 'x;y' AS other",
      ]);
    });

    it('handles strings with quotes and semicolons', () => {
      const sql = "INSERT INTO foo VALUES ('it''s a test; value');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        "INSERT INTO foo VALUES ('it''s a test; value')",
      ]);
    });

    it('handles empty strings', () => {
      const sql = "INSERT INTO foo VALUES ('');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual(["INSERT INTO foo VALUES ('')"]);
    });

    it('handles strings spanning multiple lines', () => {
      const sql = `INSERT INTO foo VALUES ('line1
line2');`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual(["INSERT INTO foo VALUES ('line1\nline2')"]);
    });
  });

  describe('escaped quotes', () => {
    it('handles SQL escaped quotes (double single quotes)', () => {
      const sql = "INSERT INTO foo VALUES ('it''s escaped');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual(["INSERT INTO foo VALUES ('it''s escaped')"]);
    });

    it('handles multiple escaped quotes', () => {
      const sql = "INSERT INTO foo VALUES ('it''s a ''test'' value');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        "INSERT INTO foo VALUES ('it''s a ''test'' value')",
      ]);
    });

    it('handles escaped quotes at string boundaries', () => {
      const sql = "INSERT INTO foo VALUES ('''');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual(["INSERT INTO foo VALUES ('''')"]);
    });

    it('handles escaped quotes with semicolons', () => {
      const sql = "INSERT INTO foo VALUES ('it''s; a test');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual(["INSERT INTO foo VALUES ('it''s; a test')"]);
    });
  });

  describe('line comments', () => {
    it('ignores semicolons in line comments', () => {
      const sql = 'SELECT * FROM users; -- comment with ; semicolon';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('handles line comments before statements', () => {
      const sql = '-- This is a comment\nSELECT * FROM users;';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('handles line comments after statements', () => {
      const sql = 'SELECT * FROM users; -- end comment';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('handles line comments in the middle of statements', () => {
      const sql = `SELECT * FROM users
-- comment in middle
WHERE id = 1;`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users\nWHERE id = 1']);
    });

    it('handles multiple line comments', () => {
      const sql = `-- comment 1
SELECT * FROM users;
-- comment 2
SELECT * FROM posts;`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
    });

    it('does not treat -- inside strings as comments', () => {
      const sql = "INSERT INTO foo VALUES ('-- not a comment');";
      const result = parseSqlStatements(sql);
      expect(result).toEqual(["INSERT INTO foo VALUES ('-- not a comment')"]);
    });
  });

  describe('block comments', () => {
    it('removes block comments', () => {
      const sql = 'SELECT * FROM users; /* block comment */';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('removes block comments with semicolons', () => {
      const sql = 'SELECT * FROM users; /* block with ; semicolon */';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('removes multi-line block comments', () => {
      const sql = `SELECT * FROM users;
/* multi-line
   block comment
   with ; semicolon */`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('removes block comments between statements', () => {
      const sql = `SELECT * FROM users;
/* comment */
SELECT * FROM posts;`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
    });

    it('removes nested block comments', () => {
      const sql = 'SELECT * FROM users; /* outer /* inner */ comment */';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      const result = parseSqlStatements('');
      expect(result).toEqual([]);
    });

    it('handles whitespace-only input', () => {
      const result = parseSqlStatements('   \n\t  ');
      expect(result).toEqual([]);
    });

    it('handles statement without trailing semicolon', () => {
      const sql = 'SELECT * FROM users';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('handles multiple statements where last has no semicolon', () => {
      const sql = 'SELECT * FROM users; SELECT * FROM posts';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
    });

    it('trims whitespace from statements', () => {
      const sql = '  SELECT * FROM users  ;  ';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users']);
    });

    it('handles multiple consecutive semicolons', () => {
      const sql = 'SELECT * FROM users;; SELECT * FROM posts;';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
    });

    it('handles semicolons with only whitespace between', () => {
      const sql = 'SELECT * FROM users;   ;   SELECT * FROM posts;';
      const result = parseSqlStatements(sql);
      expect(result).toEqual(['SELECT * FROM users', 'SELECT * FROM posts']);
    });
  });

  describe('complex scenarios', () => {
    it('handles all comment types together', () => {
      const sql = `-- line comment
SELECT * FROM users;
/* block comment */
INSERT INTO posts VALUES ('test''s value; with semicolon');
-- another comment`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        'SELECT * FROM users',
        "INSERT INTO posts VALUES ('test''s value; with semicolon')",
      ]);
    });

    it('handles real-world INSERT statement', () => {
      const sql = `INSERT INTO activities (title, description) VALUES
('Meeting', 'Team meeting; agenda: discuss project');
INSERT INTO activities (title) VALUES ('Lunch');`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        "INSERT INTO activities (title, description) VALUES\n('Meeting', 'Team meeting; agenda: discuss project')",
        "INSERT INTO activities (title) VALUES ('Lunch')",
      ]);
    });

    it('handles CREATE TABLE with complex string values', () => {
      const sql = `CREATE TABLE test (id INT);
INSERT INTO test VALUES (1);
INSERT INTO test VALUES (2); -- comment`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        'CREATE TABLE test (id INT)',
        'INSERT INTO test VALUES (1)',
        'INSERT INTO test VALUES (2)',
      ]);
    });

    it('handles strings with escaped quotes and comments', () => {
      const sql = `INSERT INTO foo VALUES ('it''s a test'); -- comment
INSERT INTO bar VALUES ('another ''value''');`;
      const result = parseSqlStatements(sql);
      expect(result).toEqual([
        "INSERT INTO foo VALUES ('it''s a test')",
        "INSERT INTO bar VALUES ('another ''value''')",
      ]);
    });
  });
});
