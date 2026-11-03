// Generates a reviewed SQL publication script; it never connects to or updates a database.
import fs from 'node:fs/promises';
import path from 'node:path';
const source=process.argv[2],destination=process.argv[3];
if(!source||!destination)throw new Error('Usage: node tools/publish-user-agreement.mjs agreement.json reviewed-publication.sql');
const document=JSON.parse(await fs.readFile(source,'utf8'));
if(typeof document.version!=='string'||!document.version.trim()||document.minimumAge!==18||!document.title||!Array.isArray(document.sections)||!document.sections.length||document.sections.some(s=>!s.title||!Array.isArray(s.paragraphs)||s.paragraphs.some(p=>typeof p!=='string'||!p.trim())))throw new Error('Agreement must have a version, title, age 18 and readable sections/paragraphs.');
const json=JSON.stringify(document).replaceAll("'","''");
const sql=`BEGIN;
DO $publish$ DECLARE body jsonb:='${json}'::jsonb; hash_value text;
BEGIN
 hash_value:=encode(sha256(convert_to(body::text,'UTF8')),'hex');
 IF EXISTS(SELECT 1 FROM public.brl_agreement_versions WHERE version=body->>'version' AND document_hash<>hash_value) THEN RAISE EXCEPTION 'Use a new version identifier for changed text.';END IF;
 IF EXISTS(SELECT 1 FROM public.brl_agreement_versions WHERE version=body->>'version') AND NOT EXISTS(SELECT 1 FROM public.brl_agreement_config WHERE id AND current_version=body->>'version') THEN RAISE EXCEPTION 'Do not reactivate an archived version. Publish a new version identifier.';END IF;
 INSERT INTO public.brl_agreement_versions(version,document,document_hash) VALUES(body->>'version',body,hash_value) ON CONFLICT(version) DO NOTHING;
 UPDATE public.brl_agreement_config SET current_version=body->>'version' WHERE id;
END $publish$;
NOTIFY pgrst,'reload schema';
COMMIT;
`;
await fs.mkdir(path.dirname(path.resolve(destination)),{recursive:true});await fs.writeFile(destination,sql);process.stdout.write(`Publication script created: ${destination}\nRun it only after reviewing the new agreement version.\n`);
