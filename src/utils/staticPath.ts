// Shared utility for static file paths
export function getStaticPath(path: string): string {
  const platform = uni.getSystemInfoSync().platform
  if (platform === 'h5' || platform === 'web') {
    return path
  }
  return '/' + path
}
