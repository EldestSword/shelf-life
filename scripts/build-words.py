"""Rebuild the offline dictionary from a local CMUdict source (no runtime fetch)."""
import json, pathlib, re, sys, hashlib
root = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1])
targets = json.loads((root/'public/data/targets.json').read_text(encoding='utf-8'))
pools = json.loads((root/'public/data/target-pools.json').read_text(encoding='utf-8'))
active = pools['core'] + pools['challenge']
if len(active) != len(set(active)) or not set(active) <= set(targets):
    raise ValueError('Target pools must contain unique words defined in targets.json')
words = {line.split(' ')[0].upper() for line in source.read_text(encoding='utf-8').splitlines() if re.fullmatch('[a-z]{7}', line.split(' ')[0])}
# British spellings and curated uncommon headwords supplement the US pronunciation list.
words.update('COLOURS FAVOURS HONOURS LABOURS SAVOURS SAVIOUR CENTRED CENTRES THEATRE FIBROUS GREYISH ORGANIC ORGANON REALISE REALISM REALIST ANALYSE CATALOG CATALOGUE'.split())
words = {w for w in words if re.fullmatch('[A-Z]{7}',w)} | set(targets)
data = {'allowed':' '.join(sorted(words)), 'answers':list(targets), 'core':pools['core'], 'challenge':pools['challenge'], 'definitions':{k:{'definition':v[0],'note':v[1]} for k,v in targets.items()}}
(root/'public/data/words.js').write_text("/* Derived from CMUdict; see WORDLIST-LICENCE.txt. */\n(function(r){const W="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";if(typeof module!=='undefined'&&module.exports)module.exports=W;else r.SHELF_WORDS=W;})(typeof window!=='undefined'?window:globalThis);\n",encoding='utf-8')
(root/'docs/WORD_SOURCES.md').write_text('# Word Vault editorial record\n\n'+str(len(active))+' active seven-letter targets ('+str(len(pools['core']))+' familiar and '+str(len(pools['challenge']))+' trickier), '+str(len(targets)-len(active))+' legacy definitions retained for save compatibility, and '+str(len(words))+' allowed guesses. New puzzles select a familiar word 80% of the time and a trickier word 20% of the time. Definitions and usage notes are original summaries. The broad CMUdict guess list includes names and US spellings; it never supplies targets automatically. No random inflections are used as padding for the target pool.\n\nCMUdict source: https://github.com/cmusphinx/cmudict\n\nSource SHA-256: `'+hashlib.sha256(source.read_bytes()).hexdigest()+'`\n\nRebuild: `python scripts/build-words.py /path/to/cmudict.dict`. The checked-in words.js is sufficient for all normal development and offline play.\n\nReference headwords (Merriam-Webster; researched 13 September 2026):\n\n'+'\n'.join('- ['+w+'](https://www.merriam-webster.com/dictionary/'+w.lower()+') — '+v[0] for w,v in targets.items())+'\n',encoding='utf-8')
print(f'{len(words)} guesses; {len(active)} active targets; {len(targets)-len(active)} legacy definitions')
