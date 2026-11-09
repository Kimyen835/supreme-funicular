import sqlite3
import os

for path in ['c:/CAFE4/cafe.db', 'c:/CAFE4/backend/cafe.db', 'cafe.db']:
    if os.path.exists(path):
        print(f"Checking database at: {path}")
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        
        tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        
        if 'bangluong' in tables:
            cols_bl = [r[1] for r in cursor.execute('PRAGMA table_info(bangluong)').fetchall()]
            if 'PhatDiTre' not in cols_bl:
                cursor.execute('ALTER TABLE bangluong ADD COLUMN PhatDiTre REAL DEFAULT 0.0')
                print(f'Added PhatDiTre to bangluong in {path}')
            if 'TrangThai' not in cols_bl:
                cursor.execute('ALTER TABLE bangluong ADD COLUMN TrangThai TEXT DEFAULT "Chờ chi trả"')
                print(f'Added TrangThai to bangluong in {path}')

        if 'chamcong' in tables:
            cols_cc = [r[1] for r in cursor.execute('PRAGMA table_info(chamcong)').fetchall()]
            if 'DiTrePhut' not in cols_cc:
                cursor.execute('ALTER TABLE chamcong ADD COLUMN DiTrePhut INTEGER DEFAULT 0')
                print(f'Added DiTrePhut to chamcong in {path}')
            if 'VeSomPhut' not in cols_cc:
                cursor.execute('ALTER TABLE chamcong ADD COLUMN VeSomPhut INTEGER DEFAULT 0')
                print(f'Added VeSomPhut to chamcong in {path}')
            if 'TrangThai' not in cols_cc:
                cursor.execute('ALTER TABLE chamcong ADD COLUMN TrangThai TEXT DEFAULT "Đúng giờ"')
                print(f'Added TrangThai to chamcong in {path}')

        if 'hoadon' in tables:
            cols_hd = [r[1] for r in cursor.execute('PRAGMA table_info(hoadon)').fetchall()]
            if 'SoTheBan' not in cols_hd:
                cursor.execute('ALTER TABLE hoadon ADD COLUMN SoTheBan TEXT DEFAULT NULL')
                print(f'Added SoTheBan to hoadon in {path}')

        if 'chitiethoadon' in tables:
            cols_cthd = [r[1] for r in cursor.execute('PRAGMA table_info(chitiethoadon)').fetchall()]
            if 'GhiChu' not in cols_cthd:
                cursor.execute('ALTER TABLE chitiethoadon ADD COLUMN GhiChu TEXT DEFAULT NULL')
                print(f'Added GhiChu to chitiethoadon in {path}')

        if 'khachhang' in tables:
            existing = [r[0] for r in cursor.execute('SELECT MaKH FROM khachhang').fetchall()]
            if 'KH004' not in existing:
                cursor.execute("INSERT INTO khachhang (MaKH, TenKH, SDT, DiemTichLuy) VALUES ('KH004', 'Phạm Minh Tuấn', '0905123456', 2500)")
                print(f'Inserted KH004 (2500 pts) into {path}')
            if 'KH005' not in existing:
                cursor.execute("INSERT INTO khachhang (MaKH, TenKH, SDT, DiemTichLuy) VALUES ('KH005', 'Đặng Kim Yến', '0909888999', 6500)")
                print(f'Inserted KH005 (6500 pts) into {path}')

        if 'nhanvien' in tables:
            cols_nv = [r[1] for r in cursor.execute('PRAGMA table_info(nhanvien)').fetchall()]
            if 'GioiTinh' not in cols_nv:
                cursor.execute('ALTER TABLE nhanvien ADD COLUMN GioiTinh TEXT DEFAULT "Nam"')
                print(f'Added GioiTinh to nhanvien in {path}')
            if 'DiaChi' not in cols_nv:
                cursor.execute('ALTER TABLE nhanvien ADD COLUMN DiaChi TEXT DEFAULT ""')
                print(f'Added DiaChi to nhanvien in {path}')
            if 'TrangThai' not in cols_nv:
                cursor.execute('ALTER TABLE nhanvien ADD COLUMN TrangThai TEXT DEFAULT "Đang làm việc"')
                print(f'Added TrangThai to nhanvien in {path}')

        conn.commit()
        conn.close()

print("Schema migration complete.")
