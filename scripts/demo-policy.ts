export function allowLocalDemo(command: string, mode: string, explicitFlag: string | undefined, hostname: string) {
  return command === 'serve' && mode === 'development' && explicitFlag === '1' && ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}