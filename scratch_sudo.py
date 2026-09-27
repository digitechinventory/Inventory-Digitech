import paramiko
import sys

def run_sudo_cmd(cmd):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('100.100.98.113', username='kraven', password='1256', timeout=15)
    
    stdin, stdout, stderr = client.exec_command(f'sudo -S {cmd}', get_pty=True)
    stdin.write('1256\n')
    stdin.flush()
    
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else 'whoami'
    sys.stdout.buffer.write(run_sudo_cmd(command).encode('utf-8'))
