-- Lets the super admin permanently delete a report from the admin panel.
-- Linked rows (source_links, accused, supports, evidence) are removed by their
-- ON DELETE CASCADE foreign keys, which run with the table owner's rights, so only
-- reports needs the extra privilege. The audit log stays append-only.
GRANT DELETE ON bnpnama.reports TO bnpnama_app;
