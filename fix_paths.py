import paramiko
import sys

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.32.62.87', username='root', password=sys.argv[1])

sftp = ssh.open_sftp()

# Read file
with sftp.file('/home/homly/homly/.claude/skills/homly-agent/SKILL.md', 'rb') as f:
    content = f.read().decode('utf-8')

# Replace Windows paths with Linux
WIN_PATH = 'C:\\HomLy\\'
LINUX_PATH = '/home/homly/homly/'
content = content.replace(WIN_PATH, LINUX_PATH)

# Write back
with sftp.file('/home/homly/homly/.claude/skills/homly-agent/SKILL.md', 'wb') as f:
    f.write(content.encode('utf-8'))

sftp.close()

# Verify
_, o, _ = ssh.exec_command('grep neighborhoods /home/homly/homly/.claude/skills/homly-agent/SKILL.md')
print(o.read().decode())

ssh.close()
print('DONE')
