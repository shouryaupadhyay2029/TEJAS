import sqlite3
db = sqlite3.connect(r'backend\tejas.db')
c = db.cursor()
c.execute('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name')
tables = [r[0] for r in c.fetchall()]
print('Tables:')
for t in tables:
    cnt = c.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
    print(f'  {t}: {cnt} rows')
db.close()
