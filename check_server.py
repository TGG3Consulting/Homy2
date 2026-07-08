import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.32.62.87', username='root', password='r?T2w7o9KZJzw{(L')

commands = [
    'cat /home/homly/.claude/settings.json 2>/dev/null || echo "No settings.json"',
    'cat /home/homly/homly/.claude/mcp.json 2>/dev/null || echo "No mcp.json"',
    'sudo -u homly psql -d homly_db -c "SELECT COUNT(*) FROM properties;" 2>&1',
    'ls -la /home/homly/.claude/ 2>/dev/null || echo "No .claude dir"',
]

for cmd in commands:
    print(f"\n=== {cmd[:50]}... ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f"ERR: {err}")

ssh.close()
