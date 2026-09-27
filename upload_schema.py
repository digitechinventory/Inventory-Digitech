import paramiko
import os

def upload_file(local_path, remote_path):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('100.100.98.113', username='kraven', password='1256', timeout=15)
    
    sftp = client.open_sftp()
    print(f"Uploading {local_path} -> {remote_path} ({os.path.getsize(local_path)} bytes)...")
    sftp.put(local_path, remote_path)
    sftp.close()
    client.close()
    print("Upload complete!")

if __name__ == '__main__':
    upload_file('backend/schema_and_seed.sql', '/tmp/schema_and_seed.sql')
