CREATE TABLE contacts (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 phone TEXT NOT NULL,
 email TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT 'Pessoal',
 company TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 favorite INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX contacts_name_idx ON contacts(name);
