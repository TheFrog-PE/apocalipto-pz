import sqlite3

conn = sqlite3.connect(r'C:\Users\The Frog\Zomboid\db\ApocaliptoPZ.db')
cur = conn.cursor()
bcrypt_hash = '$2a$12$O/BFHoDFPrfFaNPAACmWpuDEg/if.yPvM8N9H/d4teUaiE1tyDEGu'

cur.execute('UPDATE whitelist SET password = ? WHERE id >= 9', (bcrypt_hash,))
conn.commit()
print('Updated rows:', cur.rowcount)

cur.execute('SELECT id, world, username, password, role, steamid FROM whitelist')
for r in cur.fetchall():
    print(r)
conn.close()
