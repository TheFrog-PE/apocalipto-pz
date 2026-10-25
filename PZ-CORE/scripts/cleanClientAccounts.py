import sqlite3, os

user_profile = os.path.expanduser('~')
db_dir = os.path.join(user_profile, 'Zomboid', 'db')

for db_name in ['ServerListSteam.db', 'ServerList.db']:
    db_path = os.path.join(db_dir, db_name)
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("DELETE FROM account WHERE serverId IN (SELECT id FROM server WHERE name = 'Apocalipto PZ')")
            conn.commit()
            conn.close()
            print(f"Cleaned accounts from {db_name}")
        except Exception as e:
            print(f"Error {db_name}: {e}")
